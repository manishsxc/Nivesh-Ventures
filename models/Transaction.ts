import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "referral_income",
        "matching_income",
        "returns_income",
        "level_income",
        "reward_income",
        "investment",
        "deposit",
        "withdrawal",
        "unlock_access",
        "p2p_transfer_in",
        "p2p_transfer_out",
        "share_reward",
      ],
      required: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ["INR", "USDT"], default: "USDT" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    note: { type: String, default: "" },
    referenceId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Transaction || model("Transaction", TransactionSchema);
