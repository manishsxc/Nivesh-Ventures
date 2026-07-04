"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { Gift, Trophy } from "lucide-react";
import { currencySymbol } from "@/lib/currency";

interface RewardLog {
  _id: string;
  rewardType: string;
  amount: number;
  status: "pending" | "released" | "cancelled";
  createdAt: string;
}

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
  const [logs, setLogs] = useState<RewardLog[]>([]);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, rewardsRes] = await Promise.all([
          fetch("/api/user/me", { cache: "no-store" }),
          fetch("/api/rewards", { cache: "no-store" })
        ]);

        if (meRes.ok) {
          const d = await meRes.json();
          setStats(d.stats);
        }

        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          setLogs(data.logs || []);
          setBreakdown(data.breakdown || {});
          setTotalEarned(data.totalEarned || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const symbol = currencySymbol(profile?.country);
  const left = stats?.leftTeam ?? 0;
  const right = stats?.rightTeam ?? 0;

  // Default reward types listing for display
  const rewardInfo = [
    { type: "referral_reward", name: "Referral Reward", desc: "Bonus earned when your direct referrals unlock active status." },
    { type: "matching_reward", name: "Matching Reward", desc: "Binary matching income distributed on corresponding left-right team business volumes." },
    { type: "booster_reward", name: "Booster Reward", desc: "Enhanced reward received upon meeting rapid direct sponsor milestones." },
    { type: "return_reward", name: "Return Reward", desc: "Yield or cashback returns calculated over your personal capital investments." },
    { type: "joining_reward", name: "Joining Reward", desc: "One-time bonus credited upon successful validation of account creation." },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center">
            <Gift size={18} className="text-base" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">My Rewards</h1>
            <p className="text-xs text-ink-muted">View all your active, pending, or earned system rewards</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading rewards statement...</p>
      ) : (
        <div className="space-y-6">
          
          {/* Main Earnings Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-xs text-ink-muted font-medium">Total Rewards Earned</p>
              <p className="font-display text-2xl font-bold mt-1 text-neon-green">{symbol}{totalEarned.toLocaleString()}</p>
            </div>
            
            {/* Wallet Balance Integration */}
            <div className="stat-card">
              <p className="text-xs text-ink-muted font-medium">Main Wallet Balance</p>
              <p className="font-display text-2xl font-bold mt-1 text-neon-cyan">{symbol}{(profile?.walletBalance || 0).toLocaleString()}</p>
            </div>

            <div className="stat-card">
              <p className="text-xs text-ink-muted font-medium">Rewards Wallet Balance</p>
              <p className="font-display text-2xl font-bold mt-1 text-yellow-400">{symbol}{(profile?.totalRewardIncome || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Ranks and Milestones Progression */}
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold text-base mb-4">Rank Qualifications Progress</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {ranks.map((r) => {
                const qualified = left >= r.left && right >= r.right;
                return (
                  <div key={r.code} className={`stat-card relative overflow-hidden ${qualified ? "border-neon-green/30 shadow-neon-sm" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center">
                        <Trophy size={14} className="text-base" />
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        qualified ? "bg-neon-green/20 text-neon-green" : "bg-white/5 text-ink-muted"
                      }`}>{qualified ? "Qualified" : "Not Met"}</span>
                    </div>
                    <h3 className="font-display font-bold text-base">{r.code}</h3>
                    <p className="text-xs text-ink-muted mt-1">{r.left}L + {r.right}R</p>
                    <p className="text-neon-cyan text-xs font-semibold mt-2">{symbol}{r.reward.toLocaleString()} reward</p>
                    <p className="text-[10px] text-ink-muted/60 mt-1">Progress: {left}/{r.left}L · {right}/{r.right}R</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold text-base mb-4">Breakdown by Reward Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewardInfo.map((info) => {
                const amount = breakdown[info.type] || 0;
                return (
                  <div key={info.type} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{info.name}</p>
                      <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">{info.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-ink-muted">Total Paid</span>
                      <span className="font-display text-base font-bold text-neon-cyan">{symbol}{amount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History Logs */}
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold text-base mb-4">Earnings Log</h2>
            {!logs.length ? (
              <p className="text-xs text-ink-muted py-6 text-center">No rewards distributed to your account yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-muted border-b border-white/10">
                      <th className="py-2 pr-4 font-semibold">Reward Type</th>
                      <th className="py-2 pr-4 font-semibold">Amount</th>
                      <th className="py-2 pr-4 font-semibold">Date</th>
                      <th className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-2.5 pr-4 uppercase text-xs font-mono">{log.rewardType.replace(/_/g, " ")}</td>
                        <td className="py-2.5 pr-4 text-neon-green font-semibold">{symbol}{log.amount}</td>
                        <td className="py-2.5 pr-4 text-xs text-ink-muted">{new Date(log.createdAt).toLocaleDateString()}</td>
                        <td className="py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            log.status === "released" ? "bg-neon-green/10 text-neon-green" :
                            log.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                            "bg-neon-magenta/10 text-neon-magenta"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </DashboardShell>
  );
}
