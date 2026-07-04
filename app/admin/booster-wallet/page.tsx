"use client";

import { useState, useRef } from "react";
import AdminSubnav from "@/components/AdminSubnav";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";
import {
  Zap,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Hash,
  User,
  Send,
} from "lucide-react";

const REMARK_SUGGESTIONS = [
  "Admin Wallet Credit",
  "Admin Wallet Debit",
  "Promotional Bonus",
  "Adjustment",
  "Correction",
  "Reward Bonus",
  "Referral Bonus",
];

type SearchResult = {
  memberId: string;
  fullName: string;
  email: string;
  boosterWalletBalance: number;
  walletBalance: number;
};

type BoosterTx = {
  _id: string;
  transactionId: string;
  type: string;
  amount: number;
  walletType: string;
  adminRemarks: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
};

export default function AdminBoosterWalletPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [userTx, setUserTx] = useState<BoosterTx[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Credit/Debit form
  const [txType, setTxType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Type-ahead search
  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/members?search=${encodeURIComponent(q)}&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.members || []);
          setShowDropdown(true);
        }
      } catch {
        /* ignore */
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  // Select a user from search
  async function selectUser(u: SearchResult) {
    setSelectedUser(u);
    setSearchQuery(`${u.memberId} — ${u.fullName}`);
    setShowDropdown(false);
    loadUserTx(u.memberId);
  }

  // Load user's booster wallet transactions
  async function loadUserTx(memberId: string) {
    setTxLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        // Filter only booster wallet transactions
        const boosterTx = (data.adminTx || []).filter(
          (t: any) => t.walletType === "booster"
        );
        setUserTx(boosterTx);
        // Update user balance from fresh data
        if (data.user) {
          setSelectedUser((prev) =>
            prev
              ? {
                  ...prev,
                  boosterWalletBalance: data.user.boosterWalletBalance || 0,
                }
              : null
          );
        }
      }
    } catch {
      /* ignore */
    } finally {
      setTxLoading(false);
    }
  }

  // Submit credit/debit
  async function submitTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Select a user first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!remarks.trim()) {
      toast.error("Enter remarks/reason");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/members/${selectedUser.memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          amount: Number(amount),
          walletType: "booster",
          remarks: remarks.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        `Booster wallet ${txType}ed ₹${Number(amount).toLocaleString()} successfully`
      );
      setAmount("");
      setRemarks("");
      // Refresh
      setSelectedUser((prev) =>
        prev ? { ...prev, boosterWalletBalance: data.balanceAfter } : null
      );
      loadUserTx(selectedUser.memberId);
    } catch (err: any) {
      toast.error(err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <AdminSubnav />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">
            Booster Wallet Management
          </h1>
          <p className="text-xs text-ink-muted">
            Credit or debit booster wallet balance for any user
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Search & Credit/Debit */}
        <div className="space-y-4">
          {/* User Search */}
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Search size={16} /> Find User
            </h2>
            <div className="relative">
              <input
                className="input-field pr-10"
                placeholder="Search by Member ID, Name, or Email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                </div>
              )}

              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-base-soft border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.memberId}
                      onClick={() => selectUser(u)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center text-xs font-bold">
                          {u.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.fullName}</p>
                          <p className="text-xs text-ink-muted">
                            {u.memberId} • {u.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected User Card */}
          {selectedUser && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold">
                  {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-display font-semibold">
                    {selectedUser.fullName}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {selectedUser.memberId} • {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-xs text-ink-muted">
                  Current Booster Balance
                </p>
                <p className="font-display text-2xl font-bold text-amber-400">
                  ₹{(selectedUser.boosterWalletBalance ?? 0).toLocaleString()}
                </p>
              </div>

              {/* Credit/Debit Form */}
              <form onSubmit={submitTransaction} className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("credit")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${
                      txType === "credit"
                        ? "bg-neon-green/15 border-neon-green text-neon-green"
                        : "border-white/10 text-ink-muted hover:border-white/25"
                    }`}
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("debit")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${
                      txType === "debit"
                        ? "bg-neon-magenta/15 border-neon-magenta text-neon-magenta"
                        : "border-white/10 text-ink-muted hover:border-white/25"
                    }`}
                  >
                    − Debit
                  </button>
                </div>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input-field"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <div>
                  <input
                    className="input-field"
                    placeholder="Admin Remarks / Reason"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {REMARK_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRemarks(s)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition ${
                          remarks === s
                            ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                            : "border-white/10 text-ink-muted hover:border-white/25"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  {submitting
                    ? "Processing..."
                    : `${txType === "credit" ? "Credit" : "Debit"} Booster Wallet`}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Transaction History for selected user */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} /> Transaction History
          </h2>

          {!selectedUser ? (
            <div className="text-sm text-ink-muted py-12 text-center">
              <User size={32} className="mx-auto mb-3 opacity-40" />
              Select a user to view their booster wallet history
            </div>
          ) : txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : !userTx.length ? (
            <p className="text-sm text-ink-muted py-12 text-center">
              No booster wallet transactions for this user yet.
            </p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {userTx.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "credit"
                          ? "bg-neon-green/15 text-neon-green"
                          : "bg-neon-magenta/15 text-neon-magenta"
                      }`}
                    >
                      {t.type === "credit" ? (
                        <ArrowDownRight size={14} />
                      ) : (
                        <ArrowUpRight size={14} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.adminRemarks}</p>
                      <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Hash size={8} />
                          {t.transactionId}
                        </span>
                        <span>
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-muted">
                        ₹{t.balanceBefore.toLocaleString()} → ₹
                        {t.balanceAfter.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-semibold whitespace-nowrap ${
                      t.type === "credit"
                        ? "text-neon-green"
                        : "text-neon-magenta"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}₹
                    {t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
