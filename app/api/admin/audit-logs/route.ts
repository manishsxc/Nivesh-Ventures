import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();

  const url = req.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50"));
  const skip = (page - 1) * limit;

  const actionType = url.searchParams.get("actionType") || "";
  const actorId = url.searchParams.get("actorId") || "";
  const targetMemberId = url.searchParams.get("targetMemberId") || "";
  const severity = url.searchParams.get("severity") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const q = url.searchParams.get("q") || "";

  const query: any = {};
  if (actionType) query.actionType = { $regex: actionType, $options: "i" };
  if (actorId) query.actorId = actorId;
  if (targetMemberId) query.targetMemberId = targetMemberId;
  if (severity) query.severity = severity;
  if (q) {
    query.$or = [
      { actorId: { $regex: q, $options: "i" } },
      { actorName: { $regex: q, $options: "i" } },
      { actionType: { $regex: q, $options: "i" } },
      { targetMemberId: { $regex: q, $options: "i" } },
    ];
  }
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  // Action type stats
  const stats = await AuditLog.aggregate([
    { $group: { _id: "$actionType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats,
  });
}
