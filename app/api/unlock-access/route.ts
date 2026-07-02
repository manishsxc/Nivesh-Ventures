import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import BusinessHistory from "@/models/BusinessHistory";
import { getSessionFromCookies } from "@/lib/auth-server";

const RENEWAL_AMOUNT = 30;
const VALIDITY_DAYS = 365;

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await connectDB();
  const user = await User.findOne({ memberId: session.memberId }).select("isActive accessExpiresAt");
  return NextResponse.json({ isActive: user?.isActive, accessExpiresAt: user?.accessExpiresAt });
}

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.walletBalance < RENEWAL_AMOUNT) {
    return NextResponse.json({ error: "Insufficient wallet balance. Deposit funds first." }, { status: 400 });
  }

  const now = new Date();
  const base = user.accessExpiresAt && user.accessExpiresAt > now ? user.accessExpiresAt : now;
  const newExpiry = new Date(base.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  user.walletBalance -= RENEWAL_AMOUNT;
  user.isActive = true;
  user.accessExpiresAt = newExpiry;
  await user.save();

  await Transaction.create({
    memberId: user.memberId,
    type: "unlock_access",
    direction: "debit",
    amount: RENEWAL_AMOUNT,
    currency: "USDT",
    status: "completed",
    note: "Unlock Access renewal (365 days)",
  });
  await BusinessHistory.create({
    memberId: user.memberId,
    kind: "renewal",
    amount: RENEWAL_AMOUNT,
    note: "Unlock Access renewal",
  });

  // Check sponsor's booster eligibility
  if (user.sponsorId) {
    try {
      const { checkAndAwardBooster } = await import("@/lib/booster");
      await checkAndAwardBooster(user.sponsorId);
    } catch (e) {
      console.error("Booster check failed:", e);
    }
  }

  return NextResponse.json({ success: true, accessExpiresAt: newExpiry });
}
