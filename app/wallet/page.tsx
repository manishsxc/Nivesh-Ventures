"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, PiggyBank, Coins } from "lucide-react";
import { currencySymbol } from "@/lib/currency";

export default function WalletPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const balances = [
    { label: "My Wallet", value: data?.wallet?.walletBalance ?? 0, icon: Wallet, color: "from-neon-violet to-neon-cyan" },
    { label: "Nivesh Wallet", value: data?.wallet?.nivshWalletBalance ?? 0, icon: PiggyBank, color: "from-neon-green to-neon-cyan" },
    { label: "USDT Wallet", value: data?.wallet?.usdtWalletBalance ?? 0, icon: Coins, color: "from-neon-magenta to-neon-violet" },
  ];

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Wallet</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {balances.map((b) => (
          <div key={b.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-3`}>
              <b.icon size={18} className="text-base" />
            </div>
            <p className="text-xs text-ink-muted">{b.label}</p>
            <p className="font-display text-2xl font-bold mt-1">{currencySymbol(profile?.country)}{b.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Nivesh (lifetime)</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-cyan">{currencySymbol(profile?.country)}{(profile?.totalInvestment ?? 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Withdrawal</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-cyan">{currencySymbol(profile?.country)}{(profile?.totalWithdrawn ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-display font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <p className="text-sm text-ink-muted">Loading...</p>
        ) : !data?.transactions?.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t: any) => (
                  <tr key={t._id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4 text-ink-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-4 capitalize">{t.type.replace(/_/g, " ")}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.status === "completed" ? "bg-neon-green/15 text-neon-green" :
                        t.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : "bg-neon-magenta/15 text-neon-magenta"
                      }`}>{t.status}</span>
                    </td>
                    <td className={`py-2.5 text-right font-medium ${t.direction === "credit" ? "text-neon-green" : "text-ink"}`}>
                      {t.direction === "credit" ? "+" : "-"}{t.currency} {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
