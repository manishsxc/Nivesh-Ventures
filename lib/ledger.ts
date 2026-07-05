import { connectDB } from "@/lib/mongodb";
import Ledger from "@/models/Ledger";

export interface LedgerEntryParams {
  transactionId?: string;
  closingId?: string;
  closingMonth?: string;
  memberId: string;
  adminId?: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency?: "USDT" | "INR";
  incomeType?: string;
  description: string;
  memberBalanceBefore?: number;
  memberBalanceAfter?: number;
}

/**
 * Record a double-entry ledger entry.
 * Call this alongside every wallet credit/debit operation.
 * Fire-and-forget — does not throw on failure.
 */
export function recordLedgerEntry(params: LedgerEntryParams): void {
  connectDB()
    .then(() =>
      Ledger.create({
        transactionId: params.transactionId || "",
        closingId: params.closingId || "",
        closingMonth: params.closingMonth || "",
        memberId: params.memberId,
        adminId: params.adminId || "",
        debitAccount: params.debitAccount,
        creditAccount: params.creditAccount,
        amount: params.amount,
        currency: params.currency || "USDT",
        incomeType: params.incomeType || "",
        description: params.description,
        memberBalanceBefore: params.memberBalanceBefore ?? null,
        memberBalanceAfter: params.memberBalanceAfter ?? null,
      })
    )
    .catch((err) => console.error("[Ledger] Failed to record ledger entry:", err));
}

/**
 * Get monthly ledger summary (aggregate by debit/credit account).
 */
export async function getMonthlyLedgerSummary(month: string) {
  await connectDB();
  const [credits, debits, memberSummary] = await Promise.all([
    Ledger.aggregate([
      { $match: { closingMonth: month } },
      { $group: { _id: "$creditAccount", totalCredit: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { totalCredit: -1 } },
    ]),
    Ledger.aggregate([
      { $match: { closingMonth: month } },
      { $group: { _id: "$debitAccount", totalDebit: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { totalDebit: -1 } },
    ]),
    Ledger.aggregate([
      { $match: { closingMonth: month, memberId: { $ne: "" } } },
      {
        $group: {
          _id: "$memberId",
          totalReceived: { $sum: "$amount" },
          entries: { $sum: 1 },
        },
      },
      { $sort: { totalReceived: -1 } },
      { $limit: 100 },
    ]),
  ]);

  const totalIn = credits.reduce((s: number, c: any) => s + c.totalCredit, 0);
  const totalOut = debits.reduce((s: number, d: any) => s + d.totalDebit, 0);

  return { month, totalIn, totalOut, net: totalIn - totalOut, credits, debits, memberSummary };
}
