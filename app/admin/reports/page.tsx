"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";

export default function AdminReportsPage() {
  const [type, setType] = useState("member");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/reports?${params}`, { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows || []);
    setLoading(false);
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Reports</h1>

      <div className="glass-card p-5 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-ink-muted block mb-1">Report Type</label>
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="member">Member Report</option>
            <option value="income">Income Report</option>
            <option value="withdrawal">Withdrawal Report</option>
            <option value="transaction">Transaction Report</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted block mb-1">From</label>
          <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-ink-muted block mb-1">To</label>
          <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={run} className="btn-primary">Generate</button>
      </div>

      <div className="glass-card p-5 overflow-x-auto">
        {loading ? <p className="text-sm text-ink-muted">Loading...</p> : !rows.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No data — set filters and generate.</p>
        ) : (
          <pre className="text-xs text-ink-muted whitespace-pre-wrap">{JSON.stringify(rows, null, 2)}</pre>
        )}
      </div>
    </DashboardShell>
  );
}
