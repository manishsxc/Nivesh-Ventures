"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import toast from "react-hot-toast";
import { Mail, Phone } from "lucide-react";

export default function SupportPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, name: profile.fullName, email: profile.email }));
    fetch("/api/support", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setTickets(d.tickets || []));
  }, [profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Fill name, email and message");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.web3FormsOk) {
        toast.success("Support ticket sent");
      } else if (data.supportEmail) {
        window.location.href = `mailto:${data.supportEmail}?subject=${encodeURIComponent(form.subject || "Support Request")}&body=${encodeURIComponent(form.message)}`;
      }
      setForm((f) => ({ ...f, subject: "", message: "" }));
    } catch (err: any) {
      toast.error(err.message || "Could not submit");
    } finally {
      setSending(false);
    }
  }

  function whatsapp() {
    const no = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NO;
    if (!no) { toast.error("WhatsApp support not configured"); return; }
    window.open(`https://wa.me/${no}?text=${encodeURIComponent(form.message || "Hi, I need help.")}`, "_blank");
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Support</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">Raise a Ticket</h2>
          <input className="input-field" placeholder="Your name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Phone number" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input-field" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Subject" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="input-field" rows={4} placeholder="Describe your issue" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="flex gap-3">
            <button disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Mail size={15} /> {sending ? "Sending..." : "Email Support"}
            </button>
            <button type="button" onClick={whatsapp} className="btn-ghost flex-1 flex items-center justify-center gap-2">
              <Phone size={15} /> WhatsApp
            </button>
          </div>
        </form>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4">Your Tickets</h2>
          {!tickets.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No tickets raised yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t._id} className="bg-base-soft rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{t.subject}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-violet/15 text-neon-cyan capitalize">{t.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{t.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
