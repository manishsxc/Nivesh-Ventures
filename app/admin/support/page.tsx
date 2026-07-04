"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { MessageSquare, Calendar, User, Search, RefreshCw, Send } from "lucide-react";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    pendingCount: 0,
    resolvedCount: 0,
    closedCount: 0
  });

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [statusVal, setStatusVal] = useState("answered");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMemberId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/support?status=${filterStatus}&memberId=${filterMemberId}&q=${encodeURIComponent(searchTerm)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (selectedTicket) {
          const updated = data.tickets.find((t: any) => t._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      } else {
        toast.error("Failed to load support tickets");
      }
    } catch {
      toast.error("An error occurred loading tickets");
    } finally {
      setLoading(false);
    }
  }, [filterMemberId, filterStatus, searchTerm, selectedTicket]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) return toast.error("Enter a reply message");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          message: replyMessage,
          status: statusVal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Reply sent successfully");
        setReplyMessage("");
        load();
      } else {
        toast.error(data.error || "Failed to submit reply");
      }
    } catch {
      toast.error("Error submitting reply");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseOrReopen(newStatus: "closed" | "pending" | "resolved") {
    if (!selectedTicket) return;
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        toast.success(`Ticket status updated to ${newStatus}`);
        load();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Support Tickets</h1>

      {/* Ticket Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Total Tickets</p>
          <p className="font-display text-xl font-bold mt-1 text-white">{stats.totalCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Pending Tickets</p>
          <p className="font-display text-xl font-bold mt-1 text-yellow-400">{stats.pendingCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Resolved Tickets</p>
          <p className="font-display text-xl font-bold mt-1 text-neon-green">{stats.resolvedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-ink-muted">Closed Tickets</p>
          <p className="font-display text-xl font-bold mt-1 text-ink-muted">{stats.closedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ticket List / Inbox Pane */}
        <div className="lg:col-span-1 glass-card p-4 flex flex-col h-[600px]">
          <h2 className="font-display font-semibold mb-3">Inbox</h2>
          
          {/* Filters inside Inbox */}
          <div className="space-y-2 mb-4">
            <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-1.5">
              <input 
                className="input-field text-xs flex-1 py-1"
                placeholder="Search subject/user" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-primary p-1 flex items-center justify-center shrink-0">
                <Search size={14} />
              </button>
            </form>
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field text-[11px] py-1 flex-1"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="answered">Answered</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button 
                onClick={load} 
                className="btn-primary p-1 text-xs shrink-0 flex items-center justify-center"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading && !tickets.length ? (
              <p className="text-xs text-ink-muted">Loading inbox...</p>
            ) : !tickets.length ? (
              <p className="text-xs text-ink-muted text-center py-6">No support tickets found.</p>
            ) : (
              tickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedTicket?._id === t._id
                      ? "border-neon-magenta bg-neon-magenta/5"
                      : "border-white/5 bg-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className="font-semibold text-xs truncate max-w-[140px] text-white">{t.subject}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      t.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                      t.status === "answered" ? "bg-neon-green/10 text-neon-green" :
                      t.status === "closed" ? "bg-white/10 text-ink-muted" : "bg-neon-cyan/10 text-neon-cyan"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 truncate">{t.message}</p>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-ink-muted">
                    <span className="flex items-center gap-1 font-semibold"><User size={10} /> {t.memberId}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat / Reply interface */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              {/* Ticket header */}
              <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-base text-white">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-ink-muted font-mono mt-1">Ticket ID: {selectedTicket._id} | User: {selectedTicket.memberId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    selectedTicket.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                    selectedTicket.status === "answered" ? "bg-neon-green/10 text-neon-green" :
                    selectedTicket.status === "closed" ? "bg-white/10 text-ink-muted" : "bg-neon-cyan/10 text-neon-cyan"
                  }`}>
                    {selectedTicket.status}
                  </span>
                  
                  {selectedTicket.status !== "closed" ? (
                    <button 
                      onClick={() => handleCloseOrReopen("closed")}
                      className="text-[10px] px-2 py-0.5 rounded border border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20 transition"
                    >
                      Close Ticket
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCloseOrReopen("pending")}
                      className="text-[10px] px-2 py-0.5 rounded border border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
                {/* Original inquiry */}
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center shrink-0 text-xs font-semibold text-neon-cyan">
                    U
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs font-semibold mb-1 text-neon-cyan">User Inquiry</p>
                    <p className="text-sm text-white">{selectedTicket.message}</p>
                    <p className="text-[10px] text-ink-muted mt-1.5">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies?.map((rep: any, idx: number) => {
                  const isAdmin = rep.from === "admin";
                  return (
                    <div
                      key={rep._id || idx}
                      className={`flex gap-3 max-w-[85%] relative group ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isAdmin ? "bg-neon-magenta/20 text-neon-magenta" : "bg-neon-cyan/20 text-neon-cyan"
                      }`}>
                        {isAdmin ? "A" : "U"}
                      </div>
                      <div className={`p-3 rounded-xl border relative ${
                        isAdmin ? "bg-neon-magenta/5 border-neon-magenta/15" : "bg-white/5 border-white/5"
                      }`}>
                        <p className={`text-xs font-semibold mb-1 ${isAdmin ? "text-neon-magenta" : "text-neon-cyan"}`}>
                          {isAdmin ? "Admin Agent (You)" : "User"}
                        </p>
                        <p className="text-sm text-white">{rep.message}</p>
                        <div className="flex items-center justify-between mt-1.5 gap-4">
                          <p className="text-[10px] text-ink-muted">{new Date(rep.createdAt).toLocaleString()}</p>
                          <button 
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this message?")) return;
                              try {
                                const res = await fetch("/api/admin/support", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ ticketId: selectedTicket._id, action: "delete_reply", replyId: rep._id }),
                                });
                                if (res.ok) {
                                  toast.success("Message deleted");
                                  load();
                                } else {
                                  toast.error("Failed to delete message");
                                }
                              } catch {
                                toast.error("Error connecting to server");
                              }
                            }}
                            className="text-[10px] text-neon-magenta hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Input */}
              {selectedTicket.status !== "closed" ? (
                <form onSubmit={sendReply} className="mt-auto border-t border-white/10 pt-4 space-y-3">
                  <div className="flex gap-3 items-center">
                    <label className="text-xs text-ink-muted">Set Status After Replying:</label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="input-field py-1 text-xs px-2 w-36"
                    >
                      <option value="answered">Answered</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 text-sm"
                      placeholder="Type reply message..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      required
                    />
                    <button disabled={submitting} className="btn-primary px-5 py-2.5 text-sm shrink-0 flex items-center gap-1">
                      <Send size={13} /> Reply
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-ink-muted">
                  Ticket has been closed. Reopen the ticket to send a reply.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-ink-muted">
              <MessageSquare size={36} className="mb-2" />
              <p className="text-xs">Select a ticket from the left panel to reply.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
