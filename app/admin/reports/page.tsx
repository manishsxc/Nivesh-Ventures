"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#FF0055", "#00F0FF", "#9D00FF", "#39FF14", "#FFB000", "#FF00AA"];

export default function AdminReportsPage() {
  const [type, setType] = useState("transaction");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [walletType, setWalletType] = useState("");
  const [status, setStatus] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [sortBy, setSortBy] = useState("createdAt_desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [rows, setRows] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const generateReport = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        page: String(targetPage),
        limit: "15",
        sortBy,
      });

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q.trim()) params.set("q", q.trim());
      if (walletType) params.set("walletType", walletType);
      if (status) params.set("status", status);
      if (transactionType) params.set("transactionType", transactionType);

      const res = await fetch(`/api/admin/reports?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to generate report");
      const json = await res.json();

      setRows(json.rows || []);
      setAnalytics(json.analytics || null);
      setPage(json.pagination?.page || 1);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalRows(json.pagination?.totalRows || 0);
    } catch (err: any) {
      toast.error(err.message || "Error generating report");
    } finally {
      setLoading(false);
    }
  }, [from, q, sortBy, status, to, transactionType, type, walletType]);

  useEffect(() => {
    void generateReport(1);
  }, [generateReport]);

  const handleExportCSV = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["MemberID", "FullName", "Type", "Amount", "Wallet", "Status", "Date", "Note"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.memberId || r._id,
          `"${r.fullName || ""}"`,
          r.type || "Member",
          r.amount ?? r.totalInvestment ?? 0,
          r.walletType || "main",
          r.status ?? (r.isActive ? "Active" : "Inactive"),
          new Date(r.createdAt).toLocaleString(),
          `"${r.note || r.remarks || ""}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `report_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
    toast.success("CSV Export triggered!");
  };

  // Setup Visual Chart Data
  const walletData = analytics?.walletDistribution?.map((w: any) => ({
    name: w.wallet.toUpperCase(),
    value: w.total,
  })) || [];

  const incomeVsWithdrawalData = [
    { name: "Deposits", amount: analytics?.totalDeposits || 0 },
    { name: "Withdrawals", amount: analytics?.totalWithdrawals || 0 },
    { name: "Incomes Paid", amount: analytics?.totalIncome || 0 },
  ];

  const growthData = analytics?.growthTrends?.map((g: any) => ({
    month: g.month,
    Growth: g.amount,
  })) || [];

  return (
    <DashboardShell>
      <AdminSubnav />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-ink-muted mt-1">
            Perform in-depth financial auditing and visual growth tracking.
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-ink px-4 py-2.5 rounded-xl transition"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => generateReport(1)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs border border-neon-cyan/20 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw size={14} />
            Run Query
          </button>
        </div>
      </div>

      {/* ── Section 1: Dashboard Analytics Summary ── */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Deposits</p>
            <p className="font-display text-lg font-bold text-white mt-1">
              ${analytics.totalDeposits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Withdrawals</p>
            <p className="font-display text-lg font-bold text-white mt-1">
              ${analytics.totalWithdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Income Paid</p>
            <p className="font-display text-lg font-bold text-white mt-1">
              ${analytics.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Credits</p>
            <p className="font-display text-lg font-bold text-neon-green mt-1">
              ${analytics.totalCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Debits</p>
            <p className="font-display text-lg font-bold text-neon-magenta mt-1">
              ${analytics.totalDebits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Net Business Value</p>
            <p className={`font-display text-lg font-bold mt-1 ${analytics.netProfit >= 0 ? "text-neon-cyan" : "text-neon-magenta"}`}>
              ${analytics.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 2: Visual Charts Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Growth line chart */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold mb-4 text-white">Monthly Growth Trends</h3>
          <div className="h-64">
            {growthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-ink-muted">No growth records</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #3f3f46" }} />
                  <Line type="monotone" dataKey="Growth" stroke="#00F0FF" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Income vs Withdrawals bar chart */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold mb-4 text-white">Inflows vs Outflows</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsWithdrawalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #3f3f46" }} />
                <Bar dataKey="amount" fill="#9D00FF">
                  {incomeVsWithdrawalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wallet Distribution pie chart */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold mb-4 text-white">Wallet Allocation</h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="h-48">
              {walletData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-ink-muted">No allocation data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={walletData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {walletData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #3f3f46" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center text-[10px] text-ink-muted">
              {walletData.map((w: any, i: number) => (
                <span key={w.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {w.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Advanced Filters Panel ── */}
      <div className="glass-card p-5 mb-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-white font-semibold text-sm">
          <Filter size={16} className="text-neon-cyan" />
          <span>Advanced Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-ink-muted block mb-1">Report Target</label>
            <select
              className="input-field w-full text-xs"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="transaction">All Transactions</option>
              <option value="member">Members Report</option>
              <option value="income">Income Report</option>
              <option value="withdrawal">Withdrawal Report</option>
              <option value="deposit">Deposit Report</option>
              <option value="refund">Refund Report</option>
              <option value="credit">Credit Report</option>
              <option value="debit">Debit Report</option>
              <option value="activation">Activation Report</option>
              <option value="wallet_transaction">Wallet-wise Transactions</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">User Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="ID, Name, Email..."
                className="input-field w-full pl-9 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Wallet Type</label>
            <select className="input-field w-full text-xs" value={walletType} onChange={(e) => setWalletType(e.target.value)}>
              <option value="">All Wallets</option>
              <option value="main">Main Wallet</option>
              <option value="usdt">USDT Wallet</option>
              <option value="booster">Booster Wallet</option>
              <option value="nivesh">Nivesh Wallet</option>
              <option value="referral">Referral Wallet</option>
              <option value="matching">Matching Wallet</option>
              <option value="returns">Returns Wallet</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Status</label>
            <select className="input-field w-full text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {type === "member" ? (
                <>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </>
              ) : (
                <>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Start Date</label>
            <input type="date" className="input-field w-full text-xs text-white" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">End Date</label>
            <input type="date" className="input-field w-full text-xs text-white" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-ink-muted">Sort By</span>
            <select className="input-field text-xs py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt_desc">Latest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setQ("");
              setWalletType("");
              setStatus("");
              setTransactionType("");
              setSortBy("createdAt_desc");
              setPage(1);
            }}
            className="text-xs text-neon-magenta hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ── Section 4: Data Table ── */}
      <div className="glass-card p-5 overflow-hidden">
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full" />
          </div>
        ) : !rows.length ? (
          <p className="text-sm text-ink-muted py-12 text-center">No report entries found matches query.</p>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-muted">
                <thead>
                  <tr className="border-b border-white/10 pb-2 text-white">
                    <th className="py-2.5 font-semibold">User</th>
                    <th className="py-2.5 font-semibold">Type</th>
                    <th className="py-2.5 font-semibold">Wallet</th>
                    <th className="py-2.5 font-semibold">Amount</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Timestamp</th>
                    <th className="py-2.5 font-semibold">Remarks/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{row.fullName || row.email}</span>
                          <span className="text-[10px] text-ink-muted">{row.memberId || row._id}</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold capitalize text-white">
                        {row.type ? row.type.replace(/_/g, " ") : "Member"}
                      </td>
                      <td className="py-3 capitalize">
                        {row.walletType || "Main"}
                      </td>
                      <td className="py-3 font-semibold text-white">
                        ${(row.amount ?? row.totalInvestment ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3">
                        {row.status === "completed" || row.isActive === true ? (
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-full">
                            Completed
                          </span>
                        ) : row.status === "pending" ? (
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-neon-violet/10 text-neon-violet border border-neon-violet/20 rounded-full">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20 rounded-full">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 max-w-[200px] truncate text-[11px]">
                        {row.note || row.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-[11px] text-ink-muted">
                Showing {rows.length} of {totalRows} entries (Page {page} of {totalPages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => generateReport(page - 1)}
                  className={`p-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition ${
                    page <= 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => generateReport(page + 1)}
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
