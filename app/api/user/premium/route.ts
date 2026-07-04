import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSessionFromCookies } from "@/lib/auth-server";
import { notifyMember } from "@/lib/notification";

export const dynamic = "force-dynamic";

// POST: Purchase Premium Membership ($30)
export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ memberId: session.memberId });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Expiry check
  const now = new Date();
  if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
    return NextResponse.json({ error: "Duplicate purchase prevented. Your Premium Membership is already active." }, { status: 400 });
  }

  // Cost is $30
  const cost = 30;
  if (user.walletBalance < cost) {
    return NextResponse.json({ error: "Insufficient wallet balance. You need $30 to purchase Premium Membership." }, { status: 400 });
  }

  const isRenewal = user.isPremium; // if was premium before, it's a renewal

  // Deduct balance and activate premium
  user.walletBalance -= cost;
  user.isPremium = true;
  user.premiumActivatedAt = now;
  user.premiumExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
  await user.save();

  // Create Transaction Record
  const txn = await Transaction.create({
    memberId: user.memberId,
    type: isRenewal ? "premium_renewal" : "premium_activation",
    direction: "debit",
    amount: cost,
    currency: "USDT",
    status: "completed",
    note: isRenewal ? "Premium Membership Renewal" : "Premium Membership Activation",
  });

  // Notify user
  notifyMember(
    user.memberId,
    isRenewal ? "Premium Renewed Successfully! 👑" : "Premium Membership Activated! 👑",
    isRenewal 
      ? `Your Premium Membership was successfully renewed for 1 year. Expiry: ${user.premiumExpiresAt.toLocaleDateString()}`
      : `Welcome to Premium! Your membership is active until ${user.premiumExpiresAt.toLocaleDateString()}. Enjoy exclusive privileges.`,
    isRenewal ? "premium_renewed" : "premium_activated",
    txn._id
  ).catch(() => {});

  return NextResponse.json({
    success: true,
    isPremium: user.isPremium,
    premiumActivatedAt: user.premiumActivatedAt,
    premiumExpiresAt: user.premiumExpiresAt,
    walletBalance: user.walletBalance,
  });
}
