import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notice from "@/models/Notice";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  await connectDB();
  const notices = await Notice.find().sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ notices });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { title, message, audience, targetMemberId } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

  await connectDB();
  const notice = await Notice.create({
    title,
    message,
    audience: audience || "all",
    targetMemberId: audience === "specific" ? targetMemberId : null,
  });

  return NextResponse.json({ success: true, notice });
}
