"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${filter}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function act(withdrawalId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action }),
    });
    if (res.ok) {
      toast.success(`Withdrawal ${action}d`);
      load();
    } else {
      toast.error("Action failed");
    }
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Withdrawal Management</h1>

      <div className="glass-card p-5">
        <div className="flex gap-2 mb-4">
          {["pending", "completed", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition ${
                filter === s ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10" : "border-white/10 text-ink-muted"
              }`}>{s}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Loading...</p>
        ) : !withdrawals.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No {filter} withdrawals.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Charge (3%)</th>
                  <th className="py-2 pr-4">Net</th>
                  <th className="py-2 pr-4">Mode</th>
                  {filter === "pending" && <th className="py-2">Action</th>}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4">{w.memberId}</td>
                    <td className="py-2.5 pr-4">{w.amount}</td>
                    <td className="py-2.5 pr-4 text-ink-muted">{w.processingCharge}</td>
                    <td className="py-2.5 pr-4 text-neon-green">{w.netPayable}</td>
                    <td className="py-2.5 pr-4">{w.mode}</td>
                    {filter === "pending" && (
                      <td className="py-2.5 flex gap-2">
                        <button onClick={() => act(w._id, "approve")} className="text-xs px-3 py-1 rounded-lg bg-neon-green/15 text-neon-green">Approve</button>
                        <button onClick={() => act(w._id, "reject")} className="text-xs px-3 py-1 rounded-lg bg-neon-magenta/15 text-neon-magenta">Reject</button>
                      </td>
                    )}
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
