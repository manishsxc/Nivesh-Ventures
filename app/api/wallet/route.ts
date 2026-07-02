import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select(
    "walletBalance nivshWalletBalance usdtWalletBalance usdtWalletAddress " +
    "totalReferralIncome totalMatchingIncome totalReturnsIncome totalLevelIncome totalRewardIncome " +
    "totalInvestment totalWithdrawn"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const transactions = await Transaction.find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .limit(100);

  const totalEarnings =
    (user.totalReferralIncome || 0) +
    (user.totalMatchingIncome || 0) +
    (user.totalReturnsIncome || 0) +
    (user.totalLevelIncome || 0) +
    (user.totalRewardIncome || 0);

  return NextResponse.json({ wallet: user, transactions, totalEarnings });
}
