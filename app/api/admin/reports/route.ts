import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const type = req.nextUrl.searchParams.get("type") || "member";
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const dateFilter: any = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  const hasRange = Object.keys(dateFilter).length > 0;

  await connectDB();

  if (type === "member") {
    const query = hasRange ? { createdAt: dateFilter } : {};
    const members = await User.find(query).select("memberId fullName email isActive rank createdAt").sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ type, rows: members });
  }

  if (type === "income") {
    const incomeTypes = ["referral_income", "matching_income", "returns_income", "level_income", "reward_income"];
    const query: any = { type: { $in: incomeTypes } };
    if (hasRange) query.createdAt = dateFilter;
    const rows = await Transaction.find(query).sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ type, rows });
  }

  if (type === "withdrawal") {
    const query = hasRange ? { createdAt: dateFilter } : {};
    const rows = await Withdrawal.find(query).sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ type, rows });
  }

  if (type === "transaction") {
    const query = hasRange ? { createdAt: dateFilter } : {};
    const rows = await Transaction.find(query).sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ type, rows });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
