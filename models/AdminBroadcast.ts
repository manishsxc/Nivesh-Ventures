import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminBroadcast extends Document {
  title: string;
  message: string;
  audience: 'all' | 'active' | 'inactive' | 'premium' | 'selected';
  targetUserIds?: mongoose.Types.ObjectId[]; // used when audience is 'selected'
  scheduledAt?: Date; // optional future send time
  sentAt?: Date; // set when broadcast is sent
  createdBy: mongoose.Types.ObjectId; // admin user id
  createdAt: Date;
}

const AdminBroadcastSchema = new Schema<IAdminBroadcast>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: { type: String, enum: ['all', 'active', 'inactive', 'premium', 'selected'], required: true },
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AdminBroadcast || mongoose.model<IAdminBroadcast>('AdminBroadcast', AdminBroadcastSchema);
