"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", audience: "all", targetMemberId: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/notices", { cache: "no-store" }).then((r) => r.json()).then((d) => setNotices(d.notices || []));
  }
  useEffect(() => { load(); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.message) { toast.error("Fill title and message"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Notice sent"); setForm({ title: "", message: "", audience: "all", targetMemberId: "" }); load(); }
    else toast.error("Failed");
    setSaving(false);
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">News & Notifications</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={send} className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">Send Notice</h2>
          <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-field" rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="flex gap-3">
            <label className="flex-1 flex items-center gap-2 input-field cursor-pointer">
              <input type="radio" checked={form.audience === "all"} onChange={() => setForm({ ...form, audience: "all" })} /> All Members
            </label>
            <label className="flex-1 flex items-center gap-2 input-field cursor-pointer">
              <input type="radio" checked={form.audience === "specific"} onChange={() => setForm({ ...form, audience: "specific" })} /> Specific
            </label>
          </div>
          {form.audience === "specific" && (
            <input className="input-field" placeholder="Member ID" value={form.targetMemberId} onChange={(e) => setForm({ ...form, targetMemberId: e.target.value })} />
          )}
          <button disabled={saving} className="btn-primary w-full">{saving ? "Sending..." : "Send Notice"}</button>
        </form>
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4">Sent Notices</h2>
          {!notices.length ? <p className="text-sm text-ink-muted py-8 text-center">No notices sent yet.</p> : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n._id} className="bg-base-soft rounded-xl p-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-ink-muted mt-1">{n.message}</p>
                  <p className="text-xs text-neon-cyan mt-1">{n.audience === "all" ? "All members" : `To ${n.targetMemberId}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
