import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select(
    "-accessKeyHash -loginKeyHash -firebaseUid"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const directCount = await User.countDocuments({ sponsorId: user.memberId });
  const leftCount = await User.countDocuments({ parentId: user.memberId, position: "left" });
  const rightCount = await User.countDocuments({ parentId: user.memberId, position: "right" });

  // Full downline count via parentId chain (simple BFS since binary trees stay shallow-ish).
  async function countTeam(rootId: string): Promise<number> {
    let total = 0;
    let frontier = [rootId];
    while (frontier.length) {
      const children = await User.find({ parentId: { $in: frontier } }).select("memberId");
      total += children.length;
      frontier = children.map((c) => c.memberId);
    }
    return total;
  }
  const totalTeam = await countTeam(user.memberId);

  return NextResponse.json({
    user,
    stats: {
      direct: directCount,
      leftTeam: leftCount,
      rightTeam: rightCount,
      totalTeam,
    },
  });
}
