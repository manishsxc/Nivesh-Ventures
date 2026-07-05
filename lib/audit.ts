import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { NextRequest } from "next/server";

export interface AuditParams {
  actorId: string;
  actorRole?: "admin" | "member" | "system";
  actorName?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  targetMemberId?: string;
  metadata?: Record<string, any>;
  severity?: "info" | "warning" | "critical";
}

/**
 * Fire-and-forget audit log creation.
 * Call this from any API route after a critical action.
 */
export async function createAuditLog(
  req: NextRequest | null,
  params: AuditParams
): Promise<void> {
  const ip = req
    ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    : "system";
  const ua = req ? req.headers.get("user-agent") || "" : "system";

  // Non-blocking — intentionally not awaited at call site
  connectDB()
    .then(() =>
      AuditLog.create({
        actorId: params.actorId,
        actorRole: params.actorRole || "admin",
        actorName: params.actorName || "",
        actionType: params.actionType,
        resourceType: params.resourceType || "",
        resourceId: params.resourceId || "",
        targetMemberId: params.targetMemberId || "",
        ipAddress: ip,
        userAgent: ua,
        metadata: params.metadata || {},
        severity: params.severity || "info",
      })
    )
    .catch((err) => console.error("[AuditLog] Failed to write audit log:", err));
}

/**
 * Synchronous version — use inside server actions where you need to await.
 */
export async function createAuditLogSync(
  req: NextRequest | null,
  params: AuditParams
): Promise<void> {
  await connectDB();
  const ip = req
    ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    : "system";
  const ua = req ? req.headers.get("user-agent") || "" : "system";

  try {
    await AuditLog.create({
      actorId: params.actorId,
      actorRole: params.actorRole || "admin",
      actorName: params.actorName || "",
      actionType: params.actionType,
      resourceType: params.resourceType || "",
      resourceId: params.resourceId || "",
      targetMemberId: params.targetMemberId || "",
      ipAddress: ip,
      userAgent: ua,
      metadata: params.metadata || {},
      severity: params.severity || "info",
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
