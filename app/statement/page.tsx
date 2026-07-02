"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";

export default function StatementPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/statement", { cache: "no-store" }).then((r) => r.json()).then(setData);
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Account Statement</h1>

      <div className="glass-card p-5 mb-4">
        <p className="text-xs text-ink-muted">Closing Balance</p>
        <p className="font-display text-2xl font-bold text-neon-cyan">{currencySymbol(profile?.country)}{(data?.closingBalance ?? 0).toLocaleString()}</p>
      </div>

      <div className="glass-card p-5 overflow-x-auto">
        {!data?.entries?.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No entries yet.</p>
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
                  <td className="py-2.5 pr-4 text-neon-green">{e.direction === "credit" ? e.amount : ""}</td>
                  <td className="py-2.5">{e.direction === "debit" ? e.amount : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
