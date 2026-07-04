"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import {
  Megaphone,
  Send,
  Trash2,
  RefreshCw,
  BarChart3,
  BellOff,
  Globe,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";

interface Broadcast {
  _id: string;
  title: string;
  message: string;
  audience: string;
  sentAt?: string;
  createdAt: string;
}

interface Stats {
  totalNotifications: number;
  unreadNotifications: number;
  totalBroadcasts: number;
}

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users", icon: Globe, color: "text-neon-cyan" },
  { value: "active", label: "Active Users Only", icon: UserCheck, color: "text-neon-green" },
  { value: "inactive", label: "Inactive Users Only", icon: UserX, color: "text-neon-magenta" },
  { value: "premium", label: "Premium Members Only", icon: Crown, color: "text-yellow-400" },
];

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

export default function AdminNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState<Stats>({ totalNotifications: 0, unreadNotifications: 0, totalBroadcasts: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Compose form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?page=${p}&limit=20`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts || []);
        setStats(data.stats || {});
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

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (message.length > 1000) {
      toast.error("Message must be under 1000 characters");
      return;
    }

    if (!confirm(`Send this broadcast to "${audience.toUpperCase()}" users? This cannot be undone.`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Broadcast sent to ${data.sentTo} users!`);
        setTitle("");
        setMessage("");
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send broadcast");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(broadcastId: string) {
    if (!confirm("Delete this broadcast record?")) return;
    try {
      const res = await fetch(`/api/admin/notifications?id=${broadcastId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Broadcast deleted");
        setBroadcasts((prev) => prev.filter((b) => b._id !== broadcastId));
        setStats((s) => ({ ...s, totalBroadcasts: s.totalBroadcasts - 1 }));
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const audienceConfig = AUDIENCE_OPTIONS.find((o) => o.value === audience) || AUDIENCE_OPTIONS[0];

  return (
    <DashboardShell>
      <AdminSubnav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet to-neon-magenta flex items-center justify-center">
            <Megaphone size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Notification Management</h1>
            <p className="text-xs text-ink-muted">Broadcast system-wide notifications to all or specific user groups</p>
          </div>
        </div>
        <button
          onClick={() => load(page)}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/10 text-ink-muted hover:bg-white/5 transition"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Notifications Sent</p>
          <p className="font-display text-2xl font-bold mt-1 text-neon-cyan">{stats.totalNotifications.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Unread (All Users)</p>
          <p className="font-display text-2xl font-bold mt-1 text-neon-magenta">{stats.unreadNotifications.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Broadcasts Sent</p>
          <p className="font-display text-2xl font-bold mt-1 text-yellow-400">{stats.totalBroadcasts.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Broadcast Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
              <Send size={16} className="text-neon-cyan" />
              Compose Broadcast
            </h2>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1.5 font-medium">Notification Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Maintenance Notice"
                  className="input-field w-full text-sm"
                  maxLength={100}
                  required
                />
                <p className="text-[10px] text-ink-muted/60 mt-1 text-right">{title.length}/100</p>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1.5 font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your broadcast message here... (max 1000 characters)"
                  className="input-field w-full text-sm min-h-[120px] resize-y"
                  maxLength={1000}
                  required
                />
                <p className={`text-[10px] mt-1 text-right ${message.length > 900 ? "text-neon-magenta" : "text-ink-muted/60"}`}>
                  {message.length}/1000
                </p>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1.5 font-medium">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAudience(opt.value)}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition text-left ${
                          audience === opt.value
                            ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                            : "border-white/10 text-ink-muted hover:bg-white/5"
                        }`}
                      >
                        <Icon size={13} className={audience === opt.value ? "text-neon-cyan" : opt.color} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${audienceConfig.color} border-current bg-current/5`}>
                <audienceConfig.icon size={13} />
                <span>Sending to: <strong>{audienceConfig.label}</strong></span>
              </div>

              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={15} />
                {sending ? "Sending Broadcast..." : "Send Broadcast Now"}
              </button>
            </form>
          </div>
        </div>

        {/* Broadcast History */}
        <div className="lg:col-span-3">
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-display font-semibold text-base flex items-center gap-2">
                <BarChart3 size={16} className="text-neon-violet" />
                Broadcast History
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">{stats.totalBroadcasts} total broadcasts sent</p>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/5 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                  <BellOff size={24} className="text-ink-muted" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-ink-muted">No broadcasts yet</p>
                  <p className="text-xs text-ink-muted/60 mt-1">Sent broadcasts will appear here</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {broadcasts.map((b) => {
                  const audienceOpt = AUDIENCE_OPTIONS.find((o) => o.value === b.audience);
                  const AudienceIcon = audienceOpt?.icon || Globe;
                  return (
                    <div
                      key={b._id}
                      className="p-4 hover:bg-white/3 transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neon-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone size={16} className="text-neon-violet" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white leading-tight">{b.title}</p>
                            <button
                              onClick={() => handleDelete(b._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-neon-magenta hover:bg-neon-magenta/10 transition shrink-0"
                              title="Delete broadcast"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{b.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase ${audienceOpt?.color || "text-ink-muted"}`}>
                              <AudienceIcon size={10} />
                              {audienceOpt?.label || b.audience}
                            </span>
                            <span className="text-[10px] text-ink-muted/50">{timeAgo(b.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t border-white/5">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <span className="text-xs text-ink-muted">
                  {page} / {pages}
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
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
