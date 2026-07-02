import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const search = req.nextUrl.searchParams.get("q") || "";

  const query = search
    ? {
        role: "member",
        $or: [
          { memberId: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : { role: "member" };

  const members = await User.find(query)
    .select("-accessKeyHash -loginKeyHash -firebaseUid")
    .sort({ createdAt: -1 })
    .limit(200);

  return NextResponse.json({ members });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { memberId, isActive } = await req.json();
  if (!memberId || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "memberId and isActive are required" }, { status: 400 });
  }

  await connectDB();
  const updated = await User.findOneAndUpdate({ memberId }, { isActive }, { new: true }).select(
    "memberId isActive"
  );
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  return NextResponse.json({ success: true, member: updated });
}
