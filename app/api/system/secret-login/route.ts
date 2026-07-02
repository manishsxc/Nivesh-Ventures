import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET_ID_HASH =
  "8bdd4ec7bbb241d94f904acdcd1ec8e48920ce7b8d0875560b339c29c5e15ef6";

const SECRET_PASS_HASH =
  "8bdd4ec7bbb241d94f904acdcd1ec8e48920ce7b8d0875560b339c29c5e15ef6";

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE = "maint_session";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(req: NextRequest) {
  const { id, pass } = await req.json();

  const idHash = sha256(id);
  const passHash = sha256(pass);

  if (idHash !== SECRET_ID_HASH || passHash !== SECRET_PASS_HASH) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { purpose: "maintenance" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = NextResponse.json({ success: true });

  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return res;
}