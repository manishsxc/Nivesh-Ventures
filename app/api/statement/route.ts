import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET(req: any) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("walletBalance");

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const query: any = { memberId: session.memberId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set end of day for the end date to include all transactions on that day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const entries = await Transaction.find(query).sort({ createdAt: -1 }).limit(200);

  return NextResponse.json({ closingBalance: user?.walletBalance ?? 0, entries });
}
