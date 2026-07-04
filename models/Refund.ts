import { Schema, model, models } from "mongoose";

const RefundSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    refundAmount: { type: Number, required: true, min: 0 },
    refundType: {
      type: String,
      enum: ["wallet", "deposit", "activation", "manual"],
      required: true,
    },
    walletType: { type: String, default: "main" },
    remarks: { type: String, default: "" },
    adminName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    referenceTxId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Refund || model("Refund", RefundSchema);
