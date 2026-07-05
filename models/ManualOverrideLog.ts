import { Schema, model, models } from "mongoose";

const ManualOverrideLogSchema = new Schema(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    action: {
      type: String,
      required: true,
      enum: [
        "pause_closing",
        "resume_closing",
        "cancel_closing",
        "release_income",
        "release_income_bulk",
        "release_income_user_wise",
        "preview_income",
        "manual_start_closing",
        "manual_complete_closing",
      ],
    },
    incomeTypes: [{ type: String }],
    month: { type: String, required: true },
    totalAmount: { type: Number, default: 0 },
    usersProcessed: { type: Number, default: 0 },
    targetUserIds: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "completed",
    },
    errorMessage: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default models.ManualOverrideLog ||
  model("ManualOverrideLog", ManualOverrideLogSchema);
