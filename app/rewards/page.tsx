"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";

const ranks = [
  { code: "X1", left: 20, right: 20, reward: 100 },
  { code: "X2", left: 30, right: 30, reward: 300 },
  { code: "X3", left: 50, right: 50, reward: 500 },
  { code: "X4", left: 100, right: 100, reward: 1000 },
  { code: "X5", left: 200, right: 200, reward: 3000 },
];

export default function RewardsPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/user/me", { cache: "no-store" }).then((r) => r.json()).then((d) => setStats(d.stats));
  }, []);

  const left = stats?.leftTeam ?? 0;
  const right = stats?.rightTeam ?? 0;

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Rank & Reward</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranks.map((r) => {
          const qualified = left >= r.left && right >= r.right;
          return (
            <div key={r.code} className={`stat-card ${qualified ? "border-neon-green/50" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center">
                  <Trophy size={18} className="text-base" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  qualified ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
                }`}>{qualified ? "Qualified" : "Not Qualified"}</span>
              </div>
              <h3 className="font-display font-bold text-lg">{r.code}</h3>
              <p className="text-sm text-ink-muted mt-1">{r.left} Left + {r.right} Right</p>
              <p className="text-neon-cyan font-semibold mt-2">{currencySymbol(profile?.country)}{r.reward.toLocaleString()} reward</p>
              <p className="text-xs text-ink-muted mt-2">Your progress: {left}/{r.left} left · {right}/{r.right} right</p>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
