import { connectDB } from "@/lib/mongodb";
import FraudFlag from "@/models/FraudFlag";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";

/**
 * Analyzes a user's transaction/login patterns for fraud detection.
 */
export async function analyzeUserFraud(
  memberId: string,
  ip: string,
  userAgent: string
): Promise<{ riskScore: number; flags: string[] }> {
  await connectDB();

  let fraudFlag = await FraudFlag.findOne({ memberId });
  if (!fraudFlag) {
    fraudFlag = await FraudFlag.create({ memberId });
  }

  // Update IP history
  const ipExists = fraudFlag.ipHistory.some((entry: any) => entry.ip === ip);
  if (!ipExists) {
    fraudFlag.ipHistory.push({ ip, seenAt: new Date(), userAgent });
  }

  const flagsSet = new Set<string>();
  let riskScore = 0;

  // 1. IP Sharing Check: Multiple accounts from same IP
  const sameIpAccounts = await FraudFlag.countDocuments({
    memberId: { $ne: memberId },
    "ipHistory.ip": ip,
  });

  if (sameIpAccounts >= 3) {
    flagsSet.add(`IP shared with ${sameIpAccounts} other account(s)`);
    riskScore += Math.min(40, sameIpAccounts * 10);
  }

  // 2. Withdrawal velocity check (Withdrawals in the last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const recentWithdrawalsCount = await Withdrawal.countDocuments({
    memberId,
    createdAt: { $gte: oneDayAgo },
  });

  if (recentWithdrawalsCount > 3) {
    flagsSet.add(`High withdrawal frequency: ${recentWithdrawalsCount} in 24h`);
    riskScore += 25;
  }

  // 3. User account details (e.g. check duplicate bank details)
  const user = await User.findOne({ memberId }).lean();
  if (user && user.bankDetails && user.bankDetails.accountNumber) {
    const duplicateBankUsers = await User.countDocuments({
      memberId: { $ne: memberId },
      "bankDetails.accountNumber": user.bankDetails.accountNumber,
    });
    if (duplicateBankUsers > 0) {
      flagsSet.add(`Bank account shared with other user(s)`);
      riskScore += 30;
    }
  }

  // Save changes
  fraudFlag.flags = Array.from(flagsSet).map((flag) => ({
    reason: flag,
    detectedAt: new Date(),
    severity: riskScore > 50 ? "high" : riskScore > 25 ? "medium" : "low",
  }));
  
  if (fraudFlag.manuallyFlagged) {
    riskScore = Math.max(riskScore, 80);
  }

  fraudFlag.riskScore = Math.min(100, riskScore);
  fraudFlag.lastAnalyzedAt = new Date();
  await fraudFlag.save();

  return {
    riskScore: fraudFlag.riskScore,
    flags: Array.from(flagsSet),
  };
}
