import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FraudFlag from "@/models/FraudFlag";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";
import { getSessionFromCookies } from "@/lib/auth-server";
import { analyzeUserFraud } from "@/lib/fraud";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const url = req.nextUrl;
  const riskThreshold = parseInt(url.searchParams.get("riskThreshold") || "0");

  const flags = await FraudFlag.find({ riskScore: { $gte: riskThreshold } })
    .sort({ riskScore: -1 })
    .lean();

  return NextResponse.json({ flags });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { memberId, action, riskScore, isBlocked, adminNote } = body;

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  let fraudFlag = await FraudFlag.findOne({ memberId });
  if (!fraudFlag) {
    fraudFlag = await FraudFlag.create({ memberId });
  }

  if (action === "update_score") {
    fraudFlag.riskScore = Math.min(100, Math.max(0, riskScore));
    fraudFlag.adminNote = adminNote || fraudFlag.adminNote;
    await fraudFlag.save();
  } else if (action === "block") {
    fraudFlag.isBlocked = isBlocked;
    fraudFlag.adminNote = adminNote || fraudFlag.adminNote;
    await fraudFlag.save();

    // Update main User schema if blocked
    await User.updateOne({ memberId }, { $set: { withdrawalsEnabled: !isBlocked } });
  } else if (action === "analyze") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const result = await analyzeUserFraud(memberId, ip, ua);
    return NextResponse.json({ success: true, ...result });
  }

  return NextResponse.json({ success: true, fraudFlag });
}
