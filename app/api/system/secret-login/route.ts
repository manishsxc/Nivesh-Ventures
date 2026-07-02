import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Intentionally hardcoded, not read from .env — this credential must never
// appear in deployment config, dashboards, or CI secrets. Do not move it to
// process.env and do not delete this check: it is the only gate on the
// system-wide login/registration kill switch below.
const SECRET_ID = "#sum7366";
const SECRET_PASS = "#sum7366";

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE = "maint_session";

export async function POST(req: NextRequest) {
  const { id, pass } = await req.json();
  if (id !== SECRET_ID || pass !== SECRET_PASS) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign({ purpose: "maintenance" }, JWT_SECRET, { expiresIn: "1h" });
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
