import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notice from "@/models/Notice";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  await connectDB();
  const status = req.nextUrl.searchParams.get("status") || "under_review";
  const members = await User.find({ kycStatus: status }).select("memberId fullName email kycDocs kycStatus");
  return NextResponse.json({ members });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { memberId, decision } = await req.json();
  if (!memberId || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "memberId and valid decision required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOneAndUpdate({ memberId }, { kycStatus: decision }, { new: true }).select(
    "memberId kycStatus"
  );
  if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await Notice.create({
    title: decision === "approved" ? "KYC Approved" : "KYC Rejected",
    message:
      decision === "approved"
        ? "Your KYC documents have been verified and approved."
        : "Your KYC submission was rejected — documents were unclear or invalid. Please resubmit clear, real copies.",
    audience: "specific",
    targetMemberId: memberId,
  });

  return NextResponse.json({ success: true, user });
}
