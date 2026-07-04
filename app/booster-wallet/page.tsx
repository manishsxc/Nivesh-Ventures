"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";
import {
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Hash,
} from "lucide-react";

type BoosterTx = {
  _id: string;
  transactionId: string;
  type: "credit" | "debit";
  amount: number;
  walletType: string;
  adminRemarks: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
};

export default function BoosterWalletPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<{
    balance: number;
    transactions: BoosterTx[];
    totalCredits: number;
    totalDebits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const sym = currencySymbol(profile?.country);

  useEffect(() => {
    fetch("/api/booster-wallet", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Booster Wallet</h1>
          <p className="text-xs text-ink-muted">
            Admin-managed promotional & bonus balance
          </p>
        </div>
      </div>

      {/* Balance + Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3">
            <Wallet size={18} className="text-white" />
          </div>
          <p className="text-xs text-ink-muted">Current Balance</p>
          <p className="font-display text-2xl font-bold mt-1 text-amber-400">
            {loading ? "..." : `${sym}${(data?.balance ?? 0).toLocaleString()}`}
          </p>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-xs text-ink-muted">Total Credits</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-green">
            {loading
              ? "..."
              : `+${sym}${(data?.totalCredits ?? 0).toLocaleString()}`}
          </p>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-magenta to-rose-600 flex items-center justify-center mb-3">
            <TrendingDown size={18} className="text-white" />
          </div>
          <p className="text-xs text-ink-muted">Total Debits</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-magenta">
            {loading
              ? "..."
              : `-${sym}${(data?.totalDebits ?? 0).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card p-5">
        <h2 className="font-display font-semibold mb-4">
          Booster Wallet History
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.transactions?.length ? (
          <p className="text-sm text-ink-muted py-12 text-center">
            No booster wallet transactions yet.
          </p>
        ) : (
          <div className="space-y-1">
            {data.transactions.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      t.type === "credit"
                        ? "bg-neon-green/15 text-neon-green"
                        : "bg-neon-magenta/15 text-neon-magenta"
                    }`}
                  >
                    {t.type === "credit" ? (
                      <ArrowDownRight size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {t.adminRemarks || t.type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Clock size={10} />
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        {new Date(t.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                        <Hash size={9} />
                        {t.transactionId}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      Balance: {sym}
                      {t.balanceBefore.toLocaleString()} → {sym}
                      {t.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>

                <p
                  className={`text-sm font-semibold whitespace-nowrap ${
                    t.type === "credit" ? "text-neon-green" : "text-neon-magenta"
                  }`}
                >
                  {t.type === "credit" ? "+" : "-"}
                  {sym}
                  {t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
