import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WebsiteSettings from "@/models/WebsiteSettings";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  await connectDB();
  let settings = await WebsiteSettings.findOne({ key: "singleton" });
  if (!settings) settings = await WebsiteSettings.create({ key: "singleton" });
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  await connectDB();
  const settings = await WebsiteSettings.findOneAndUpdate({ key: "singleton" }, body, {
    new: true,
    upsert: true,
  });
  return NextResponse.json({ success: true, settings });
}
