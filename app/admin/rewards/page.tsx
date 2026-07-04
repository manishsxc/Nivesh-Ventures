"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";
import { Gift, PlusCircle, DollarSign, Trash2 } from "lucide-react";
import Link from "next/link";

interface RewardRule {
  _id: string;
  name: string;
  type: string;
  amount: number;
  isPercentage: boolean;
  isActive: boolean;
  description: string;
  eligibilityConditions: string;
}

interface RewardLog {
  _id: string;
  memberId: string;
  rewardType: string;
  amount: number;
  status: "pending" | "released" | "cancelled";
  adminRemarks: string;
  createdAt: string;
}

export default function AdminRewardsPage() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [logs, setLogs] = useState<RewardLog[]>([]);
  const [stats, setStats] = useState({ totalDistributed: 0, pendingCount: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Create rule form
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", type: "", amount: "", isPercentage: false, description: "", eligibilityConditions: "" });
  const [submittingRule, setSubmittingRule] = useState(false);

  // Manual release form
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ memberId: "", type: "", amount: "", remarks: "" });
  const [submittingRelease, setSubmittingRelease] = useState(false);

  // Edit Pending Log Modal
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rewards?type=${filterType}&status=${filterStatus}&q=${encodeURIComponent(searchTerm)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error("Failed to load rewards panel");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchTerm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleRule(ruleId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit_rule", id: ruleId, isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Rule status updated`);
        load();
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm("Are you sure you want to delete this reward rule?")) return;
    try {
      const res = await fetch(`/api/admin/rewards?id=${ruleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rule deleted successfully");
        load();
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleForm.name || !ruleForm.type || !ruleForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmittingRule(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_rule",
          name: ruleForm.name,
          type: ruleForm.type,
          amount: parseFloat(ruleForm.amount),
          isPercentage: ruleForm.isPercentage,
          description: ruleForm.description,
          eligibilityConditions: ruleForm.eligibilityConditions
        }),
      });

      if (res.ok) {
        toast.success("Reward rule created successfully");
        setShowRuleModal(false);
        setRuleForm({ name: "", type: "", amount: "", isPercentage: false, description: "", eligibilityConditions: "" });
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create rule");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingRule(false);
    }
  }

  async function handleManualRelease(e: React.FormEvent) {
    e.preventDefault();
    if (!releaseForm.memberId || !releaseForm.type || !releaseForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmittingRelease(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual_release",
          memberId: releaseForm.memberId,
          type: releaseForm.type,
          amount: parseFloat(releaseForm.amount),
          remarks: releaseForm.remarks
        }),
      });

      if (res.ok) {
        toast.success("Reward released successfully");
        setShowReleaseModal(false);
        setReleaseForm({ memberId: "", type: "", amount: "", remarks: "" });
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to release reward");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingRelease(false);
    }
  }

  async function handleUpdateLogStatus(action: "released" | "cancelled") {
    if (!editLogId) return;

    setSubmittingAction(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_log",
          id: editLogId,
          status: action,
          remarks: editRemarks
        }),
      });

      if (res.ok) {
        toast.success(`Reward successfully ${action}`);
        setEditLogId(null);
        setEditRemarks("");
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1">
        <Link href="/admin" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Dashboard</Link>
        <Link href="/admin/members" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Members</Link>
        <Link href="/admin/premium" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Premium Members</Link>
        <Link href="/admin/withdrawals" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Withdrawals</Link>
        <Link href="/admin/deposits" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Deposits</Link>
        <Link href="/admin/rewards" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-neon-magenta text-neon-magenta bg-neon-magenta/10">Rewards</Link>
        <Link href="/admin/settings" className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:border-white/25">Website</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Gift className="text-neon-cyan animate-pulse" size={24} /> Reward Management Panel
          </h1>
          <p className="text-xs text-ink-muted">Configure reward distribution rules, view statistics, and release manual rewards</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowRuleModal(true)} 
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <PlusCircle size={14} /> Add Reward Rule
          </button>
          <button 
            onClick={() => setShowReleaseModal(true)} 
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <DollarSign size={14} /> Release Manual Reward
          </button>
        </div>
      </div>

      {/* Stats Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-ink-muted font-medium">Total Rewards Distributed</p>
          <p className="font-display text-2xl font-bold mt-1 text-neon-green">${stats.totalDistributed.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted font-medium">Pending Rewards</p>
          <p className="font-display text-2xl font-bold mt-1 text-yellow-400">${stats.pendingCount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted font-medium">Total Reward Recipients</p>
          <p className="font-display text-2xl font-bold mt-1 text-neon-cyan">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Reward Rules Configuration Section */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-display font-semibold text-lg mb-4">Reward Rules</h3>
        {!rules.length ? (
          <p className="text-sm text-ink-muted py-6 text-center">No custom reward rules. System defaults apply.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-white truncate max-w-[70%]">{rule.name}</span>
                    <button
                      onClick={() => handleToggleRule(rule._id, rule.isActive)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        rule.isActive ? "bg-neon-green/20 text-neon-green" : "bg-white/10 text-ink-muted"
                      }`}
                    >
                      {rule.isActive ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <p className="text-xs text-ink-muted min-h-[32px] line-clamp-2">{rule.description || "No description provided."}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] text-ink-muted">Reward Type: <span className="text-white font-medium uppercase font-mono">{rule.type.replace(/_/g, " ")}</span></p>
                    <p className="text-[10px] text-ink-muted">Condition: <span className="text-white font-medium">{rule.eligibilityConditions || "Always eligible"}</span></p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                  <span className="font-display text-lg font-bold text-neon-cyan">${rule.amount}{rule.isPercentage ? "%" : ""}</span>
                  <button 
                    onClick={() => handleDeleteRule(rule._id)}
                    className="p-1 rounded text-ink-muted hover:text-neon-magenta hover:bg-neon-magenta/10 transition"
                    title="Delete Rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward logs section */}
      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-display font-semibold text-lg">Reward History Logs</h3>
          
          <div className="flex gap-2 flex-wrap">
            <input 
              className="input-field text-xs py-1" 
              placeholder="Search User ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className="input-field text-xs py-1"
            >
              <option value="">All Types</option>
              <option value="referral_reward">Referral Reward</option>
              <option value="matching_reward">Matching Reward</option>
              <option value="booster_reward">Booster Reward</option>
              <option value="return_reward">Return Reward</option>
              <option value="joining_reward">Joining Reward</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="input-field text-xs py-1"
            >
              <option value="">All Statuses</option>
              <option value="released">Released</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Loading logs history...</p>
        ) : !logs.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No reward distribution records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">Reward Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Date & Time</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Admin Remarks</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-white">{log.memberId}</td>
                    <td className="py-2.5 pr-4 uppercase text-xs font-mono">{log.rewardType.replace(/_/g, " ")}</td>
                    <td className="py-2.5 pr-4 text-neon-cyan font-bold">${log.amount}</td>
                    <td className="py-2.5 pr-4 text-xs text-ink-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        log.status === "released" ? "bg-neon-green/20 text-neon-green" :
                        log.status === "pending" ? "bg-yellow-400/20 text-yellow-400" :
                        "bg-neon-magenta/20 text-neon-magenta"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-ink-muted truncate max-w-[150px]" title={log.adminRemarks}>
                      {log.adminRemarks || "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      {log.status === "pending" ? (
                        <button
                          onClick={() => setEditLogId(log._id)}
                          className="text-xs px-2.5 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition"
                        >
                          Resolve Pending
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Reward Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="text-neon-cyan" size={20} /> Create Reward Rule
            </h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Rule Name</label>
                <input
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Bronze Sponsor Reward"
                  className="input-field w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Reward Type</label>
                <select
                  value={ruleForm.type}
                  onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                  className="input-field w-full text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="referral_reward">Referral Reward</option>
                  <option value="matching_reward">Matching Reward</option>
                  <option value="booster_reward">Booster Reward</option>
                  <option value="return_reward">Return Reward</option>
                  <option value="joining_reward">Joining Reward</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Reward Value</label>
                <input
                  type="number"
                  value={ruleForm.amount}
                  onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                  placeholder="e.g. 50"
                  className="input-field w-full text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPercentage"
                  checked={ruleForm.isPercentage}
                  onChange={(e) => setRuleForm({ ...ruleForm, isPercentage: e.target.checked })}
                  className="rounded border-white/10 bg-base"
                />
                <label htmlFor="isPercentage" className="text-xs text-ink-muted">Is Percentage of trigger action?</label>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Eligibility Conditions</label>
                <textarea
                  value={ruleForm.eligibilityConditions}
                  onChange={(e) => setRuleForm({ ...ruleForm, eligibilityConditions: e.target.value })}
                  placeholder="e.g. Must have active team business >= $1000"
                  className="input-field w-full text-sm min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Description</label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="Additional details or guidelines..."
                  className="input-field w-full text-sm min-h-[60px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingRule}
                  className="btn-primary flex-1 py-2 text-sm text-center font-semibold"
                >
                  {submittingRule ? "Creating..." : "Save Rule"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 text-ink transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="text-neon-cyan" size={20} /> Release Reward
            </h3>
            <form onSubmit={handleManualRelease} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">User Member ID</label>
                <input
                  value={releaseForm.memberId}
                  onChange={(e) => setReleaseForm({ ...releaseForm, memberId: e.target.value })}
                  placeholder="e.g. NV1004"
                  className="input-field w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Reward Type</label>
                <select
                  value={releaseForm.type}
                  onChange={(e) => setReleaseForm({ ...releaseForm, type: e.target.value })}
                  className="input-field w-full text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="referral_reward">Referral Reward</option>
                  <option value="matching_reward">Matching Reward</option>
                  <option value="booster_reward">Booster Reward</option>
                  <option value="return_reward">Return Reward</option>
                  <option value="joining_reward">Joining Reward</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Reward Amount ($)</label>
                <input
                  type="number"
                  value={releaseForm.amount}
                  onChange={(e) => setReleaseForm({ ...releaseForm, amount: e.target.value })}
                  placeholder="e.g. 100"
                  className="input-field w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Admin Remarks / Note</label>
                <textarea
                  value={releaseForm.remarks}
                  onChange={(e) => setReleaseForm({ ...releaseForm, remarks: e.target.value })}
                  placeholder="Internal audit note..."
                  className="input-field w-full text-sm min-h-[60px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingRelease}
                  className="btn-primary flex-1 py-2 text-sm text-center font-semibold animate-pulse"
                >
                  {submittingRelease ? "Processing..." : "Release Now"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 text-ink transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Pending Modal */}
      {editLogId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Resolve Pending Reward</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1 font-semibold">Remarks / Reason</label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Enter release note or cancellation reason..."
                  className="input-field w-full text-sm min-h-[80px]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateLogStatus("released")}
                  disabled={submittingAction}
                  className="btn-primary flex-1 py-2 text-sm text-center bg-neon-green hover:bg-neon-green/80"
                >
                  Approve / Release
                </button>
                <button
                  onClick={() => handleUpdateLogStatus("cancelled")}
                  disabled={submittingAction}
                  className="btn-primary flex-1 py-2 text-sm text-center bg-neon-magenta hover:bg-neon-magenta/80"
                >
                  Reject / Cancel
                </button>
              </div>
              <button
                type="button"
                onClick={() => setEditLogId(null)}
                className="w-full py-2 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-ink transition"
              >
                Back / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
