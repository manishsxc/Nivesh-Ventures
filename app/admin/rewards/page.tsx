"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";

export default function AdminRewardsPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", leftRequirement: "", rightRequirement: "", rewardAmount: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/rewards", { cache: "no-store" }).then((r) => r.json()).then((d) => setTiers(d.tiers || []));
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.leftRequirement || !form.rightRequirement || !form.rewardAmount) {
      toast.error("Fill all fields"); return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        leftRequirement: Number(form.leftRequirement),
        rightRequirement: Number(form.rightRequirement),
        rewardAmount: Number(form.rewardAmount),
      }),
    });
    if (res.ok) { toast.success("Reward tier created"); setForm({ code: "", leftRequirement: "", rightRequirement: "", rewardAmount: "" }); load(); }
    else toast.error("Failed");
    setSaving(false);
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Reward Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={create} className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">Create Reward Tier</h2>
          <input className="input-field" placeholder="Code (e.g. X6)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="input-field" type="number" placeholder="Left requirement" value={form.leftRequirement} onChange={(e) => setForm({ ...form, leftRequirement: e.target.value })} />
          <input className="input-field" type="number" placeholder="Right requirement" value={form.rightRequirement} onChange={(e) => setForm({ ...form, rightRequirement: e.target.value })} />
          <input className="input-field" type="number" placeholder="Reward amount ($)" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} />
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Create Tier"}</button>
        </form>
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4">Existing Tiers</h2>
          {!tiers.length ? <p className="text-sm text-ink-muted py-8 text-center">No custom tiers yet — default X1–X5 apply.</p> : (
            <div className="space-y-2">
              {tiers.map((t) => (
                <div key={t._id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                  <span>{t.code} — {t.leftRequirement}L / {t.rightRequirement}R</span>
                  <span className="text-neon-cyan">${t.rewardAmount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
