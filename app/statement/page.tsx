"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";

export default function StatementPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let url = "/api/statement?";
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}`;
    
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [startDate, endDate]);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Account Statement</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className="text-xs text-ink-muted block mb-1">From Date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-ink-muted block mb-1">To Date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setStartDate(""); setEndDate(""); }}
          className="btn-ghost text-xs py-2.5 px-4"
        >
          Reset
        </button>
      </div>

      <div className="glass-card p-5 mb-4">
        <p className="text-xs text-ink-muted">Closing Balance</p>
        <p className="font-display text-2xl font-bold text-neon-cyan">
          {currencySymbol(profile?.country)}
          {loading ? "..." : (data?.closingBalance ?? 0).toLocaleString()}
        </p>
      </div>

      <div className="glass-card p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-ink-muted py-8 text-center">Loading entries...</p>
        ) : !data?.entries?.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No entries found for this range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b border-white/10">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Credit</th>
                <th className="py-2">Debit</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e: any) => (
                <tr key={e._id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-4 text-ink-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-4 capitalize">{e.type.replace(/_/g, " ")}</td>
                  <td className="py-2.5 pr-4 text-neon-green">{e.direction === "credit" ? e.amount.toLocaleString() : ""}</td>
                  <td className="py-2.5">{e.direction === "debit" ? e.amount.toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
