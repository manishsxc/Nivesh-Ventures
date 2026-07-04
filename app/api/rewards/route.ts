import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RewardHistory from "@/models/RewardHistory";
import { getSessionFromCookies } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const logs = await RewardHistory.find({ memberId: session.memberId }).sort({ createdAt: -1 });

  // Group by type
  const breakdown: Record<string, number> = {};
  let totalEarned = 0;

  logs.forEach((log) => {
    if (log.status === "released") {
      breakdown[log.rewardType] = (breakdown[log.rewardType] || 0) + log.amount;
      totalEarned += log.amount;
    }
  });

  return NextResponse.json({
    logs,
    breakdown,
    totalEarned,
  });
}
