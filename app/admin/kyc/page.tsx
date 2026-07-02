"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { X } from "lucide-react";

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
                      <div className="relative group shrink-0">
                        <a href={m.kycDocs.aadhaarUrl} target="_blank">
                          <img src={m.kycDocs.aadhaarUrl} alt="Aadhaar" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete Aadhaar Card image?")) {
                              const res = await fetch(`/api/admin/kyc?memberId=${m.memberId}&docType=aadhaarUrl`, { method: "DELETE" });
                              if (res.ok) {
                                toast.success("Aadhaar deleted");
                                load();
                              } else {
                                toast.error("Failed to delete Aadhaar");
                              }
                            }
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-neon-magenta text-white rounded-full p-1 shadow hover:bg-red-600 transition flex items-center justify-center"
                          title="Delete Aadhaar image"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    )}
                    {m.kycDocs?.panUrl && (
                      <div className="relative group shrink-0">
                        <a href={m.kycDocs.panUrl} target="_blank">
                          <img src={m.kycDocs.panUrl} alt="PAN" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete PAN Card image?")) {
                              const res = await fetch(`/api/admin/kyc?memberId=${m.memberId}&docType=panUrl`, { method: "DELETE" });
                              if (res.ok) {
                                toast.success("PAN deleted");
                                load();
                              } else {
                                toast.error("Failed to delete PAN");
                              }
                            }
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-neon-magenta text-white rounded-full p-1 shadow hover:bg-red-600 transition flex items-center justify-center"
                          title="Delete PAN image"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    )}
                    {m.kycDocs?.bankProofUrl && (
                      <div className="relative group shrink-0">
                        <a href={m.kycDocs.bankProofUrl} target="_blank">
                          <img src={m.kycDocs.bankProofUrl} alt="Bank Proof" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete Bank Proof image?")) {
                              const res = await fetch(`/api/admin/kyc?memberId=${m.memberId}&docType=bankProofUrl`, { method: "DELETE" });
                              if (res.ok) {
                                toast.success("Bank Proof deleted");
                                load();
                              } else {
                                toast.error("Failed to delete Bank Proof");
                              }
                            }
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-neon-magenta text-white rounded-full p-1 shadow hover:bg-red-600 transition flex items-center justify-center"
                          title="Delete Bank Proof image"
                        >
                          <X size={8} />
                        </button>
                      </div>
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
