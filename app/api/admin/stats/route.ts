import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();

  const [totalMembers, activeMembers, pendingWithdrawals, approvedWithdrawals] = await Promise.all([
    User.countDocuments({ role: "member" }),
    User.countDocuments({ role: "member", isActive: true }),
    Withdrawal.countDocuments({ status: "pending" }),
    Withdrawal.countDocuments({ status: { $in: ["approved", "completed"] } }),
  ]);

  const incomeAgg = await Transaction.aggregate([
    { $match: { direction: "credit", status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalIncome = incomeAgg[0]?.total || 0;

  const recentRegistrations = await User.find({ role: "member" })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("memberId fullName email createdAt isActive");

  const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);

  return NextResponse.json({
    totalMembers,
    activeMembers,
    totalIncome,
    pendingWithdrawals,
    approvedWithdrawals,
    recentRegistrations,
    recentTransactions,
  });
}
