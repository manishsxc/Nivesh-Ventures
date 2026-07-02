import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { memberId: session.memberId },
      { profilePhotoUrl: url },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profilePhotoUrl: updated.profilePhotoUrl });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update profile photo" }, { status: 500 });
  }
}
