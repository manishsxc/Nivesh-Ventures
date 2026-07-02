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
    "totalReferralIncome totalMatchingIncome totalReturnsIncome totalLevelIncome totalRewardIncome"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const incomeTypes = [
    "referral_income",
    "matching_income",
    "returns_income",
    "level_income",
    "reward_income",
  ];
  const history = await Transaction.find({
    memberId: session.memberId,
    type: { $in: incomeTypes },
  })
    .sort({ createdAt: -1 })
    .limit(100);

  return NextResponse.json({ totals: user, history });
}
