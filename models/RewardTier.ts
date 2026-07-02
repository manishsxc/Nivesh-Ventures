import { Schema, model, models } from "mongoose";

const RewardTierSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    leftRequirement: { type: Number, required: true },
    rightRequirement: { type: Number, required: true },
    rewardAmount: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.RewardTier || model("RewardTier", RewardTierSchema);
