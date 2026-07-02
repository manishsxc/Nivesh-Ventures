import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Investment from "@/models/Investment";
import Transaction from "@/models/Transaction";
import BusinessHistory from "@/models/BusinessHistory";
import { getSessionFromCookies } from "@/lib/auth-server";

const MIN_INVESTMENT = 100;
const LOCK_IN_MONTHS = 11;

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const investments = await Investment.find({ memberId: session.memberId }).sort({ createdAt: -1 });
  return NextResponse.json({ investments });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { amount } = await req.json();
    if (!amount || amount < MIN_INVESTMENT) {
      return NextResponse.json({ error: `Minimum investment is $${MIN_INVESTMENT}` }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ memberId: session.memberId });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    const lockInEndsAt = new Date();
    lockInEndsAt.setMonth(lockInEndsAt.getMonth() + LOCK_IN_MONTHS);

    const investment = await Investment.create({
      memberId: user.memberId,
      amount,
      lockInEndsAt,
    });

    user.walletBalance -= amount;
    user.totalInvestment += amount;
    await user.save();

    await Transaction.create({
      memberId: user.memberId,
      type: "investment",
      direction: "debit",
      amount,
      currency: "USDT",
      status: "completed",
      note: "Nivesh investment",
      referenceId: investment._id.toString(),
    });
    await BusinessHistory.create({ memberId: user.memberId, kind: "nivesh", amount, note: "Investment" });

    return NextResponse.json({ success: true, investment });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Investment failed" }, { status: 500 });
  }
}
