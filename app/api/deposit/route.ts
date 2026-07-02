import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import WebsiteSettings from "@/models/WebsiteSettings";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await connectDB();
  const deposits = await Deposit.find({ memberId: session.memberId }).sort({ createdAt: -1 });
  const settings = await WebsiteSettings.findOne({ key: "singleton" });
  return NextResponse.json({
    deposits,
    walletAddress: process.env.DEPOSIT_USDT_ADDRESS || settings?.paymentUsdtAddress || "",
    paymentQrUrl: settings?.paymentQrUrl || "",
    bankDetails: settings?.bankDetails || null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { txnHash, paymentSlipUrl, amount } = await req.json();
  if (!txnHash) return NextResponse.json({ error: "Transaction ID / Hash is required" }, { status: 400 });

  await connectDB();
  const deposit = await Deposit.create({
    memberId: session.memberId,
    txnHash,
    paymentSlipUrl: paymentSlipUrl || "",
    amount: amount || 0,
    status: "pending",
  });

  return NextResponse.json({ success: true, deposit });
}
