import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardHistory extends Document {
  memberId: string;
  rewardType: string; // e.g., 'referral_reward', 'matching_reward', 'booster_reward', 'return_reward', 'joining_reward'
  amount: number;
  status: 'pending' | 'released' | 'cancelled';
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RewardHistorySchema = new Schema<IRewardHistory>(
  {
    memberId: { type: String, required: true, index: true },
    rewardType: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'released', 'cancelled'], default: 'released', required: true },
    adminRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.RewardHistory || mongoose.model<IRewardHistory>('RewardHistory', RewardHistorySchema);
