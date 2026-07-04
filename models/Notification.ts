import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  memberId: string; // member ID string for easy lookup
  userId?: mongoose.Types.ObjectId; // optional reference (admin notifications)
  title: string;
  description: string;
  type: string; // e.g., 'registration', 'login', 'wallet_credit', 'admin_broadcast'
  relatedId?: mongoose.Types.ObjectId; // optional reference to related transaction or entity
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    memberId: { type: String, index: true }, // for member notifications
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // for admin notifications
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
