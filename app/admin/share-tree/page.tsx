"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import { Users, ChevronRight, CheckCircle2 } from "lucide-react";

type LeaderRow = { memberId: string; fullName: string; sharedCount: number; successfulCount: number };
type ChildRow = {
  memberId: string;
  fullName: string;
  joinedAt: string;
  walletCredited: boolean;
  sharedCount: number;
  successfulCount: number;
};

export default function ShareTreePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<{ memberId: string; fullName: string }[]>([]);
  const [children, setChildren] = useState<ChildRow[] | null>(null);
  const [childLoading, setChildLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/share-tree", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  async function openNode(memberId: string, fullName: string, fresh?: boolean) {
    setChildLoading(true);
    const res = await fetch(`/api/admin/share-tree?memberId=${memberId}`, { cache: "no-store" });
    const data = await res.json();
    setChildren(data.children || []);
    setPath((p) => (fresh ? [{ memberId, fullName }] : [...p, { memberId, fullName }]));
    setChildLoading(false);
  }

  function jumpTo(index: number) {
    const node = path[index];
    setPath(path.slice(0, index + 1));
    openNodeSilently(node.memberId);
  }

  async function openNodeSilently(memberId: string) {
    setChildLoading(true);
    const res = await fetch(`/api/admin/share-tree?memberId=${memberId}`, { cache: "no-store" });
    const data = await res.json();
    setChildren(data.children || []);
    setChildLoading(false);
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-2">Share Tree</h1>
      <p className="text-sm text-ink-muted mb-6">
        Who shared their referral link, how many signed up, and how many completed a deposit (reward-earning shares).
      </p>

      {!children ? (
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-4">Top Referrers</h2>
          {loading ? (
            <p className="text-sm text-ink-muted">Loading...</p>
          ) : !leaderboard.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No shares recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((r, i) => (
                <button
                  key={r.memberId}
                  onClick={() => openNode(r.memberId, r.fullName, true)}
                  className="w-full flex items-center justify-between bg-base-soft hover:border-neon-cyan/50 border border-transparent rounded-xl p-3 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted w-5">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center text-xs font-bold text-base">
                      {r.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.fullName}</p>
                      <p className="text-xs text-ink-muted">{r.memberId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-ink-muted flex items-center gap-1"><Users size={12} /> {r.sharedCount} shared</span>
                    <span className="text-neon-green flex items-center gap-1"><CheckCircle2 size={12} /> {r.successfulCount} paid</span>
                    <ChevronRight size={14} className="text-ink-muted" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-5">
          <div className="flex items-center gap-1 text-xs text-ink-muted mb-4 flex-wrap">
            <button onClick={() => { setChildren(null); setPath([]); }} className="text-neon-cyan">Leaderboard</button>
            {path.map((p, i) => (
              <span key={p.memberId} className="flex items-center gap-1">
                <ChevronRight size={12} />
                <button onClick={() => jumpTo(i)} className="text-neon-cyan">{p.fullName}</button>
              </span>
            ))}
          </div>

          <h2 className="font-display font-semibold mb-1">
            {path[path.length - 1]?.fullName}'s shares
          </h2>
          <p className="text-xs text-ink-muted mb-4">
            Shared with {children.length} people · {children.filter((c) => c.walletCredited).length} completed deposit (rewarded)
          </p>

          {childLoading ? (
            <p className="text-sm text-ink-muted">Loading...</p>
          ) : !children.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">Hasn't shared with anyone yet.</p>
          ) : (
            <div className="space-y-2">
              {children.map((c) => (
                <button
                  key={c.memberId}
                  onClick={() => openNode(c.memberId, c.fullName)}
                  className="w-full flex items-center justify-between bg-base-soft hover:border-neon-cyan/50 border border-transparent rounded-xl p-3 text-left transition"
                >
                  <div>
                    <p className="text-sm font-medium">{c.fullName} <span className="text-xs text-ink-muted">({c.memberId})</span></p>
                    <p className="text-xs text-ink-muted">Joined {new Date(c.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={c.walletCredited ? "text-neon-green" : "text-ink-muted"}>
                      {c.walletCredited ? "Deposit done — rewarded" : "No deposit yet"}
                    </span>
                    <span className="text-ink-muted flex items-center gap-1"><Users size={12} /> {c.sharedCount}</span>
                    <ChevronRight size={14} className="text-ink-muted" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
