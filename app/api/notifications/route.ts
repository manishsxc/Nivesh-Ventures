import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getSessionFromCookies } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "30");
  const skip = (page - 1) * limit;

  const memberId = session.memberId;

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ memberId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ memberId }),
    Notification.countDocuments({ memberId, read: false }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    unread,
    page,
    pages: Math.ceil(total / limit),
  });
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { notificationId, markAll } = body;

  await connectDB();
  const memberId = session.memberId;

  if (markAll) {
    await Notification.updateMany({ memberId, read: false }, { $set: { read: true } });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, memberId },
      { $set: { read: true } }
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}

// Delete a notification
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = req.nextUrl;
  const notificationId = url.searchParams.get("id");
  const deleteAll = url.searchParams.get("all");
  const memberId = session.memberId;

  await connectDB();

  if (deleteAll === "true") {
    await Notification.deleteMany({ memberId });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await Notification.findOneAndDelete({ _id: notificationId, memberId });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
}
