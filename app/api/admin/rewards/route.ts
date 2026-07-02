import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RewardTier from "@/models/RewardTier";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  await connectDB();
  const tiers = await RewardTier.find().sort({ rewardAmount: 1 });
  return NextResponse.json({ tiers });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { code, leftRequirement, rightRequirement, rewardAmount } = await req.json();
  if (!code || !leftRequirement || !rightRequirement || !rewardAmount) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  await connectDB();
  const tier = await RewardTier.create({ code, leftRequirement, rightRequirement, rewardAmount });
  return NextResponse.json({ success: true, tier });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await connectDB();
  const tier = await RewardTier.findByIdAndUpdate(id, updates, { new: true });
  return NextResponse.json({ success: true, tier });
}
