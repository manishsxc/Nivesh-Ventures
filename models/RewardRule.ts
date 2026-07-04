import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardRule extends Document {
  name: string;
  type: string; // e.g., 'referral_reward', 'matching_reward', 'booster_reward', 'return_reward', 'joining_reward'
  amount: number;
  isPercentage: boolean; // if true, calculated as percentage of deposit/action
  isActive: boolean;
  description: string;
  eligibilityConditions: string; // text description of conditions
  createdAt: Date;
  updatedAt: Date;
}

const RewardRuleSchema = new Schema<IRewardRule>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    isPercentage: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "" },
    eligibilityConditions: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.RewardRule || mongoose.model<IRewardRule>('RewardRule', RewardRuleSchema);
