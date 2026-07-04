import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Refund from "@/models/Refund";
import { requireAdmin } from "@/lib/require-admin";
import { notifyMember } from "@/lib/notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();

  const url = req.nextUrl;
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const type = url.searchParams.get("type") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.max(1, Number(url.searchParams.get("limit") || 20));

  const query: any = {};

  if (q.trim()) {
    query.memberId = { $regex: q, $options: "i" };
  }
  if (status) {
    query.status = status;
  }
  if (type) {
    query.refundType = type;
  }

  const dateFilter: any = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.$lte = toDate;
  }
  if (Object.keys(dateFilter).length > 0) {
    query.createdAt = dateFilter;
  }

  const skip = (page - 1) * limit;
  const [refunds, total] = await Promise.all([
    Refund.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Refund.countDocuments(query),
  ]);

  // Aggregate stats
  const allRefunds = await Refund.find({});
  let totalRefundsAmount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let rejectedCount = 0;
  const totalRefundsCount = allRefunds.length;

  allRefunds.forEach((ref) => {
    if (ref.status === "completed") {
      totalRefundsAmount += ref.refundAmount;
      completedCount++;
    } else if (ref.status === "pending") {
      pendingCount++;
    } else if (ref.status === "rejected") {
      rejectedCount++;
    }
  });

  return NextResponse.json({
    refunds,
    pagination: {
      page,
      limit,
      totalRows: total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      totalRefundsCount,
      totalRefundsAmount,
      pendingCount,
      completedCount,
      rejectedCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { targetType, memberId, memberIds, refundAmount, refundType, walletType, remarks, referenceTxId } = body;

  if (!refundType || !refundAmount || refundAmount <= 0) {
    return NextResponse.json({ error: "Refund type and valid amount are required" }, { status: 400 });
  }

  await connectDB();

  const adminName = guard.session?.memberId || "Admin";

  // Prevent duplicate refunds for same transaction
  if (referenceTxId) {
    const existingRefund = await Refund.findOne({ referenceTxId, status: { $in: ["pending", "completed"] } });
    if (existingRefund) {
      return NextResponse.json({ error: "A refund has already been initiated/completed for this transaction reference ID." }, { status: 400 });
    }
  }

  const initiateRefund = async (mId: string, amount: number) => {
    const user = await User.findOne({ memberId: mId });
    if (!user) throw new Error(`User not found: ${mId}`);
    return await Refund.create({
      memberId: mId,
      refundAmount: amount,
      refundType,
      walletType: walletType || "main",
      remarks: remarks || "Admin adjustment",
      adminName,
      status: "pending",
      referenceTxId: referenceTxId || "",
    });
  };

  try {
    if (targetType === "single" || targetType === "transaction") {
      if (!memberId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      const refund = await initiateRefund(memberId, refundAmount);
      notifyMember(
        memberId,
        "Refund Initiated ⏳",
        `A refund of $${refundAmount} has been initiated for your account. Remarks: ${remarks || "None"}`,
        "refund_initiated"
      ).catch(() => {});
      return NextResponse.json({ success: true, refund });
    }

    if (targetType === "multiple") {
      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return NextResponse.json({ error: "Member IDs array is required" }, { status: 400 });
      }
      const initiatedList = [];
      for (const mId of memberIds) {
        const refund = await initiateRefund(mId, refundAmount);
        initiatedList.push(refund);
        notifyMember(
          mId,
          "Refund Initiated ⏳",
          `A refund of $${refundAmount} has been initiated for your account.`,
          "refund_initiated"
        ).catch(() => {});
      }
      return NextResponse.json({ success: true, count: initiatedList.length });
    }

    if (targetType === "team") {
      if (!memberId) return NextResponse.json({ error: "Sponsor ID is required" }, { status: 400 });
      // Find all direct/indirect downlines
      const team = await User.find({ sponsorId: memberId });
      if (team.length === 0) {
        return NextResponse.json({ error: "No team members found under this user." }, { status: 400 });
      }
      const initiatedList = [];
      for (const t of team) {
        const refund = await initiateRefund(t.memberId, refundAmount);
        initiatedList.push(refund);
        notifyMember(
          t.memberId,
          "Refund Initiated ⏳",
          `A team refund of $${refundAmount} has been initiated for your account.`,
          "refund_initiated"
        ).catch(() => {});
      }
      return NextResponse.json({ success: true, count: initiatedList.length });
    }

    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Refund initiation failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "Refund ID and action (approve/reject) are required" }, { status: 400 });
  }

  await connectDB();

  const refund = await Refund.findById(id);
  if (!refund) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });

  if (refund.status !== "pending") {
    return NextResponse.json({ error: "Only pending refund requests can be processed" }, { status: 400 });
  }

  if (action === "approve") {
    const user = await User.findOne({ memberId: refund.memberId });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Determine correct balance field
    let balanceField = "walletBalance";
    const wallet = refund.walletType;
    if (wallet === "booster") balanceField = "boosterWalletBalance";
    else if (wallet === "nivesh") balanceField = "nivshWalletBalance";
    else if (wallet === "usdt") balanceField = "usdtWalletBalance";

    // Update user balance
    user[balanceField] = (user[balanceField] || 0) + refund.refundAmount;

    // Create transaction log
    await Transaction.create({
      memberId: refund.memberId,
      type: "refund",
      direction: "credit",
      amount: refund.refundAmount,
      currency: "USDT",
      status: "completed",
      note: `Approved Refund: ${refund.remarks}`,
      walletType: refund.walletType,
      referenceId: refund._id.toString(),
    });

    await user.save();

    refund.status = "completed";
    await refund.save();

    notifyMember(
      refund.memberId,
      "Refund Approved! 💰",
      `Your refund of $${refund.refundAmount} has been approved and credited to your ${refund.walletType} wallet.`,
      "refund_approved",
      refund._id
    ).catch(() => {});

    return NextResponse.json({ success: true, refund });
  }

  if (action === "reject") {
    refund.status = "rejected";
    await refund.save();

    notifyMember(
      refund.memberId,
      "Refund Request Rejected ⚠️",
      `Your refund request of $${refund.refundAmount} was rejected by the administrator.`,
      "refund_rejected",
      refund._id
    ).catch(() => {});

    return NextResponse.json({ success: true, refund });
  }

  return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
}
