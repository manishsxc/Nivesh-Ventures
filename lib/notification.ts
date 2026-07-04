import Notification from '@/models/Notification';
import User from '@/models/User';
import { Types } from 'mongoose';

/**
 * Creates a personal notification for a user by memberId.
 */
export async function notifyUser(
  userId: Types.ObjectId,
  title: string,
  description: string,
  type: string,
  relatedId?: Types.ObjectId
) {
  // Find member ID for this user
  try {
    const user = await User.findById(userId).select('memberId').lean();
    const memberId = (user as any)?.memberId;
    await Notification.create({
      memberId: memberId || null,
      userId,
      title,
      description,
      type,
      relatedId: relatedId || null,
      read: false,
    });
  } catch (e) {
    console.error('notifyUser error:', e);
  }
}

/**
 * Creates a personal notification for a user by memberId string (direct).
 */
export async function notifyMember(
  memberId: string,
  title: string,
  description: string,
  type: string,
  relatedId?: Types.ObjectId
) {
  try {
    await Notification.create({
      memberId,
      title,
      description,
      type,
      relatedId: relatedId || null,
      read: false,
    });
  } catch (e) {
    console.error('notifyMember error:', e);
  }
}

/**
 * Resolve audience for admin broadcast.
 */
export async function resolveAudience(
  audience: 'all' | 'active' | 'inactive' | 'premium' | 'selected',
  selectedIds?: Types.ObjectId[]
): Promise<{ userId: Types.ObjectId; memberId: string }[]> {
  let users: any[] = [];
  switch (audience) {
    case 'all':
      users = await User.find({}, { _id: 1, memberId: 1 }).lean();
      break;
    case 'active':
      const activeSince = new Date();
      activeSince.setDate(activeSince.getDate() - 30);
      users = await User.find({ lastLogin: { $gte: activeSince } }, { _id: 1, memberId: 1 }).lean();
      break;
    case 'inactive':
      const inactiveSince = new Date();
      inactiveSince.setDate(inactiveSince.getDate() - 30);
      users = await User.find(
        { $or: [{ lastLogin: { $lt: inactiveSince } }, { lastLogin: { $exists: false } }] },
        { _id: 1, memberId: 1 }
      ).lean();
      break;
    case 'premium':
      users = await User.find({ isPremium: true }, { _id: 1, memberId: 1 }).lean();
      break;
    case 'selected':
      users = await User.find({ _id: { $in: selectedIds || [] } }, { _id: 1, memberId: 1 }).lean();
      break;
    default:
      users = [];
  }
  return users.map((u) => ({ userId: u._id, memberId: u.memberId }));
}

/**
 * Send broadcast notifications to a list of users.
 */
export async function sendBroadcast(
  title: string,
  message: string,
  users: { userId: Types.ObjectId; memberId: string }[]
) {
  const notifications = users.map((u) => ({
    memberId: u.memberId,
    userId: u.userId,
    title,
    description: message,
    type: 'admin_broadcast',
    read: false,
    createdAt: new Date(),
  }));
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}
