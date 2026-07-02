import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notice from "@/models/Notice";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const query = status ? { status } : {};
  const withdrawals = await Withdrawal.find(query).sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ withdrawals });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { withdrawalId, action, adminNote } = await req.json();
  if (!withdrawalId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "withdrawalId and valid action are required" }, { status: 400 });
  }

  await connectDB();
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  if (withdrawal.status !== "pending") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  if (action === "approve") {
    withdrawal.status = "completed";
    await User.updateOne({ memberId: withdrawal.memberId }, { $inc: { totalWithdrawn: withdrawal.amount } });
    await Transaction.updateOne(
      { referenceId: withdrawal._id.toString(), type: "withdrawal" },
      { status: "completed" }
    );
  } else {
    withdrawal.status = "rejected";
    // Refund the wallet since request is denied.
    await User.updateOne({ memberId: withdrawal.memberId }, { $inc: { walletBalance: withdrawal.amount } });
    await Transaction.updateOne(
      { referenceId: withdrawal._id.toString(), type: "withdrawal" },
      { status: "failed" }
    );
  }
  withdrawal.adminNote = adminNote || "";
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  await Notice.create({
    title: action === "approve" ? "Withdrawal Completed" : "Withdrawal Rejected",
    message:
      action === "approve"
        ? `Your withdrawal of ${withdrawal.netPayable} ${withdrawal.mode} has been processed.`
        : `Your withdrawal request was rejected and ${withdrawal.amount} has been refunded to your wallet.${adminNote ? " Reason: " + adminNote : ""}`,
    audience: "specific",
    targetMemberId: withdrawal.memberId,
  });

  return NextResponse.json({ success: true, withdrawal });
}
