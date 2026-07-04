import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Investment from "@/models/Investment";
import BusinessHistory from "@/models/BusinessHistory";
import RewardHistory from "@/models/RewardHistory";
import MonthlyClosing from "@/models/MonthlyClosing";
import Commission from "@/models/Commission";
import { requireAdmin } from "@/lib/require-admin";
import { notifyMember } from "@/lib/notification";

export const dynamic = "force-dynamic";

// Default returns level percentages for 10 levels
const DEFAULT_RETURNS_LEVELS = [5, 3, 2, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5];

// Helper to get start and end dates of a given month string "YYYY-MM"
function getMonthRange(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// GET: Fetch closing indicators, status, history
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Find or create current month's closing document
  let currentClosing = await MonthlyClosing.findOne({ month: currentMonthStr });
  if (!currentClosing) {
    currentClosing = await MonthlyClosing.create({
      month: currentMonthStr,
      status: "open",
    });
  }

  // Calculate indicators
  const { startDate, endDate } = getMonthRange(currentMonthStr);

  // Total Business (Sum of investments created this month)
  const monthlyBusinessAgg = await Investment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalMonthlyBusiness = monthlyBusinessAgg[0]?.total || 0;

  // Next Closing Date is the last day of the current month
  const nextClosingDate = endDate.toISOString();

  // Pending vs Released Income for current closing
  let pendingIncome = 0;
  let releasedIncome = 0;

  if (currentClosing.status !== "open") {
    currentClosing.calculatedIncomes.forEach((inc: any) => {
      const autoReleaseTotal = inc.referralIncome + inc.matchingIncome + inc.boosterIncome;

      // Auto release is released immediately on complete_closing
      const isClosed = currentClosing.status === "closed";

      if (isClosed) {
        releasedIncome += autoReleaseTotal;
      } else {
        pendingIncome += autoReleaseTotal;
      }

      // Manual release types
      if (currentClosing.releasedTypes.includes("reward_income")) {
        releasedIncome += inc.rewardIncome;
      } else {
        pendingIncome += inc.rewardIncome;
      }

      if (currentClosing.releasedTypes.includes("returns_income")) {
        releasedIncome += inc.monthlyReturns;
      } else {
        pendingIncome += inc.monthlyReturns;
      }

      if (currentClosing.releasedTypes.includes("level_income")) {
        releasedIncome += inc.returnsLevelIncome;
      } else {
        pendingIncome += inc.returnsLevelIncome;
      }
    });
  }

  // Get past closings history
  const history = await MonthlyClosing.find({ status: "closed" }).sort({ completedAt: -1 }).limit(50);

  return NextResponse.json({
    status: currentClosing.status,
    currentMonth: currentMonthStr,
    totalMonthlyBusiness,
    pendingIncome,
    releasedIncome,
    nextClosingDate,
    currentClosing,
    history,
  });
}

// POST: Manage closing stages
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { action, month, monthlyReturnPercentage, distributionPercentage } = body;

  if (!month) {
    return NextResponse.json({ error: "Month parameter is required (YYYY-MM)" }, { status: 400 });
  }

  await connectDB();

  let closing = await MonthlyClosing.findOne({ month });
  if (!closing) {
    closing = await MonthlyClosing.create({ month, status: "open" });
  }

  // 1. START CLOSING
  if (action === "start_closing") {
    if (closing.status !== "open") {
      return NextResponse.json({ error: "Closing is already started or completed for this month." }, { status: 400 });
    }

    const returnPct = Number(monthlyReturnPercentage || 6);
    const distPct = Number(distributionPercentage !== undefined ? distributionPercentage : 100);

    if (returnPct < 5 || returnPct > 7) {
      return NextResponse.json({ error: "Monthly return percentage must be between 5% and 7%" }, { status: 400 });
    }

    // Freeze calculations
    closing.status = "closing_in_progress";
    closing.monthlyReturnPercentage = returnPct;
    closing.distributionPercentage = distPct;
    closing.frozenAt = new Date();

    const { startDate, endDate } = getMonthRange(month);

    // Fetch all members
    const members = await User.find({ role: "member" });

    // Staging calculation array
    const stagedIncomes: any[] = [];

    // Setup helper to build a tree list of downline level distances for level commissions
    // Level 1 to 10 helper
    const getDownlineLevels = (sponsorId: string, maxDepth: number = 10) => {
      const levels: { [key: string]: number } = {};
      const queue: { id: string; depth: number }[] = [{ id: sponsorId, depth: 0 }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        if (depth > 0 && depth <= maxDepth) {
          levels[id] = depth;
        }

        if (depth < maxDepth) {
          // Find direct referrals
          const directDownlines = members.filter((m) => m.sponsorId === id);
          for (const d of directDownlines) {
            queue.push({ id: d.memberId, depth: depth + 1 });
          }
        }
      }
      return levels;
    };

    // Calculate business History for business totals
    const monthlyBusinessAgg = await Investment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    closing.totalMonthlyBusiness = monthlyBusinessAgg[0]?.total || 0;

    // Fetch commission configuration
    let commConfig = await Commission.findOne({ key: "singleton" });
    if (!commConfig) commConfig = await Commission.create({ key: "singleton" });

    // Loop through each member and compute their staged earnings
    for (const member of members) {
      const memberId = member.memberId;

      // A. Investor Monthly Returns
      // All active investments
      const activeInvestments = await Investment.find({ memberId, status: "active" });
      const totalInvestmentAmount = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const rawMonthlyReturns = totalInvestmentAmount * (returnPct / 100);
      const stagedMonthlyReturns = rawMonthlyReturns * (distPct / 100);

      // B. Referral Income (Level 1 to 5 based on Commission Settings)
      let stagedReferralIncome = 0;
      // Find all downline levels up to 5
      const downlineMapL5 = getDownlineLevels(memberId, 5);
      for (const [dId, level] of Object.entries(downlineMapL5)) {
        // Calculate new investments & unlock access renewals of this downline in this month
        const downlineInvestments = await Investment.find({
          memberId: dId,
          createdAt: { $gte: startDate, $lte: endDate },
        });
        const totalDownlineInvestAmount = downlineInvestments.reduce((sum, inv) => sum + inv.amount, 0);

        const downlineRenewals = await BusinessHistory.find({
          memberId: dId,
          kind: "renewal",
          createdAt: { $gte: startDate, $lte: endDate },
        });
        const totalRenewalAmount = downlineRenewals.reduce((sum, r) => sum + r.amount, 0);

        const totalDownlineBusiness = totalDownlineInvestAmount + totalRenewalAmount;

        const rateKey = `level${level}`;
        const commRate = (commConfig as any)[rateKey] || 0;
        stagedReferralIncome += totalDownlineBusiness * (commRate / 100);
      }
      stagedReferralIncome = stagedReferralIncome * (distPct / 100);

      // C. Matching Income (Binary Match)
      // Matched Volume = min(leftCurrentBusiness + leftCarryForward, rightCurrentBusiness + rightCarryForward)
      const leftTotal = (member.leftCurrentBusiness || 0) + (member.leftCarryForward || 0);
      const rightTotal = (member.rightCurrentBusiness || 0) + (member.rightCarryForward || 0);
      const matchedVolume = Math.min(leftTotal, rightTotal);
      const stagedMatchingIncome = matchedVolume * 0.1 * (distPct / 100); // 10% matching rate default

      // D. Booster Income
      // Check if they got any booster reward in this month
      // Or if they qualified but didn't receive it yet.
      // Let's scan for booster transactions in this month
      const boosterTxns = await Transaction.find({
        memberId,
        type: "reward_income",
        createdAt: { $gte: startDate, $lte: endDate },
        note: { $regex: "booster", $options: "i" },
      });
      const stagedBoosterIncome = boosterTxns.reduce((sum, tx) => sum + tx.amount, 0) * (distPct / 100);

      // E. Reward Income
      // Staged from pending RewardHistory entries
      const pendingRewards = await RewardHistory.find({
        memberId,
        status: "pending",
        createdAt: { $gte: startDate, $lte: endDate },
      });
      const stagedRewardIncome = pendingRewards.reduce((sum, r) => sum + r.amount, 0) * (distPct / 100);

      // F. Returns Level Income (10 levels based on monthly returns of downlines)
      // We will calculate this after calculating everyone's monthlyReturns in a second pass or on-the-fly.
      // Since we need the stagedMonthlyReturns of downlines, let's keep a record or calculate on-the-fly.
      stagedIncomes.push({
        memberId,
        referralIncome: Number(stagedReferralIncome.toFixed(2)),
        matchingIncome: Number(stagedMatchingIncome.toFixed(2)),
        boosterIncome: Number(stagedBoosterIncome.toFixed(2)),
        rewardIncome: Number(stagedRewardIncome.toFixed(2)),
        returnsLevelIncome: 0, // Will compute in next step
        monthlyReturns: Number(stagedMonthlyReturns.toFixed(2)),
      });
    }

    // Pass 2: Calculate Returns Level Income (10 levels)
    const stagedIncomeMap = new Map(stagedIncomes.map((si) => [si.memberId, si]));
    for (const si of stagedIncomes) {
      let stagedReturnsLevelIncome = 0;
      const downlineMapL10 = getDownlineLevels(si.memberId, 10);
      for (const [dId, level] of Object.entries(downlineMapL10)) {
        const downlineStaged = stagedIncomeMap.get(dId);
        if (downlineStaged && downlineStaged.monthlyReturns > 0) {
          const rate = DEFAULT_RETURNS_LEVELS[level - 1] || 0;
          stagedReturnsLevelIncome += downlineStaged.monthlyReturns * (rate / 100);
        }
      }
      si.returnsLevelIncome = Number((stagedReturnsLevelIncome * (distPct / 100)).toFixed(2));
    }

    closing.calculatedIncomes = stagedIncomes;
    await closing.save();

    // Broadcast Alert Notifications to all members
    for (const member of members) {
      notifyMember(
        member.memberId,
        "Monthly Closing Started! ⏳",
        `Monthly closing for ${month} has been initialized by the administrator. Income calculations are temporarily frozen.`,
        "monthly_closing_started"
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, closing });
  }

  // 2. COMPLETE CLOSING
  if (action === "complete_closing") {
    if (closing.status !== "closing_in_progress") {
      return NextResponse.json({ error: "Closing must be in progress to complete it." }, { status: 400 });
    }

    closing.status = "closed";
    closing.completedAt = new Date();

    // Automatically Release: Referral Income, Matching Income, Booster Income
    const autoReleaseTypes = ["referral_income", "matching_income", "booster_income"];
    closing.releasedTypes = autoReleaseTypes;

    for (const calc of closing.calculatedIncomes) {
      const user = await User.findOne({ memberId: calc.memberId });
      if (!user) continue;

      // Apply carry forward logic for binary tree matching
      const leftTotal = (user.leftCurrentBusiness || 0) + (user.leftCarryForward || 0);
      const rightTotal = (user.rightCurrentBusiness || 0) + (user.rightCarryForward || 0);
      const matchedVolume = Math.min(leftTotal, rightTotal);

      user.leftCarryForward = leftTotal - matchedVolume;
      user.rightCarryForward = rightTotal - matchedVolume;
      user.leftCurrentBusiness = 0;
      user.rightCurrentBusiness = 0;

      // Credit Referral Income
      if (calc.referralIncome > 0) {
        user.totalReferralIncome = (user.totalReferralIncome || 0) + calc.referralIncome;
        user.walletBalance = (user.walletBalance || 0) + calc.referralIncome;

        await Transaction.create({
          memberId: user.memberId,
          type: "referral_income",
          direction: "credit",
          amount: calc.referralIncome,
          currency: "USDT",
          status: "completed",
          note: `Monthly Referral Income - ${month}`,
          referenceId: closing._id.toString(),
        });
      }

      // Credit Matching Income
      if (calc.matchingIncome > 0) {
        user.totalMatchingIncome = (user.totalMatchingIncome || 0) + calc.matchingIncome;
        user.walletBalance = (user.walletBalance || 0) + calc.matchingIncome;

        await Transaction.create({
          memberId: user.memberId,
          type: "matching_income",
          direction: "credit",
          amount: calc.matchingIncome,
          currency: "USDT",
          status: "completed",
          note: `Monthly Binary Matching Income - ${month}`,
          referenceId: closing._id.toString(),
        });
      }

      // Credit Booster Income
      if (calc.boosterIncome > 0) {
        user.totalRewardIncome = (user.totalRewardIncome || 0) + calc.boosterIncome;
        user.walletBalance = (user.walletBalance || 0) + calc.boosterIncome;

        await Transaction.create({
          memberId: user.memberId,
          type: "reward_income",
          direction: "credit",
          amount: calc.boosterIncome,
          currency: "USDT",
          status: "completed",
          note: `Monthly Booster Income - ${month}`,
          referenceId: closing._id.toString(),
        });
      }

      await user.save();

      // Notify User
      if (calc.referralIncome > 0 || calc.matchingIncome > 0 || calc.boosterIncome > 0) {
        notifyMember(
          user.memberId,
          "Monthly Incomes Released! 💸",
          `Your Auto-Release Incomes (Referral, Matching, Booster) for ${month} have been credited to your wallet.`,
          "income_released"
        ).catch(() => {});
      }
    }

    // Add release logs
    const totalReferralsReleased = closing.calculatedIncomes.reduce((sum: number, c: any) => sum + c.referralIncome, 0);
    const totalMatchingReleased = closing.calculatedIncomes.reduce((sum: number, c: any) => sum + c.matchingIncome, 0);
    const totalBoosterReleased = closing.calculatedIncomes.reduce((sum: number, c: any) => sum + c.boosterIncome, 0);

    if (totalReferralsReleased > 0) {
      closing.releaseLogs.push({
        incomeType: "referral_income",
        releasedBy: "admin",
        amount: totalReferralsReleased,
      });
    }
    if (totalMatchingReleased > 0) {
      closing.releaseLogs.push({
        incomeType: "matching_income",
        releasedBy: "admin",
        amount: totalMatchingReleased,
      });
    }
    if (totalBoosterReleased > 0) {
      closing.releaseLogs.push({
        incomeType: "booster_income",
        releasedBy: "admin",
        amount: totalBoosterReleased,
      });
    }

    await closing.save();

    // Notify all members closing completed
    const allMembers = await User.find({ role: "member" });
    for (const m of allMembers) {
      notifyMember(
        m.memberId,
        "Monthly Closing Completed! ✅",
        `Monthly closing for ${month} has been finalized. Carry-forward values reset and automatic payouts completed.`,
        "monthly_closing_completed"
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, closing });
  }

  // 3. MANUAL RELEASE INCOME
  if (action === "release_income") {
    const { incomeType } = body;
    const allowedManual = ["reward_income", "returns_income", "level_income"];

    if (!allowedManual.includes(incomeType)) {
      return NextResponse.json({ error: "Invalid manual income type for release" }, { status: 400 });
    }

    if (closing.status !== "closed") {
      return NextResponse.json({ error: "Closing must be completed/closed before manual release." }, { status: 400 });
    }

    if (closing.releasedTypes.includes(incomeType)) {
      return NextResponse.json({ error: "This income type has already been released for this month." }, { status: 400 });
    }

    let totalReleased = 0;

    for (const calc of closing.calculatedIncomes) {
      const user = await User.findOne({ memberId: calc.memberId });
      if (!user) continue;

      if (incomeType === "reward_income" && calc.rewardIncome > 0) {
        user.totalRewardIncome = (user.totalRewardIncome || 0) + calc.rewardIncome;
        user.walletBalance = (user.walletBalance || 0) + calc.rewardIncome;
        totalReleased += calc.rewardIncome;

        await Transaction.create({
          memberId: user.memberId,
          type: "reward_income",
          direction: "credit",
          amount: calc.rewardIncome,
          currency: "USDT",
          status: "completed",
          note: `Monthly Reward Payout - ${month}`,
          referenceId: closing._id.toString(),
        });

        // Also release pending RewardHistory statuses
        const { startDate, endDate } = getMonthRange(month);
        await RewardHistory.updateMany(
          { memberId: user.memberId, status: "pending", createdAt: { $gte: startDate, $lte: endDate } },
          { $set: { status: "released", adminRemarks: `Released in Monthly Closing ${month}` } }
        );

        notifyMember(
          user.memberId,
          "Reward Payout Released! 🏆",
          `Your manual monthly reward payout of $${calc.rewardIncome} for ${month} has been released.`,
          "reward_released"
        ).catch(() => {});
      }

      if (incomeType === "returns_income" && calc.monthlyReturns > 0) {
        user.totalReturnsIncome = (user.totalReturnsIncome || 0) + calc.monthlyReturns;
        user.walletBalance = (user.walletBalance || 0) + calc.monthlyReturns;
        totalReleased += calc.monthlyReturns;

        await Transaction.create({
          memberId: user.memberId,
          type: "returns_income",
          direction: "credit",
          amount: calc.monthlyReturns,
          currency: "USDT",
          status: "completed",
          note: `Monthly Investment Returns - ${month}`,
          referenceId: closing._id.toString(),
        });

        notifyMember(
          user.memberId,
          "Investment Returns Released! 📈",
          `Your monthly investment returns of $${calc.monthlyReturns} for ${month} have been credited.`,
          "returns_released"
        ).catch(() => {});
      }

      if (incomeType === "level_income" && calc.returnsLevelIncome > 0) {
        user.totalLevelIncome = (user.totalLevelIncome || 0) + calc.returnsLevelIncome;
        user.walletBalance = (user.walletBalance || 0) + calc.returnsLevelIncome;
        totalReleased += calc.returnsLevelIncome;

        await Transaction.create({
          memberId: user.memberId,
          type: "level_income",
          direction: "credit",
          amount: calc.returnsLevelIncome,
          currency: "USDT",
          status: "completed",
          note: `Monthly Returns Level Income - ${month}`,
          referenceId: closing._id.toString(),
        });

        notifyMember(
          user.memberId,
          "Returns Level Income Released! 🔗",
          `Your monthly returns level income of $${calc.returnsLevelIncome} for ${month} has been released.`,
          "level_income_released"
        ).catch(() => {});
      }

      await user.save();
    }

    closing.releasedTypes.push(incomeType);
    closing.releaseLogs.push({
      incomeType,
      releasedBy: "admin",
      amount: totalReleased,
    });

    await closing.save();

    return NextResponse.json({ success: true, closing });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
