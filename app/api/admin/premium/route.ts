import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";
import { notifyMember } from "@/lib/notification";

export const dynamic = "force-dynamic";

// GET: List all users with premium filters
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const url = req.nextUrl;
  const status = url.searchParams.get("status") || ""; // "active", "expired", "non_premium"
  const q = url.searchParams.get("q") || "";

  const query: any = {};
  const now = new Date();

  if (status === "active") {
    query.isPremium = true;
    query.premiumExpiresAt = { $gt: now };
  } else if (status === "expired") {
    query.isPremium = true;
    query.premiumExpiresAt = { $lte: now };
  } else if (status === "non_premium") {
    query.isPremium = false;
  }

  if (q) {
    query.$or = [
      { memberId: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("memberId fullName email mobile isPremium premiumActivatedAt premiumExpiresAt createdAt")
    .sort({ premiumActivatedAt: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ users });
}

// PATCH: Manually activate, deactivate, extend or revoke premium membership
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { memberId, action, extendDays } = body;

  if (!memberId || !action) {
    return NextResponse.json({ error: "memberId and action are required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ memberId });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();

  if (action === "activate") {
    user.isPremium = true;
    user.premiumActivatedAt = now;
    user.premiumExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await user.save();

    notifyMember(
      user.memberId,
      "Premium Activated by Admin 👑",
      `An administrator has activated your Premium Membership until ${user.premiumExpiresAt.toLocaleDateString()}.`,
      "premium_activated"
    ).catch(() => {});
  } else if (action === "deactivate") {
    user.isPremium = false;
    user.premiumActivatedAt = null;
    user.premiumExpiresAt = null;
    await user.save();

    notifyMember(
      user.memberId,
      "Premium Membership Revoked ⚠️",
      "Your Premium Membership has been cancelled or revoked by the administrator.",
      "premium_expired"
    ).catch(() => {});
  } else if (action === "extend") {
    const days = parseInt(extendDays || "30");
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: "Invalid days value" }, { status: 400 });
    }

    const currentExpiry = user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
    user.premiumExpiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    user.isPremium = true;
    if (!user.premiumActivatedAt) user.premiumActivatedAt = now;
    await user.save();

    notifyMember(
      user.memberId,
      "Premium Expiry Extended 👑",
      `An administrator has extended your Premium Membership. New Expiry: ${user.premiumExpiresAt.toLocaleDateString()}`,
      "premium_activated"
    ).catch(() => {});
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user: {
      memberId: user.memberId,
      isPremium: user.isPremium,
      premiumActivatedAt: user.premiumActivatedAt,
      premiumExpiresAt: user.premiumExpiresAt,
    },
  });
}
