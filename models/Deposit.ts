import { Schema, model, models } from "mongoose";

const DepositSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    amount: { type: Number, default: 0 },
    txnHash: { type: String, required: true },
    paymentSlipUrl: { type: String, default: "" },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default models.Deposit || model("Deposit", DepositSchema);
