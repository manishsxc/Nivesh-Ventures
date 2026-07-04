import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";
import { notifyMember } from "@/lib/notification";
void User; // referenced indirectly via model registration

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const memberId = searchParams.get("memberId") || "";
  const q = searchParams.get("q") || "";

  const query: any = {};
  if (status) query.status = status;
  if (memberId) query.memberId = { $regex: memberId, $options: "i" };
  if (q) {
    query.$or = [
      { subject: { $regex: q, $options: "i" } },
      { message: { $regex: q, $options: "i" } },
      { memberId: { $regex: q, $options: "i" } }
    ];
  }

  const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 }).limit(100);

  // Compute dashboard-wide statistics
  const allTickets = await SupportTicket.find({});
  const totalCount = allTickets.length;
  let pendingCount = 0;
  let resolvedCount = 0;
  let closedCount = 0;

  allTickets.forEach(t => {
    if (t.status === "pending") pendingCount++;
    else if (t.status === "resolved") resolvedCount++;
    else if (t.status === "closed") closedCount++;
  });

  return NextResponse.json({ 
    tickets,
    stats: {
      totalCount,
      pendingCount,
      resolvedCount,
      closedCount
    }
  });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { ticketId, message, status, action, replyId } = body;
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  await connectDB();
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (action === "delete_reply") {
    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required to delete" }, { status: 400 });
    }
    ticket.replies = ticket.replies.filter((r: any) => r._id.toString() !== replyId);
    await ticket.save();
    return NextResponse.json({ success: true, ticket });
  }

  if (message) {
    ticket.replies.push({
      from: "admin",
      message,
      createdAt: new Date(),
    });
    // Set status to answered when admin replies, unless specified otherwise
    ticket.status = status || "answered";
  } else if (status) {
    ticket.status = status;
  }

  await ticket.save();

  // Notify User of admin reply
  if (message) {
    notifyMember(
      ticket.memberId,
      "Support Ticket Update 💬",
      `Admin replied to your ticket: "${ticket.subject}"`,
      "support_reply",
      ticket._id
    ).catch(() => {});
  } else if (status) {
    notifyMember(
      ticket.memberId,
      "Support Ticket Status Updated",
      `Your ticket "${ticket.subject}" status has been changed to: ${status}`,
      "support_status",
      ticket._id
    ).catch(() => {});
  }

  return NextResponse.json({ success: true, ticket });
}
