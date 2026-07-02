import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { compareSecret, getSessionFromCookies } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { receiverId, amount, accessKey, remarks } = await req.json();
    if (!receiverId || !amount || !accessKey) {
      return NextResponse.json({ error: "Receiver ID, amount and Access Key are required" }, { status: 400 });
    }
    if (receiverId === session.memberId) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
    }

    await connectDB();
    const sender = await User.findOne({ memberId: session.memberId });
    const receiver = await User.findOne({ memberId: receiverId });
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    if (!receiver) return NextResponse.json({ error: "Receiver ID not found" }, { status: 404 });

    const keyValid = await compareSecret(accessKey, sender.accessKeyHash);
    if (!keyValid) return NextResponse.json({ error: "Invalid Access Key" }, { status: 401 });
    if (sender.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    sender.walletBalance -= amount;
    receiver.walletBalance += amount;
    await sender.save();
    await receiver.save();

    await Transaction.create({
      memberId: sender.memberId,
      type: "p2p_transfer_out",
      direction: "debit",
      amount,
      currency: "USDT",
      status: "completed",
      note: `To ${receiver.memberId}${remarks ? " — " + remarks : ""}`,
    });
    await Transaction.create({
      memberId: receiver.memberId,
      type: "p2p_transfer_in",
      direction: "credit",
      amount,
      currency: "USDT",
      status: "completed",
      note: `From ${sender.memberId}${remarks ? " — " + remarks : ""}`,
    });

    return NextResponse.json({ success: true, receiverName: receiver.fullName });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Transfer failed" }, { status: 500 });
  }
}
