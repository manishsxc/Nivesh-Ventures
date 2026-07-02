import { Schema, model, models } from "mongoose";

const BusinessHistorySchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["renewal", "nivesh", "buy_unlock_access", "add_fund", "remove_fund"],
      required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.BusinessHistory || model("BusinessHistory", BusinessHistorySchema);
