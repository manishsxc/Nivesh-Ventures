"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  TrendingUp,
  Wallet,
  Users,
  LifeBuoy,
  Shield,
  Gift,
  LogIn,
  UserPlus,
  Download,
  ArrowUpRight,
  Megaphone,
} from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  description: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  registration: { icon: UserPlus, color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
  login: { icon: LogIn, color: "text-blue-400", bg: "bg-blue-400/10" },
  referral_joined: { icon: Users, color: "text-neon-violet", bg: "bg-neon-violet/10" },
  referral_reward: { icon: Gift, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  deposit_submitted: { icon: Download, color: "text-blue-300", bg: "bg-blue-300/10" },
  deposit_approved: { icon: Wallet, color: "text-neon-green", bg: "bg-neon-green/10" },
  deposit_rejected: { icon: AlertCircle, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
  withdrawal_requested: { icon: ArrowUpRight, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  withdrawal_approved: { icon: TrendingUp, color: "text-neon-green", bg: "bg-neon-green/10" },
  withdrawal_rejected: { icon: AlertCircle, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
  wallet_credit: { icon: Wallet, color: "text-neon-green", bg: "bg-neon-green/10" },
  wallet_debit: { icon: Wallet, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
  support_ticket: { icon: LifeBuoy, color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
  support_ticket_created: { icon: LifeBuoy, color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
  support_reply: { icon: LifeBuoy, color: "text-neon-violet", bg: "bg-neon-violet/10" },
  support_status: { icon: LifeBuoy, color: "text-blue-400", bg: "bg-blue-400/10" },
  admin_broadcast: { icon: Megaphone, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
  kyc_verified: { icon: Shield, color: "text-neon-green", bg: "bg-neon-green/10" },
  kyc_rejected: { icon: Shield, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || { icon: Bell, color: "text-ink-muted", bg: "bg-white/10" };
}

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
      toast.success("All notifications marked as read");
    }
  }

  async function deleteNotification(id: string) {
    const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => t - 1);
    }
  }

  async function clearAll() {
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    const res = await fetch("/api/notifications?all=true", { method: "DELETE" });
    if (res.ok) {
      setNotifications([]);
      setUnread(0);
      setTotal(0);
      toast.success("All notifications cleared");
    }
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center">
            <Bell size={18} className="text-base" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Notifications</h1>
            <p className="text-xs text-ink-muted">
              {unread > 0 ? (
                <span className="text-neon-cyan font-semibold">{unread} unread</span>
              ) : (
                "All caught up!"
              )}{" "}
              · {total} total
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={() => load(page)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/10 text-ink-muted hover:bg-white/5 transition"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {total > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-neon-magenta/30 text-neon-magenta hover:bg-neon-magenta/10 transition"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <BellOff size={28} className="text-ink-muted" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-ink-muted">No notifications yet</p>
              <p className="text-xs text-ink-muted/60 mt-1">
                Activity updates will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => {
              const config = getTypeConfig(notif.type);
              const Icon = config.icon;
              return (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markRead(notif._id)}
                  className={`flex gap-3 p-4 transition-all duration-200 cursor-pointer group hover:bg-white/3 ${
                    !notif.read ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}
                    >
                      <Icon size={18} className={config.color} />
                    </div>
                    {!notif.read && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-cyan rounded-full border-2 border-base animate-pulse" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-tight ${notif.read ? "text-ink-muted" : "text-ink"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                            title="Mark as read"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-neon-cyan hover:bg-neon-cyan/10 transition"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                          title="Delete"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-neon-magenta hover:bg-neon-magenta/10 transition"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-2">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-ink-muted/50 mt-1.5">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 transition"
          >
            Previous
          </button>
          <span className="text-xs text-ink-muted">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
