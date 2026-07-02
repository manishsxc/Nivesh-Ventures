"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/deposits?status=pending", { cache: "no-store" });
    if (res.ok) setDeposits((await res.json()).deposits || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(depositId: string, action: "verify" | "reject", amount?: number) {
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, action, amount }),
    });
    if (res.ok) { toast.success(`Deposit ${action}ed`); load(); } else toast.error("Failed");
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Deposit Verification</h1>
      <div className="glass-card p-5">
        {loading ? <p className="text-sm text-ink-muted">Loading...</p> : !deposits.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No pending deposits.</p>
        ) : (
          <div className="space-y-3">
            {deposits.map((d) => (
              <div key={d._id} className="bg-base-soft rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {d.paymentSlipUrl && (
                    <div className="relative group shrink-0">
                      <a href={d.paymentSlipUrl} target="_blank">
                        <img src={d.paymentSlipUrl} alt="Payment proof" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this screenshot from the database?")) {
                            const res = await fetch(`/api/admin/deposits?depositId=${d._id}`, { method: "DELETE" });
                            if (res.ok) {
                              toast.success("Screenshot deleted from database");
                              load();
                            } else {
                              toast.error("Failed to delete screenshot");
                            }
                          }
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-neon-magenta text-white rounded-full p-1 shadow hover:bg-red-600 transition flex items-center justify-center"
                        title="Delete screenshot from database"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{d.memberId}</p>
                    <p className="text-xs text-ink-muted">Txn: {d.txnHash}</p>
                    {d.paymentSlipUrl && (
                      <div className="flex gap-2 items-center mt-1">
                        <a href={d.paymentSlipUrl} target="_blank" className="text-xs text-neon-cyan">View full screenshot</a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Amount to credit"
                    className="input-field text-xs py-1.5 w-36"
                    id={`amt-${d._id}`}
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`amt-${d._id}`) as HTMLInputElement;
                      act(d._id, "verify", Number(el.value) || undefined);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-neon-green/15 text-neon-green"
                  >Verify</button>
                  <button onClick={() => act(d._id, "reject")} className="text-xs px-3 py-1.5 rounded-lg bg-neon-magenta/15 text-neon-magenta">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
