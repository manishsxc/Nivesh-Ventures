"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";
import { MessageSquare, Send, PlusCircle, Clock } from "lucide-react";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New ticket state
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [category, setCategory] = useState("Technical");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Reply message
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (selectedTicket) {
          const updated = data.tickets.find((t: any) => t._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [selectedTicket]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      if (res.ok) {
        toast.success("Support ticket created successfully");
        setCreatingTicket(false);
        setSubject("");
        setMessage("");
        loadTickets();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create ticket");
      }
    } catch {
      toast.error("Error creating ticket");
    } finally {
      setSubmittingTicket(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          message: replyMessage
        }),
      });

      if (res.ok) {
        toast.success("Reply sent");
        setReplyMessage("");
        loadTickets();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send reply");
      }
    } catch {
      toast.error("Error sending reply");
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold">Support Center</h1>
        <button 
          onClick={() => setCreatingTicket(true)}
          className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3"
        >
          <PlusCircle size={15} /> Raise Support Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ticket List Inbox */}
        <div className="lg:col-span-1 glass-card p-4 space-y-3 h-[600px] overflow-y-auto">
          <h2 className="font-display font-semibold mb-2 flex items-center gap-2">
            <Clock size={16} /> Ticket History
          </h2>
          {loading && !tickets.length ? (
            <p className="text-xs text-ink-muted">Loading tickets...</p>
          ) : !tickets.length ? (
            <p className="text-xs text-ink-muted text-center py-6">No support tickets found.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedTicket?._id === t._id
                    ? "border-neon-cyan bg-neon-cyan/5"
                    : "border-white/5 bg-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <p className="font-semibold text-xs truncate max-w-[150px]">{t.subject}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    t.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                    t.status === "answered" ? "bg-neon-green/10 text-neon-green" :
                    t.status === "closed" ? "bg-white/10 text-ink-muted" : "bg-neon-cyan/10 text-neon-cyan"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1 truncate">{t.message}</p>
                <p className="text-[9px] text-ink-muted mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

        {/* Conversation Hub */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              {/* Ticket header */}
              <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-base text-white">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-ink-muted font-mono mt-1">Ticket ID: {selectedTicket._id}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  selectedTicket.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                  selectedTicket.status === "answered" ? "bg-neon-green/10 text-neon-green" :
                  selectedTicket.status === "closed" ? "bg-white/10 text-ink-muted" : "bg-neon-cyan/10 text-neon-cyan"
                }`}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
                {/* Original Message */}
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center shrink-0 text-xs font-semibold text-neon-cyan">
                    U
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-semibold text-neon-cyan mb-1">Original Inquiry</p>
                    <p className="text-sm text-white">{selectedTicket.message}</p>
                    <p className="text-[9px] text-ink-muted mt-1.5">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
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
                        <p className={`text-[10px] font-semibold mb-1 ${isAdmin ? "text-neon-magenta" : "text-neon-cyan"}`}>
                          {isAdmin ? "Support Agent" : "You"}
                        </p>
                        <p className="text-sm text-white">{rep.message}</p>
                        <div className="flex items-center justify-between mt-1.5 gap-4">
                          <p className="text-[9px] text-ink-muted">{new Date(rep.createdAt).toLocaleString()}</p>
                          <button 
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this reply?")) return;
                              try {
                                const res = await fetch("/api/support", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ ticketId: selectedTicket._id, action: "delete_reply", replyId: rep._id }),
                                });
                                if (res.ok) {
                                  toast.success("Reply deleted");
                                  loadTickets();
                                } else {
                                  toast.error("Failed to delete reply");
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

              {/* Input Form */}
              {selectedTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="mt-auto border-t border-white/10 pt-4 flex gap-2">
                  <input
                    className="input-field flex-1 text-sm"
                    placeholder="Type your response here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  />
                  <button 
                    type="submit"
                    disabled={submittingReply}
                    className="btn-primary px-5 py-2.5 text-sm shrink-0 flex items-center gap-1.5"
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              ) : (
                <div className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-ink-muted font-medium">
                  This ticket has been marked as closed.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-ink-muted">
              <MessageSquare size={36} className="mb-2" />
              <p className="text-xs">Select a ticket from the left panel to read/reply.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Ticket Modal */}
      {creatingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Raise a Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="Technical">Technical Support</option>
                  <option value="Billing">Billing & Wallet</option>
                  <option value="KYC">KYC Verification</option>
                  <option value="Inquiry">General Inquiry</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g. Withdrawal error code 400"
                  className="input-field w-full text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">Message Description</label>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Describe your issue details here..."
                  className="input-field w-full text-sm min-h-[100px]"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submittingTicket} className="btn-primary flex-1 text-sm py-2">
                  {submittingTicket ? "Submitting..." : "Submit Ticket"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setCreatingTicket(false)}
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
