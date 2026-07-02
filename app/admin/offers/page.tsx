"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", price: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/offers", { cache: "no-store" }).then((r) => r.json()).then((d) => setOffers(d.offers || []));
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) || 0 }),
    });
    if (res.ok) { toast.success("Offer created"); setForm({ title: "", message: "", price: "" }); load(); }
    else toast.error("Failed");
    setSaving(false);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/offers?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Offer deleted"); load(); } else toast.error("Failed");
  }

  async function updatePrice(id: string, price: number) {
    const res = await fetch("/api/admin/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, price }),
    });
    if (res.ok) { toast.success("Updated"); load(); } else toast.error("Failed");
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Offers & Pricing</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={create} className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">New Offer</h2>
          <input className="input-field" placeholder="Title (e.g. Diwali Special)" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-field" rows={3} placeholder="Message shown to members" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <input className="input-field" type="number" placeholder="Price" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Create Offer"}</button>
        </form>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4">Active Offers</h2>
          {!offers.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No offers yet.</p>
          ) : (
            <div className="space-y-3">
              {offers.map((o) => (
                <div key={o._id} className="bg-base-soft rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{o.title}</p>
                    <button onClick={() => remove(o._id)} className="text-neon-magenta"><Trash2 size={14} /></button>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{o.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      defaultValue={o.price}
                      className="input-field text-xs py-1.5 w-28"
                      onBlur={(e) => updatePrice(o._id, Number(e.target.value))}
                    />
                    <span className="text-xs text-ink-muted">price</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
