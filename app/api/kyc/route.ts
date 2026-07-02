import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("kycStatus kycDocs");
  return NextResponse.json({ kycStatus: user?.kycStatus, kycDocs: (user as any)?.kycDocs || {} });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { aadhaarUrl, panUrl, bankProofUrl } = await req.json();
  if (!aadhaarUrl || !panUrl || !bankProofUrl) {
    return NextResponse.json({ error: "All three document links are required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.kycStatus = "under_review";
  (user as any).kycDocs = { aadhaarUrl, panUrl, bankProofUrl };
  await user.save();

  return NextResponse.json({ success: true, kycStatus: user.kycStatus });
}
