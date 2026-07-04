"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { CheckCircle, AlertCircle, DollarSign, Search, Plus, ChevronLeft, ChevronRight, XCircle } from "lucide-react";

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Initiate Refund modal/form state
  const [showForm, setShowForm] = useState(false);
  const [targetType, setTargetType] = useState("single"); // single, multiple, team, transaction
  const [memberId, setMemberId] = useState("");
  const [memberIdsInput, setMemberIdsInput] = useState(""); // comma-separated
  const [amount, setAmount] = useState("");
  const [refundType, setRefundType] = useState("manual"); // wallet, deposit, activation, manual
  const [walletType, setWalletType] = useState("main");
  const [remarks, setRemarks] = useState("");
  const [referenceTxId, setReferenceTxId] = useState("");

  const fetchRefundsData = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: "10",
      });
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/admin/refunds?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load refunds");
      const json = await res.json();
      setRefunds(json.refunds || []);
      setStats(json.stats || null);
      setPage(json.pagination?.page || 1);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    void fetchRefundsData(1);
  }, [fetchRefundsData]);

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    const memberIds = targetType === "multiple"
      ? memberIdsInput.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    if (targetType === "single" && !memberId) {
      toast.error("User ID is required");
      return;
    }

    if (targetType === "multiple" && memberIds.length === 0) {
      toast.error("At least one User ID is required");
      return;
    }

    if (targetType === "team" && !memberId) {
      toast.error("Sponsor ID is required to calculate team downlines");
      return;
    }

    if (!confirm("Are you sure you want to initiate this refund? It will enter the pending verification queue.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          memberId,
          memberIds,
          refundAmount: Number(amount),
          refundType,
          walletType,
          remarks,
          referenceTxId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Initiation failed");

      toast.success(result.count ? `${result.count} refunds initiated successfully!` : "Refund initiated successfully!");
      setShowForm(false);
      // Reset form fields
      setMemberId("");
      setMemberIdsInput("");
      setAmount("");
      setRemarks("");
      setReferenceTxId("");
      fetchRefundsData(1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async (id: string, action: "approve" | "reject") => {
    const confirmMsg = action === "approve"
      ? "Are you sure you want to APPROVE this refund? The user's wallet will be credited instantly."
      : "Are you sure you want to REJECT this refund?";

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `Failed to ${action} refund`);

      toast.success(`Refund successfully ${action}d!`);
      fetchRefundsData(page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardShell>
      <AdminSubnav />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Refund Management</h1>
          <p className="text-sm text-ink-muted mt-1">
            Initiate, verify, and approve wallet adjustments and transactional refunds.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-xs border border-neon-cyan/20 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan px-4 py-2.5 rounded-xl transition w-full lg:w-auto justify-center"
        >
          <Plus size={14} />
          {showForm ? "View Payout List" : "Initiate Refund Payout"}
        </button>
      </div>

      {/* ── Section 1: Dashboard Analytics Summary ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="stat-card">
            <span className="text-xs text-ink-muted">Total Refund Payouts</span>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle size={15} className="text-neon-green" />
              <p className="font-display text-lg font-bold text-white">
                {stats.totalRefundsCount}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <span className="text-xs text-ink-muted">Total Disbursed</span>
            <div className="flex items-center gap-2 mt-2">
              <DollarSign size={15} className="text-neon-cyan" />
              <p className="font-display text-lg font-bold text-white">
                ${stats.totalRefundsAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <span className="text-xs text-ink-muted">Pending Audits</span>
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle size={15} className="text-neon-violet" />
              <p className="font-display text-lg font-bold text-neon-violet">
                {stats.pendingCount}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <span className="text-xs text-ink-muted">Approved & Completed</span>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle size={15} className="text-neon-green" />
              <p className="font-display text-lg font-bold text-neon-green">
                {stats.completedCount}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <span className="text-xs text-ink-muted">Rejected Audits</span>
            <div className="flex items-center gap-2 mt-2">
              <XCircle size={15} className="text-neon-magenta" />
              <p className="font-display text-lg font-bold text-neon-magenta">
                {stats.rejectedCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Refund Form / Wizard ── */}
      {showForm && (
        <div className="glass-card p-6 mb-6 max-w-2xl border border-neon-cyan/20 shadow-neon-sm">
          <h2 className="font-display font-semibold text-white mb-4">Initiate New Refund Request</h2>
          <form onSubmit={handleInitiateRefund} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Refund Target Group</label>
                <select
                  className="input-field w-full text-sm"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                >
                  <option value="single">Single User ID</option>
                  <option value="multiple">Multiple Selected Users</option>
                  <option value="team">Entire Downline Team</option>
                  <option value="transaction">Transaction ID Refund</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Refund Type</label>
                <select
                  className="input-field w-full text-sm"
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value)}
                >
                  <option value="wallet">Wallet Refund</option>
                  <option value="deposit">Deposit Refund</option>
                  <option value="activation">Activation Refund</option>
                  <option value="manual">Manual Adjustment</option>
                </select>
              </div>
            </div>

            {targetType === "single" && (
              <div>
                <label className="text-xs text-ink-muted block mb-1">Member ID / User ID</label>
                <input
                  type="text"
                  placeholder="e.g. MEM8890"
                  className="input-field w-full text-sm text-white"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>
            )}

            {targetType === "multiple" && (
              <div>
                <label className="text-xs text-ink-muted block mb-1">User IDs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. MEM8890, MEM1234, MEM9010"
                  className="input-field w-full text-sm text-white"
                  value={memberIdsInput}
                  onChange={(e) => setMemberIdsInput(e.target.value)}
                />
              </div>
            )}

            {targetType === "team" && (
              <div>
                <label className="text-xs text-ink-muted block mb-1">Sponsor ID (Refund all downline team members)</label>
                <input
                  type="text"
                  placeholder="e.g. MEM8890"
                  className="input-field w-full text-sm text-white"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>
            )}

            {targetType === "transaction" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Transaction ID / Hash</label>
                  <input
                    type="text"
                    placeholder="e.g. TX-4859012"
                    className="input-field w-full text-sm text-white"
                    value={referenceTxId}
                    onChange={(e) => setReferenceTxId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Recipient User ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MEM8890"
                    className="input-field w-full text-sm text-white"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="input-field w-full text-sm text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">Target Wallet Type</label>
                <select
                  className="input-field w-full text-sm"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                >
                  <option value="main">Main Wallet</option>
                  <option value="booster">Booster Wallet</option>
                  <option value="nivesh">Nivesh Wallet</option>
                  <option value="usdt">USDT Wallet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-muted block mb-1">Reason / Remarks</label>
              <textarea
                placeholder="Reason for initiating refund..."
                className="input-field w-full text-sm text-white h-20"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-white/10 hover:bg-white/5 text-ink-muted px-4 py-2 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary px-5 py-2 text-xs flex items-center gap-2"
              >
                {actionLoading ? "Processing..." : "Initiate Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Section 3: Filters & Search Panel ── */}
      <div className="glass-card p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-ink-muted block mb-1">Search User ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="e.g. MEM8890"
              className="input-field w-full pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-ink-muted block mb-1">Status</label>
          <select
            className="input-field text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-ink-muted block mb-1">Refund Type</label>
          <select
            className="input-field text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="wallet">Wallet Refund</option>
            <option value="deposit">Deposit Refund</option>
            <option value="activation">Activation Refund</option>
            <option value="manual">Manual Adjustment</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("");
            setTypeFilter("");
            setPage(1);
          }}
          className="text-xs text-neon-magenta hover:underline py-2"
        >
          Reset Filters
        </button>
      </div>

      {/* ── Section 4: Refund Queue & History Table ── */}
      <div className="glass-card p-5">
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
          </div>
        ) : refunds.length === 0 ? (
          <p className="text-sm text-ink-muted py-12 text-center">No refund logs found.</p>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-muted">
                <thead>
                  <tr className="border-b border-white/10 pb-2 text-white">
                    <th className="py-2.5 font-semibold">User ID</th>
                    <th className="py-2.5 font-semibold">Amount</th>
                    <th className="py-2.5 font-semibold">Refund Type</th>
                    <th className="py-2.5 font-semibold">Target Wallet</th>
                    <th className="py-2.5 font-semibold">Admin</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Date / Remarks</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((ref) => (
                    <tr key={ref._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-white">{ref.memberId}</td>
                      <td className="py-3 font-display text-sm font-bold text-white">
                        ${ref.refundAmount.toLocaleString()}
                      </td>
                      <td className="py-3 capitalize">{ref.refundType}</td>
                      <td className="py-3 capitalize text-neon-cyan">{ref.walletType}</td>
                      <td className="py-3">{ref.adminName}</td>
                      <td className="py-3">
                        {ref.status === "completed" ? (
                          <span className="px-2.5 py-0.5 text-[9px] font-semibold bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-full">
                            Completed
                          </span>
                        ) : ref.status === "pending" ? (
                          <span className="px-2.5 py-0.5 text-[9px] font-semibold bg-neon-violet/10 text-neon-violet border border-neon-violet/20 rounded-full animate-pulse">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[9px] font-semibold bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20 rounded-full">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3 max-w-[240px]">
                        <p className="text-[10px] text-ink-muted">{new Date(ref.createdAt).toLocaleString()}</p>
                        <p className="text-[11px] text-white mt-0.5 truncate">{ref.remarks || "No remarks"}</p>
                      </td>
                      <td className="py-3 text-right">
                        {ref.status === "pending" ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleProcessRefund(ref._id, "approve")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-neon-green/15 text-neon-green hover:bg-neon-green/25 border border-neon-green/25 font-semibold text-[10px] transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessRefund(ref._id, "reject")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-neon-magenta/15 text-neon-magenta hover:bg-neon-magenta/25 border border-neon-magenta/25 font-semibold text-[10px] transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-ink-muted font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-[11px] text-ink-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchRefundsData(page - 1)}
                  className={`p-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition ${
                    page <= 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchRefundsData(page + 1)}
                  className={`p-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition ${
                    page >= totalPages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
