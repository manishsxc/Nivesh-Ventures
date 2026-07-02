import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import { compareSecret } from "@/lib/auth-server";
import { updateFirebaseUserPasswordByEmail } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const otpDoc = await Otp.findOne({ email: email.toLowerCase(), purpose: "reset_password", consumed: false }).sort({ createdAt: -1 });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired or not found" }, { status: 400 });
    }

    const valid = await compareSecret(otp, otpDoc.codeHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // consume OTP
    otpDoc.consumed = true;
    await otpDoc.save();

    // update password via Firebase Admin
    await updateFirebaseUserPasswordByEmail(email.toLowerCase(), newPassword);

    return NextResponse.json({ success: true, message: "Password updated. You can now log in." });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to reset password" }, { status: 500 });
  }
}
