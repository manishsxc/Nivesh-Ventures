import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminWalletTransaction from "@/models/AdminWalletTransaction";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("boosterWalletBalance");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const transactions = await AdminWalletTransaction.find({
    userId: user._id,
    walletType: "booster",
  })
    .sort({ createdAt: -1 })
    .limit(200);

  // Calculate totals
  let totalCredits = 0;
  let totalDebits = 0;
  transactions.forEach((t: any) => {
    if (t.type === "credit") totalCredits += t.amount;
    else totalDebits += t.amount;
  });

  return NextResponse.json({
    balance: user.boosterWalletBalance || 0,
    transactions,
    totalCredits,
    totalDebits,
  });
}
