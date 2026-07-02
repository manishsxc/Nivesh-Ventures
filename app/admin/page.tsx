"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import Link from "next/link";
import { Users, UserCheck, DollarSign, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Members", value: data?.totalMembers ?? 0, icon: Users },
    { label: "Active Members", value: data?.activeMembers ?? 0, icon: UserCheck },
    { label: "Total Income Paid", value: `$${(data?.totalIncome ?? 0).toLocaleString()}`, icon: DollarSign },
    { label: "Pending Withdrawals", value: data?.pendingWithdrawals ?? 0, icon: Clock },
  ];

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : !data ? (
        <p className="text-sm text-neon-magenta">Admin access required, or no data yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((c) => (
              <div key={c.label} className="stat-card">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center mb-3">
                  <c.icon size={18} className="text-base" />
                </div>
                <p className="text-xs text-ink-muted">{c.label}</p>
                <p className="font-display text-xl font-bold mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-display font-semibold">Recent Registrations</h2>
                <Link href="/admin/members" className="text-xs text-neon-cyan">Manage members</Link>
              </div>
              {!data.recentRegistrations?.length ? (
                <p className="text-sm text-ink-muted py-6 text-center">No registrations yet.</p>
              ) : data.recentRegistrations.map((m: any) => (
                <div key={m.memberId} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                  <span>{m.fullName} <span className="text-ink-muted text-xs">({m.memberId})</span></span>
                  <span className="text-ink-muted text-xs">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-display font-semibold">Recent Transactions</h2>
                <Link href="/admin/withdrawals" className="text-xs text-neon-cyan">Withdrawals</Link>
              </div>
              {!data.recentTransactions?.length ? (
                <p className="text-sm text-ink-muted py-6 text-center">No transactions yet.</p>
              ) : data.recentTransactions.map((t: any) => (
                <div key={t._id} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                  <span className="capitalize">{t.type.replace(/_/g, " ")} · {t.memberId}</span>
                  <span className={t.direction === "credit" ? "text-neon-green" : "text-ink-muted"}>
                    {t.direction === "credit" ? "+" : "-"}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
