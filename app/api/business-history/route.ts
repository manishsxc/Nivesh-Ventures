import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import BusinessHistory from "@/models/BusinessHistory";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const history = await BusinessHistory.find({ memberId: session.memberId }).sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ history });
}
