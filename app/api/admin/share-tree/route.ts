import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";

async function nodeSummary(memberId: string) {
  const shared = await User.find({ sponsorId: memberId }).select(
    "memberId fullName createdAt firstDepositRewarded"
  );
  const sharedCount = shared.length;
  const successfulCount = shared.filter((s) => s.firstDepositRewarded).length;
  return { shared, sharedCount, successfulCount };
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const expandId = req.nextUrl.searchParams.get("memberId");

  if (expandId) {
    // Node click: show this member's direct shares + each child's own counts.
    const { shared } = await nodeSummary(expandId);
    const children = await Promise.all(
      shared.map(async (s) => {
        const summary = await nodeSummary(s.memberId);
        return {
          memberId: s.memberId,
          fullName: s.fullName,
          joinedAt: s.createdAt,
          walletCredited: s.firstDepositRewarded,
          sharedCount: summary.sharedCount,
          successfulCount: summary.successfulCount,
        };
      })
    );
    return NextResponse.json({ memberId: expandId, children });
  }

  // Top-level leaderboard: every member with at least one share, ranked by successful conversions.
  const allMembers = await User.find({ role: "member" }).select("memberId fullName");
  const rows = await Promise.all(
    allMembers.map(async (m) => {
      const summary = await nodeSummary(m.memberId);
      return {
        memberId: m.memberId,
        fullName: m.fullName,
        sharedCount: summary.sharedCount,
        successfulCount: summary.successfulCount,
      };
    })
  );

  const ranked = rows
    .filter((r) => r.sharedCount > 0)
    .sort((a, b) => b.successfulCount - a.successfulCount || b.sharedCount - a.sharedCount);

  return NextResponse.json({ leaderboard: ranked });
}
