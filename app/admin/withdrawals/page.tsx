"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { Search, RefreshCw } from "lucide-react";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalWithdrawals: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalAmount: 0
  });

  const [filterStatus, setFilterStatus] = useState("");
  const [filterWallet, setFilterWallet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [globalWithdrawalsEnabled, setGlobalWithdrawalsEnabled] = useState(true);
  const [togglingGlobal, setTogglingGlobal] = useState(false);

  // Remarks state
  const [remarksModalId, setRemarksModalId] = useState<string | null>(null);
  const [remarksAction, setRemarksAction] = useState<"approve" | "reject">("approve");
  const [adminRemarks, setAdminRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, settingsRes] = await Promise.all([
        fetch(`/api/admin/withdrawals?status=${filterStatus}&walletType=${filterWallet}&q=${encodeURIComponent(searchTerm)}`, { cache: "no-store" }),
        fetch("/api/admin/settings", { cache: "no-store" })
      ]);

      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error("Failed to load withdrawals");
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setGlobalWithdrawalsEnabled(settingsData.settings?.withdrawalsEnabled !== false);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterWallet, searchTerm]);

  async function handleToggleGlobal() {
    setTogglingGlobal(true);
    const newValue = !globalWithdrawalsEnabled;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalsEnabled: newValue }),
      });
      if (res.ok) {
        setGlobalWithdrawalsEnabled(newValue);
        toast.success(`Global withdrawals turned ${newValue ? "ON" : "OFF"}`);
      } else {
        toast.error("Failed to update global withdrawals setting");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setTogglingGlobal(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  async function handleActionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!remarksModalId) return;

    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: remarksModalId,
          action: remarksAction,
          adminNote: adminRemarks
        }),
      });

      if (res.ok) {
        toast.success(`Withdrawal ${remarksAction === "approve" ? "approved" : "rejected"} successfully`);
        setRemarksModalId(null);
        setAdminRemarks("");
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to process withdrawal");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold">Withdrawal Management</h1>
        
        {/* Global Toggle Section */}
        <div className="glass-card p-3 flex items-center justify-between gap-4 bg-white/5 border-white/10 shrink-0">
          <div>
            <p className="text-xs font-semibold text-white">Global Withdrawals</p>
            <p className="text-[10px] text-ink-muted">Turn request submission ON/OFF</p>
          </div>
          <button
            type="button"
            disabled={togglingGlobal}
            onClick={handleToggleGlobal}
            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition duration-200 ${
              globalWithdrawalsEnabled ? "bg-neon-green/30 justify-end" : "bg-white/10 justify-start"
            }`}
          >
            <span className={`w-5 h-5 rounded-full block ${globalWithdrawalsEnabled ? "bg-neon-green animate-pulse" : "bg-ink-muted"}`} />
          </button>
        </div>
      </div>

      {/* Statistics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Requests</p>
          <p className="font-display text-xl font-bold mt-1 text-white">{stats.totalWithdrawals}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Pending Requests</p>
          <p className="font-display text-xl font-bold mt-1 text-yellow-400">{stats.pendingCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Approved Requests</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-green">{stats.approvedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Rejected Requests</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-magenta">{stats.rejectedCount}</p>
        </div>
        <div className="stat-card col-span-2 md:col-span-1">
          <p className="text-xs text-ink-muted">Total Requested Value</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-cyan">${stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="glass-card p-5">
        {/* Filters and Search form */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); load(); }} 
            className="flex-1 flex gap-2"
          >
            <input 
              className="input-field flex-1" 
              placeholder="Search by Name or ID" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search size={15} /> Search
            </button>
          </form>

          <div className="flex gap-2">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="input-field text-xs py-1"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed / Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              value={filterWallet} 
              onChange={(e) => setFilterWallet(e.target.value)} 
              className="input-field text-xs py-1"
            >
              <option value="">All Wallets</option>
              <option value="earning">Earning Wallet</option>
              <option value="capital">Capital Wallet</option>
            </select>

            <button 
              onClick={load}
              className="btn-primary p-2 flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Loading withdrawals...</p>
        ) : !withdrawals.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No withdrawals found matching filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Member ID</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Charge (3%)</th>
                  <th className="py-2 pr-4">Net Payable</th>
                  <th className="py-2 pr-4">Mode / Details</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Admin Remarks</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="font-semibold text-white">{w.memberId}</span>
                    </td>
                    <td className="py-2.5 pr-4">${w.amount}</td>
                    <td className="py-2.5 pr-4 text-ink-muted">${w.processingCharge}</td>
                    <td className="py-2.5 pr-4 text-neon-green font-semibold">${w.netPayable}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      <span className="uppercase font-bold text-neon-cyan">{w.mode}</span>
                      {w.mode === "USDT" ? (
                        <div className="text-[10px] font-mono text-ink-muted break-all max-w-[150px]">{w.usdtAddress}</div>
                      ) : (
                        <div className="text-[10px] text-ink-muted">
                          {w.bankDetails?.bankName} ({w.bankDetails?.accountNumber})
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-xs">{w.withdrawalKind || "earning"}</td>
                    <td className="py-2.5 pr-4 text-xs capitalize">
                      <span className={`px-2 py-0.5 rounded-full ${
                        w.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                        w.status === "completed" || w.status === "approved" ? "bg-neon-green/10 text-neon-green" :
                        "bg-neon-magenta/10 text-neon-magenta"
                      }`}>
                        {w.status === "completed" ? "approved" : w.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-ink-muted max-w-[150px] truncate" title={w.adminNote}>
                      {w.adminNote || "—"}
                    </td>
                    <td className="py-2.5 flex items-center gap-2">
                      {w.status === "pending" ? (
                        <>
                          <button 
                            onClick={() => {
                              setRemarksModalId(w._id);
                              setRemarksAction("approve");
                            }} 
                            className="text-xs px-2.5 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 transition"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => {
                              setRemarksModalId(w._id);
                              setRemarksAction("reject");
                            }} 
                            className="text-xs px-2.5 py-1 rounded bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20 hover:bg-neon-magenta/20 transition"
                          >
                            Reject
                          </button>
                        </>
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

      {/* Action With Remarks Dialog Modal */}
      {remarksModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white capitalize">
              {remarksAction} Withdrawal Request
            </h3>
            <form onSubmit={handleActionSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">
                  Remarks / {remarksAction === "reject" ? "Reason for Rejection" : "Approval Note"}
                </label>
                <textarea 
                  value={adminRemarks} 
                  onChange={(e) => setAdminRemarks(e.target.value)} 
                  placeholder={remarksAction === "reject" ? "e.g. Invalid wallet address or profile requirements not met" : "e.g. Transaction processed successfully"}
                  className="input-field w-full text-sm min-h-[80px]"
                  required={remarksAction === "reject"}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  className={`btn-primary flex-1 text-sm py-2 ${remarksAction === "reject" ? "bg-neon-magenta hover:bg-neon-magenta/80" : "bg-neon-green hover:bg-neon-green/80"}`}
                >
                  Confirm {remarksAction === "approve" ? "Approval" : "Rejection"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setRemarksModalId(null);
                    setAdminRemarks("");
                  }}
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
