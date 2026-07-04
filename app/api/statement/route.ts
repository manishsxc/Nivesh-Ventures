import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import AdminWalletTransaction from "@/models/AdminWalletTransaction";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET(req: any) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("walletBalance _id");

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

  // Fetch admin wallet transactions for this user
  const adminQuery: any = { userId: user?._id };
  if (startDate || endDate) {
    adminQuery.createdAt = {};
    if (startDate) adminQuery.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      adminQuery.createdAt.$lte = end;
    }
  }
  const adminEntries = await AdminWalletTransaction.find(adminQuery).sort({ createdAt: -1 }).limit(200);

  // Normalize admin entries to match regular transaction shape + extra fields
  const normalizedAdmin = adminEntries.map((a: any) => ({
    _id: a._id,
    type: `admin_${a.type}`,
    direction: a.type, // credit or debit
    amount: a.amount,
    currency: "INR",
    status: "completed",
    note: a.adminRemarks,
    createdAt: a.createdAt,
    isAdmin: true,
    walletType: a.walletType,
    transactionId: a.transactionId,
    balanceBefore: a.balanceBefore,
    balanceAfter: a.balanceAfter,
    adminRemarks: a.adminRemarks,
  }));

  // Merge and sort by date descending
  const allEntries = [...entries.map((e: any) => ({ ...e.toObject(), isAdmin: false })), ...normalizedAdmin]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 300);

  return NextResponse.json({ closingBalance: user?.walletBalance ?? 0, entries: allEntries });
}
