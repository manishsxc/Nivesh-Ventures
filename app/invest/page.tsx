"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import { currencySymbol } from "@/lib/currency";
import toast from "react-hot-toast";

export default function InvestPage() {
  const { profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);

  function load() {
    fetch("/api/nivesh", { cache: "no-store" }).then((r) => r.json()).then((d) => setInvestments(d.investments || []));
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/nivesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Investment submitted");
      setAmount("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Investment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Nivesh (Investment)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">Do Investment</h2>
          <p className="text-xs text-ink-muted mb-2">Minimum {currencySymbol(profile?.country)}100. No maximum. Deducted from wallet balance.</p>
          <input className="input-field" type="number" placeholder="Investment amount" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
          <button disabled={busy} className="btn-primary w-full">{busy ? "Submitting..." : "Invest Now"}</button>
        </form>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4">Investment Report</h2>
          {!investments.length ? (
            <p className="text-sm text-ink-muted py-8 text-center">No investments yet.</p>
          ) : (
            <div className="space-y-2">
              {investments.map((inv) => (
                <div key={inv._id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="font-medium">{currencySymbol(profile?.country)}{inv.amount.toLocaleString()}</p>
                    <p className="text-xs text-ink-muted">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full h-fit capitalize ${
                    inv.status === "active" ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
                  }`}>{inv.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
