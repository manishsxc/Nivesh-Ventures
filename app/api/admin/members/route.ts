import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const search = req.nextUrl.searchParams.get("q") || "";

  const query = search
    ? {
        role: "member",
        $or: [
          { memberId: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : { role: "member" };

  const members = await User.find(query)
    .select("-accessKeyHash -loginKeyHash -firebaseUid")
    .sort({ isPinned: -1, sortOrder: 1, createdAt: -1 })
    .limit(200);

  return NextResponse.json({ members });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { memberId, isActive, isPinned, sortOrder, action } = body;
  
  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ memberId });
  if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (action === "pin") {
    user.isPinned = isPinned ?? !user.isPinned;
    await user.save();
    return NextResponse.json({ success: true, member: user });
  }

  if (action === "reorder") {
    if (typeof sortOrder === "number") {
      user.sortOrder = sortOrder;
      await user.save();
      return NextResponse.json({ success: true, member: user });
    }
  }

  if (typeof isActive === "boolean") {
    user.isActive = isActive;
    if (isActive) {
      // If user has never been activated before (or has no expiry), set a new 365-day expiry
      if (!user.accessExpiresAt || user.accessExpiresAt < new Date()) {
        user.accessExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    }
    await user.save();

    // Trigger sponsor's booster calculation if user is activated
    if (isActive && user.sponsorId) {
      try {
        const { checkAndAwardBooster } = await import("@/lib/booster");
        await checkAndAwardBooster(user.sponsorId);
      } catch (e) {
        console.error("Booster check failed:", e);
      }
    }
  }

  return NextResponse.json({ success: true, member: user });
}
