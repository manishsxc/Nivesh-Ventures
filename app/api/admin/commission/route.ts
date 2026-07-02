import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Commission from "@/models/Commission";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  await connectDB();
  let commission = await Commission.findOne({ key: "singleton" });
  if (!commission) commission = await Commission.create({ key: "singleton" });
  return NextResponse.json({ commission });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const body = await req.json();
  await connectDB();
  const commission = await Commission.findOneAndUpdate({ key: "singleton" }, body, { new: true, upsert: true });
  return NextResponse.json({ success: true, commission });
}
