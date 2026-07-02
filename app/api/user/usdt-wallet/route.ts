import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import { generateOtp, hashSecret, compareSecret, getSessionFromCookies } from "@/lib/auth-server";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { action, newAddress, otp } = await req.json();

    await connectDB();
    const user = await User.findOne({ memberId: session.memberId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "send-otp") {
      const code = generateOtp();
      const codeHash = await hashSecret(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Otp.create({
        email: user.email.toLowerCase(),
        codeHash,
        purpose: "usdt_change",
        expiresAt,
      });

      await sendMail(
        user.email,
        "Verify your USDT address change",
        otpEmailTemplate(code)
      );

      return NextResponse.json({ success: true, message: "OTP sent to your email" });
    }

    if (action === "verify-otp") {
      if (!newAddress || !otp) {
        return NextResponse.json({ error: "New USDT address and OTP are required" }, { status: 400 });
      }

      const otpDoc = await Otp.findOne({
        email: user.email.toLowerCase(),
        purpose: "usdt_change",
        consumed: false,
      }).sort({ createdAt: -1 });

      if (!otpDoc || otpDoc.expiresAt < new Date()) {
        return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
      }

      const valid = await compareSecret(otp, otpDoc.codeHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }

      otpDoc.consumed = true;
      await otpDoc.save();

      user.usdtWalletAddress = newAddress.trim();
      await user.save();

      return NextResponse.json({ success: true, message: "USDT wallet address updated successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update USDT address" }, { status: 500 });
  }
}
