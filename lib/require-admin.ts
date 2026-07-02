import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function requireAdmin() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { session };
}
