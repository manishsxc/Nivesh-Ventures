import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notice from "@/models/Notice";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const notices = await Notice.find({
    $or: [{ audience: "all" }, { audience: "specific", targetMemberId: session.memberId }],
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return NextResponse.json({ notices });
}
