import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import AdminBroadcast from "@/models/AdminBroadcast";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";
import { resolveAudience, sendBroadcast } from "@/lib/notification";
import { getSessionFromCookies } from "@/lib/auth-server";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

// GET: List all broadcast notifications with stats
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [broadcasts, total] = await Promise.all([
    AdminBroadcast.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminBroadcast.countDocuments({}),
  ]);

  // Get stats
  const totalNotifications = await Notification.countDocuments({});
  const unreadNotifications = await Notification.countDocuments({ read: false });

  return NextResponse.json({
    broadcasts,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: {
      totalNotifications,
      unreadNotifications,
      totalBroadcasts: total,
    },
  });
}

// POST: Create and send a broadcast notification
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { title, message, audience, targetUserIds } = body;

  if (!title || !message || !audience) {
    return NextResponse.json({ error: "Title, message, and audience are required" }, { status: 400 });
  }

  const validAudiences = ["all", "active", "inactive", "premium", "selected"];
  if (!validAudiences.includes(audience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  if (audience === "selected" && (!targetUserIds || targetUserIds.length === 0)) {
    return NextResponse.json({ error: "Target user IDs are required for 'selected' audience" }, { status: 400 });
  }

  await connectDB();

  // Find admin user
  const adminUser = await User.findOne({ memberId: session.memberId }).select("_id").lean();
  if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

  // Resolve audience
  const selectedObjectIds = targetUserIds?.map((id: string) => new Types.ObjectId(id));
  const targetUsers = await resolveAudience(audience, selectedObjectIds);

  // Create broadcast record
  const broadcast = await AdminBroadcast.create({
    title,
    message,
    audience,
    targetUserIds: selectedObjectIds || [],
    sentAt: new Date(),
    createdBy: (adminUser as any)._id,
  });

  // Send notifications to all resolved users
  await sendBroadcast(title, message, targetUsers);

  return NextResponse.json({
    success: true,
    broadcast,
    sentTo: targetUsers.length,
  });
}

// DELETE: Delete a broadcast record
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const url = req.nextUrl;
  const broadcastId = url.searchParams.get("id");

  if (!broadcastId) {
    return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 });
  }

  await connectDB();
  await AdminBroadcast.findByIdAndDelete(broadcastId);

  return NextResponse.json({ success: true });
}
