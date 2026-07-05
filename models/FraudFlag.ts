import { Schema, model, models } from "mongoose";

const FraudFlagSchema = new Schema(
  {
    memberId: { type: String, required: true, unique: true, index: true },
    riskScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    isBlocked: { type: Boolean, default: false },
    flags: [
      {
        reason: { type: String, required: true },
        detectedAt: { type: Date, default: Date.now },
        severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
        resolvedAt: { type: Date, default: null },
      },
    ],
    ipHistory: [
      {
        ip: { type: String },
        seenAt: { type: Date, default: Date.now },
        userAgent: { type: String, default: "" },
      },
    ],
    deviceHistory: [
      {
        fingerprint: { type: String },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    withdrawalVelocity: { type: Number, default: 0 }, // withdrawals in last 7 days
    lastAnalyzedAt: { type: Date, default: null },
    adminNote: { type: String, default: "" },
    manuallyFlagged: { type: Boolean, default: false },
    manuallyFlaggedBy: { type: String, default: "" },
    manuallyFlaggedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.FraudFlag || model("FraudFlag", FraudFlagSchema);
