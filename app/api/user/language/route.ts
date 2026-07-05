import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromCookies } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { language } = body;

  if (!language || !["en", "hi"].includes(language)) {
    return NextResponse.json({ error: "Invalid language. Allowed: en, hi" }, { status: 400 });
  }

  await connectDB();
  await User.updateOne({ memberId: session.memberId }, { $set: { languagePreference: language } });

  return NextResponse.json({ success: true, language });
}
