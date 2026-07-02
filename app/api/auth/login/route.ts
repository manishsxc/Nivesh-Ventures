import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import WebsiteSettings from "@/models/WebsiteSettings";
import { signSession, SESSION_COOKIE } from "@/lib/auth-server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { firebaseIdToken, isGoogleLogin } = await req.json();
    if (!firebaseIdToken) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    await connectDB();
    const decoded = await verifyFirebaseToken(firebaseIdToken);
    if (!decoded.uid) {
      throw new Error("Invalid Firebase token payload");
    }
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Auto-assign admin role for configured admin email
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (adminEmail && decoded.email?.toLowerCase() === adminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    // Maintenance gate — blocks non-admin logins when site is switched off.
    const settings = await WebsiteSettings.findOne({ key: "singleton" });
    if (settings && settings.maintenanceMode === false && user.role !== "admin") {
      return NextResponse.json({ error: "System is under maintenance. Try again later." }, { status: 503 });
    }

    const token = signSession({ memberId: user.memberId, role: user.role });
    const res = NextResponse.json({ success: true, memberId: user.memberId, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (err: any) {
    console.error("/api/auth/login error:", {
      message: err?.message || err,
      stack: err?.stack || "",
      env: {
        firebaseAdminProject: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        firebaseAdminEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        jwtSecret: !!process.env.JWT_SECRET,
      },
    });
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
