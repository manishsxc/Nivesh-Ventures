import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();

  const directTeam = await User.find({ sponsorId: session.memberId }).select(
    "memberId fullName isActive position createdAt accessExpiresAt rank"
  );

  const leftChild = await User.findOne({ parentId: session.memberId, position: "left" }).select(
    "memberId fullName isActive rank"
  );
  const rightChild = await User.findOne({ parentId: session.memberId, position: "right" }).select(
    "memberId fullName isActive rank"
  );

  return NextResponse.json({
    directTeam,
    tree: { left: leftChild, right: rightChild },
  });
}
