"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function AdminMonthlyClosingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Configuration inputs
  const [returnPct, setReturnPct] = useState(6.0);
  const [distPct, setDistPct] = useState(100);

  const fetchClosingData = async () => {
    try {
      const res = await fetch("/api/admin/monthly-closing", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load closing data");
      const json = await res.json();
      setData(json);

      if (json.currentClosing) {
        setReturnPct(json.currentClosing.monthlyReturnPercentage || 6.0);
        setDistPct(json.currentClosing.distributionPercentage || 100);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosingData();
  }, []);

  const handleStartClosing = async () => {
    if (!confirm("Are you sure you want to start the Monthly Closing? This will freeze income calculations for the current month.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_closing",
          month: data.currentMonth,
          monthlyReturnPercentage: returnPct,
          distributionPercentage: distPct,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to start closing");
      toast.success("Monthly closing started and incomes calculated successfully!");
      fetchClosingData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteClosing = async () => {
    if (!confirm("Are you sure you want to complete the Monthly Closing? Referral, Matching, and Booster incomes will be released automatically. Carry-forward values will be calculated and current month business will be reset.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_closing",
          month: data.currentMonth,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to complete closing");
      toast.success("Monthly closing completed successfully! Auto-release incomes have been paid.");
      fetchClosingData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseIncome = async (type: string, label: string) => {
    if (!confirm(`Are you sure you want to release ${label} to all eligible users for this month?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "release_income",
          month: data.currentMonth,
          incomeType: type,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to release income");
      toast.success(`${label} released successfully!`);
      fetchClosingData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <AdminSubnav />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-neon-cyan h-8 w-8" />
        </div>
      </DashboardShell>
    );
  }

  const status = data?.status || "open";

  // Timeline indicator states
  const getStepClass = (step: number) => {
    if (status === "open" && step === 1) return "border-neon-cyan bg-neon-cyan/10 text-neon-cyan";
    if (status === "closing_in_progress") {
      if (step === 1) return "border-neon-green bg-neon-green/10 text-neon-green";
      if (step === 2) return "border-neon-cyan bg-neon-cyan/10 text-neon-cyan";
    }
    if (status === "closed") {
      if (step <= 2) return "border-neon-green bg-neon-green/10 text-neon-green";
      if (step === 3) return "border-neon-cyan bg-neon-cyan/10 text-neon-cyan font-bold";
    }
    return "border-white/10 text-ink-muted";
  };

  return (
    <DashboardShell>
      <AdminSubnav />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Monthly Closing & Income Release</h1>
          <p className="text-sm text-ink-muted mt-1">
            Stage, calculate, and release automatic & manual incomes safely and accurately.
          </p>
        </div>
        <button
          onClick={fetchClosingData}
          disabled={actionLoading}
          className="flex items-center gap-2 text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-ink px-4 py-2 rounded-xl transition"
        >
          <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </div>

      {/* ── Section 1: Dashboard Indicators ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-ink-muted">Month Status</span>
            {status === "open" ? (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neon-cyan/10 text-neon-cyan rounded-full border border-neon-cyan/20">
                Open
              </span>
            ) : status === "closing_in_progress" ? (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neon-violet/10 text-neon-violet rounded-full border border-neon-violet/20 animate-pulse">
                In Progress
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neon-green/10 text-neon-green rounded-full border border-neon-green/20">
                Closed
              </span>
            )}
          </div>
          <p className="font-display text-lg font-bold capitalize text-white">
            {data?.currentMonth} Closing
          </p>
        </div>

        <div className="stat-card">
          <span className="text-xs text-ink-muted">Next Closing Date</span>
          <div className="flex items-center gap-2 mt-2">
            <Calendar size={15} className="text-neon-violet" />
            <p className="font-display text-sm font-bold text-white">
              {new Date(data?.nextClosingDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <span className="text-xs text-ink-muted">Total Monthly Business</span>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp size={15} className="text-neon-cyan" />
            <p className="font-display text-lg font-bold text-white">
              ${(data?.totalMonthlyBusiness || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <span className="text-xs text-ink-muted">Pending Payouts</span>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={15} className="text-neon-violet" />
            <p className="font-display text-lg font-bold text-neon-violet">
              ${(data?.pendingIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <span className="text-xs text-ink-muted">Released Payouts</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 size={15} className="text-neon-green" />
            <p className="font-display text-lg font-bold text-neon-green">
              ${(data?.releasedIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Closing timeline/workflow ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Step 1 */}
        <div className={`glass-card p-6 flex flex-col justify-between border ${status === "open" ? "border-neon-cyan/30 shadow-neon-sm" : "border-white/5"}`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-display text-sm font-bold ${getStepClass(1)}`}>
                1
              </span>
              <h2 className="font-display font-semibold text-white">Stage 1: Freeze Calculations</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Set monthly yield percentage and distribution parameters, then freeze all incomes for calculation.
            </p>

            {status === "open" ? (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="flex justify-between text-xs text-ink-muted mb-1">
                    <span>Monthly Returns (%)</span>
                    <span className="text-neon-cyan font-semibold">{returnPct}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="7"
                    step="0.1"
                    className="w-full accent-neon-cyan"
                    value={returnPct}
                    onChange={(e) => setReturnPct(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs text-ink-muted mb-1">
                    <span>Distribution Percentage (%)</span>
                    <span className="text-neon-cyan font-semibold">{distPct}%</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field w-full text-sm"
                    value={distPct}
                    onChange={(e) => setDistPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/5 rounded-xl text-xs space-y-2 mb-4">
                <div className="flex justify-between text-ink-muted">
                  <span>Staged Returns:</span>
                  <span className="text-white font-semibold">{data?.currentClosing?.monthlyReturnPercentage}%</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Distribution Cap:</span>
                  <span className="text-white font-semibold">{data?.currentClosing?.distributionPercentage}%</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStartClosing}
            disabled={status !== "open" || actionLoading}
            className={`btn-primary w-full flex items-center justify-center gap-2 mt-4 py-2.5 ${
              status !== "open" ? "opacity-50 cursor-not-allowed bg-white/5 border-white/5 text-ink-muted" : ""
            }`}
          >
            <Lock size={15} />
            Start Closing & Freeze
          </button>
        </div>

        {/* Step 2 */}
        <div className={`glass-card p-6 flex flex-col justify-between border ${status === "closing_in_progress" ? "border-neon-cyan/30 shadow-neon-sm" : "border-white/5"}`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-display text-sm font-bold ${getStepClass(2)}`}>
                2
              </span>
              <h2 className="font-display font-semibold text-white">Stage 2: Auto-Release Payouts</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Completes the month closing. Automatically releases Referral, Matching, and Booster incomes. Carry-forward balances are committed and current month stats are reset.
            </p>
          </div>

          <button
            onClick={handleCompleteClosing}
            disabled={status !== "closing_in_progress" || actionLoading}
            className={`btn-primary w-full flex items-center justify-center gap-2 mt-4 py-2.5 ${
              status !== "closing_in_progress" ? "opacity-50 cursor-not-allowed bg-white/5 border-white/5 text-ink-muted" : ""
            }`}
          >
            <Unlock size={15} />
            Complete Closing & Auto-Release
          </button>
        </div>

        {/* Step 3 */}
        <div className={`glass-card p-6 flex flex-col justify-between border ${status === "closed" ? "border-neon-cyan/30 shadow-neon-sm" : "border-white/5"}`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-display text-sm font-bold ${getStepClass(3)}`}>
                3
              </span>
              <h2 className="font-display font-semibold text-white">Stage 3: Manual Releases</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Manually authorize payments for manual release groups. Payouts are safely logged for full security auditing.
            </p>

            {status === "closed" ? (
              <div className="space-y-2 mb-4">
                {[
                  { key: "returns_income", label: "Investor Monthly Returns" },
                  { key: "level_income", label: "Returns Level Income" },
                  { key: "reward_income", label: "Reward Income" },
                ].map((item) => {
                  const isReleased = data?.currentClosing?.releasedTypes?.includes(item.key);
                  return (
                    <div key={item.key} className="flex justify-between items-center p-2 border border-white/5 bg-white/5 rounded-xl">
                      <span className="text-xs text-white font-medium">{item.label}</span>
                      <button
                        onClick={() => handleReleaseIncome(item.key, item.label)}
                        disabled={isReleased || actionLoading}
                        className={`text-[10px] font-semibold px-3 py-1 rounded-lg transition ${
                          isReleased
                            ? "bg-neon-green/10 text-neon-green border border-neon-green/20 cursor-default"
                            : "bg-neon-cyan/15 text-neon-cyan hover:bg-neon-cyan/25 border border-neon-cyan/20"
                        }`}
                      >
                        {isReleased ? "Released" : "Release"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-white/10 rounded-xl text-center py-8">
                <span className="text-xs text-ink-muted">Unlocks when closing is complete</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-ink-muted pt-4 border-t border-white/5 mt-4">
            <ShieldCheck size={14} className="text-neon-cyan" />
            <span>Fully audited ledger processing</span>
          </div>
        </div>
      </div>

      {/* ── Section 3: History & Release Logs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Past Closings */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-4 text-white flex items-center gap-2">
            <Calendar size={18} className="text-neon-cyan" />
            Past Closings History
          </h2>
          {!data?.history?.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No past closing records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-muted">
                <thead>
                  <tr className="border-b border-white/10 pb-2">
                    <th className="py-2 text-white font-semibold">Month</th>
                    <th className="py-2 text-white font-semibold">Business</th>
                    <th className="py-2 text-white font-semibold">Yield %</th>
                    <th className="py-2 text-white font-semibold">Dist %</th>
                    <th className="py-2 text-white font-semibold">Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h: any) => (
                    <tr key={h._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-semibold text-white">{h.month}</td>
                      <td className="py-2.5">${(h.totalMonthlyBusiness || 0).toLocaleString()}</td>
                      <td className="py-2.5">{h.monthlyReturnPercentage}%</td>
                      <td className="py-2.5">{h.distributionPercentage}%</td>
                      <td className="py-2.5">{new Date(h.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Release logs */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-4 text-white flex items-center gap-2">
            <DollarSign size={18} className="text-neon-cyan" />
            Payout Release Logs ({data?.currentClosing?.month})
          </h2>
          {!data?.currentClosing?.releaseLogs?.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No release logs recorded for this month.</p>
          ) : (
            <div className="space-y-3">
              {data.currentClosing.releaseLogs.map((log: any) => (
                <div key={log._id} className="flex justify-between items-center p-3 border border-white/5 bg-white/5 rounded-xl text-xs">
                  <div>
                    <p className="font-semibold text-white capitalize">{log.incomeType.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      Released on {new Date(log.releasedAt).toLocaleString()} by {log.releasedBy}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-neon-green">
                    +${log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
