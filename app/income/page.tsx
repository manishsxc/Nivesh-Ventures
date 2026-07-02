"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";

const typeLabels: Record<string, string> = {
  totalReferralIncome: "Referral Income",
  totalMatchingIncome: "Matching Income",
  totalReturnsIncome: "Returns",
  totalLevelIncome: "Level Returns",
  totalRewardIncome: "Reward Income",
};

export default function IncomePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/income", { cache: "no-store" }).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Income</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(typeLabels).map(([key, label]) => (
          <div key={key} className="stat-card">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="font-display text-lg font-bold mt-1 text-neon-cyan">
              {currencySymbol(profile?.country)}{(data?.totals?.[key] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h2 className="font-display font-semibold mb-4">Income History</h2>
        {loading ? (
          <p className="text-sm text-ink-muted">Loading...</p>
        ) : !data?.history?.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No income recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {data.history.map((h: any) => (
              <div key={h._id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{h.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-ink-muted">{new Date(h.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-semibold text-neon-green">+{h.currency} {h.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
