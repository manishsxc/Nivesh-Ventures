"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";

export default function AdminCommissionPage() {
  const [c, setC] = useState<any>({ level1: 5, level2: 3, level3: 2, level4: 1, level5: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/commission", { cache: "no-store" }).then((r) => r.json()).then((d) => d.commission && setC(d.commission));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (res.ok) toast.success("Commission updated"); else toast.error("Failed");
    setSaving(false);
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">5-Level Commission Management</h1>
      <div className="glass-card p-6 max-w-lg space-y-3">
        {["level1", "level2", "level3", "level4", "level5"].map((k, i) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <label className="text-sm text-ink-muted">Level {i + 1} (%)</label>
            <input
              type="number"
              className="input-field w-28"
              value={c[k]}
              onChange={(e) => setC({ ...c, [k]: Number(e.target.value) })}
            />
          </div>
        ))}
        <button disabled={saving} onClick={save} className="btn-primary w-full mt-2">
          {saving ? "Saving..." : "Save Commission Structure"}
        </button>
      </div>
    </DashboardShell>
  );
}
