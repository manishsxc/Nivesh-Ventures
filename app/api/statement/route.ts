import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("walletBalance");
  const entries = await Transaction.find({ memberId: session.memberId }).sort({ createdAt: -1 }).limit(200);

  return NextResponse.json({ closingBalance: user?.walletBalance ?? 0, entries });
}
