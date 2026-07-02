"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";

export default function TeamPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team", { cache: "no-store" }).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">My Network</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {["left", "right"].map((side) => {
          const node = data?.tree?.[side];
          return (
            <div key={side} className="glass-card p-5">
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-2">{side} Leg</p>
              {node ? (
                <div>
                  <p className="font-display font-semibold">{node.fullName}</p>
                  <p className="text-xs text-ink-muted">ID: {node.memberId} · Rank: {node.rank}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    node.isActive ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
                  }`}>{node.isActive ? "Active" : "Inactive"}</span>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No member placed here yet. Share your referral link to fill this slot.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card p-5">
        <h2 className="font-display font-semibold mb-4">Direct Team ({data?.directTeam?.length ?? 0})</h2>
        {loading ? (
          <p className="text-sm text-ink-muted">Loading...</p>
        ) : !data?.directTeam?.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No direct referrals yet. Share your QR code from My Profile.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Position</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.directTeam.map((m: any) => (
                  <tr key={m.memberId} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{m.fullName}</p>
                      <p className="text-xs text-ink-muted">{m.memberId}</p>
                    </td>
                    <td className="py-2.5 pr-4 capitalize">{m.position || "—"}</td>
                    <td className="py-2.5 pr-4">{m.rank}</td>
                    <td className="py-2.5 pr-4 text-ink-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.isActive ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
                      }`}>{m.isActive ? "Active" : "Inactive"}</span>
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
