"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";

export default function AdminKycPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/kyc?status=under_review", { cache: "no-store" });
    if (res.ok) setMembers((await res.json()).members || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(memberId: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, decision }),
    });
    if (res.ok) { toast.success(`KYC ${decision}`); load(); } else toast.error("Failed");
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">KYC Review</h1>
      <div className="glass-card p-5">
        {loading ? <p className="text-sm text-ink-muted">Loading...</p> : !members.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No KYC submissions under review.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.memberId} className="bg-base-soft rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{m.fullName} <span className="text-xs text-ink-muted">({m.memberId})</span></p>
                  <div className="flex gap-2 mt-2">
                    {m.kycDocs?.aadhaarUrl && (
                      <a href={m.kycDocs.aadhaarUrl} target="_blank">
                        <img src={m.kycDocs.aadhaarUrl} alt="Aadhaar" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                      </a>
                    )}
                    {m.kycDocs?.panUrl && (
                      <a href={m.kycDocs.panUrl} target="_blank">
                        <img src={m.kycDocs.panUrl} alt="PAN" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                      </a>
                    )}
                    {m.kycDocs?.bankProofUrl && (
                      <a href={m.kycDocs.bankProofUrl} target="_blank">
                        <img src={m.kycDocs.bankProofUrl} alt="Bank Proof" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(m.memberId, "approved")} className="text-xs px-3 py-1.5 rounded-lg bg-neon-green/15 text-neon-green">Approve</button>
                  <button onClick={() => decide(m.memberId, "rejected")} className="text-xs px-3 py-1.5 rounded-lg bg-neon-magenta/15 text-neon-magenta">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
