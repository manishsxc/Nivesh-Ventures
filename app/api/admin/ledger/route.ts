import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Ledger from "@/models/Ledger";
import { requireAdmin } from "@/lib/require-admin";
import { getMonthlyLedgerSummary } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  await connectDB();
  const url = req.nextUrl;
  
  const month = url.searchParams.get("month") || "";
  const memberId = url.searchParams.get("memberId") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50"));
  const skip = (page - 1) * limit;

  // If summary requested
  if (url.searchParams.get("summary") === "1" && month) {
    const summary = await getMonthlyLedgerSummary(month);
    return NextResponse.json(summary);
  }

  const query: any = {};
  if (month) query.closingMonth = month;
  if (memberId) query.memberId = memberId;

  const [entries, total] = await Promise.all([
    Ledger.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Ledger.countDocuments(query),
  ]);

  return NextResponse.json({
    entries,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
