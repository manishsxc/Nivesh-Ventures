"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";
import { Crown, Calendar, Search } from "lucide-react";
import Link from "next/link";

interface PremiumMember {
  memberId: string;
  fullName: string;
  email: string;
  mobile: string;
  isPremium: boolean;
  premiumActivatedAt?: string;
  premiumExpiresAt?: string;
  createdAt: string;
}

export default function AdminPremiumPage() {
  const [members, setMembers] = useState<PremiumMember[]>([]);
  const [filterStatus, setFilterStatus] = useState(""); // "", "active", "expired", "non_premium"
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Expiry Extension Modal state
  const [extendMemberId, setExtendMemberId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/premium?status=${filterStatus}&q=${encodeURIComponent(searchTerm)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users || []);
      } else {
        toast.error("Failed to load premium members");
      }
    } catch {
      toast.error("An error occurred loading members");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTogglePremium(memberId: string, currentStatus: boolean) {
    const action = currentStatus ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} Premium Membership for ${memberId}?`)) return;

    try {
      const res = await fetch("/api/admin/premium", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      if (res.ok) {
        toast.success(`Premium ${action}d successfully`);
        load();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleExtendExpiry(e: React.FormEvent) {
    e.preventDefault();
    if (!extendMemberId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/premium", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: extendMemberId, action: "extend", extendDays }),
      });
      if (res.ok) {
        toast.success(`Expiry extended by ${extendDays} days`);
        setExtendMemberId(null);
        load();
      } else {
        toast.error("Failed to extend expiry");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1">
        <Link href="/admin" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Dashboard</Link>
        <Link href="/admin/members" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Members</Link>
        <Link href="/admin/premium" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-neon-magenta text-neon-magenta bg-neon-magenta/10">Premium Members</Link>
        <Link href="/admin/withdrawals" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Withdrawals</Link>
        <Link href="/admin/deposits" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Deposits</Link>
        <Link href="/admin/rewards" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Rewards</Link>
        <Link href="/admin/settings" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Website</Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Crown className="text-yellow-400" size={24} /> Premium Membership Controls
          </h1>
          <p className="text-xs text-ink-muted">View, activate, deactivate, extend or revoke user memberships</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); load(); }} 
            className="flex-1 flex gap-2"
          >
            <input 
              className="input-field flex-1 text-sm" 
              placeholder="Search Premium users by Name, Email, or Member ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit" className="btn-primary flex items-center gap-2 text-xs">
              <Search size={14} /> Search
            </button>
          </form>

          <div className="flex gap-2">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="input-field text-xs py-1"
            >
              <option value="">All Members</option>
              <option value="active">Active Premium</option>
              <option value="expired">Expired Premium</option>
              <option value="non_premium">Non-Premium Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted animate-pulse">Loading members database...</p>
        ) : !members.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No members found matching selected criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Member Info</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Activated At</th>
                  <th className="py-2 pr-4">Expiry Date</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isActive = m.isPremium && m.premiumExpiresAt && new Date(m.premiumExpiresAt) > new Date();
                  const isExpired = m.isPremium && m.premiumExpiresAt && new Date(m.premiumExpiresAt) <= new Date();

                  return (
                    <tr key={m.memberId} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-semibold text-white">{m.fullName}</p>
                          <p className="text-xs text-ink-muted">{m.email} · ID: {m.memberId}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold">
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">Active</span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full bg-neon-magenta/20 text-neon-magenta">Expired</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-ink-muted">Non-Premium</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-ink-muted">
                        {m.premiumActivatedAt ? new Date(m.premiumActivatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-ink-muted">
                        {m.premiumExpiresAt ? new Date(m.premiumExpiresAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePremium(m.memberId, m.isPremium)}
                          className={`text-xs px-2.5 py-1 rounded border transition ${
                            m.isPremium 
                              ? "bg-neon-magenta/10 text-neon-magenta border-neon-magenta/20 hover:bg-neon-magenta/20" 
                              : "bg-neon-green/10 text-neon-green border-neon-green/20 hover:bg-neon-green/20"
                          }`}
                        >
                          {m.isPremium ? "Revoke Premium" : "Make Premium"}
                        </button>
                        {m.isPremium && (
                          <button
                            onClick={() => setExtendMemberId(m.memberId)}
                            className="text-xs px-2.5 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition"
                          >
                            Extend Expiry
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extension Modal */}
      {extendMemberId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="text-neon-cyan" size={20} /> Extend Membership
            </h3>
            <form onSubmit={handleExtendExpiry} className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  placeholder="e.g. 30"
                  className="input-field w-full text-sm"
                  min="1"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2 text-sm text-center"
                >
                  {submitting ? "Extending..." : "Confirm Extension"}
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMemberId(null)}
                  className="flex-1 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 text-ink transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
