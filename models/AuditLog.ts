import { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: String, required: true, index: true },   // memberId of actor
    actorRole: { type: String, enum: ["admin", "member", "system"], default: "admin" },
    actorName: { type: String, default: "" },
    actionType: {
      type: String,
      required: true,
      index: true,
      // Examples: wallet_credit, wallet_debit, pin_generate, pin_use, withdrawal_approve,
      //           withdrawal_reject, refund, account_activate, reward_distribute, login,
      //           manual_income_release, closing_start, closing_complete, rule_update, etc.
    },
    resourceType: { type: String, default: "" }, // e.g. "User", "Transaction", "Withdrawal"
    resourceId: { type: String, default: "" },   // ID of the affected resource
    targetMemberId: { type: String, default: "", index: true }, // affected user (if different from actor)
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }, // Additional context as JSON
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
  },
  {
    // Immutable log — only createdAt, no updatedAt
    timestamps: { createdAt: true, updatedAt: false },
    // Compound index for efficient filtering
    indexes: [
      { actorId: 1, createdAt: -1 },
      { actionType: 1, createdAt: -1 },
      { targetMemberId: 1, createdAt: -1 },
    ],
  }
);

// TTL: auto-delete logs older than 730 days (2 years)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 730 * 24 * 3600 });

export default models.AuditLog || model("AuditLog", AuditLogSchema);
