"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import FileUploadField from "@/components/FileUploadField";
import toast from "react-hot-toast";

const statusColor: Record<string, string> = {
  not_submitted: "bg-white/5 text-ink-muted",
  pending: "bg-yellow-500/15 text-yellow-400",
  under_review: "bg-neon-cyan/15 text-neon-cyan",
  approved: "bg-neon-green/15 text-neon-green",
  rejected: "bg-neon-magenta/15 text-neon-magenta",
};

export default function KycPage() {
  const [status, setStatus] = useState("not_submitted");
  const [form, setForm] = useState({ aadhaarUrl: "", panUrl: "", bankProofUrl: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/kyc", { cache: "no-store" }).then((r) => r.json()).then((d) => setStatus(d.kycStatus || "not_submitted"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.aadhaarUrl || !form.panUrl || !form.bankProofUrl) { toast.error("All 3 document links required"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("KYC submitted for review");
      setStatus(data.kycStatus);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">KYC Verification</h1>

      <div className="glass-card p-6 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-muted">Status</p>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor[status]}`}>{status.replace(/_/g, " ")}</span>
        </div>

        {status === "approved" ? (
          <p className="text-sm text-neon-green">Your KYC is verified.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-ink-muted mb-1">Upload clear photos or scans of each document.</p>
            <FileUploadField label="Aadhaar Card" value={form.aadhaarUrl} onChange={(v) => setForm({ ...form, aadhaarUrl: v })} />
            <FileUploadField label="PAN Card" value={form.panUrl} onChange={(v) => setForm({ ...form, panUrl: v })} />
            <FileUploadField label="Bank Account Proof" value={form.bankProofUrl} onChange={(v) => setForm({ ...form, bankProofUrl: v })} />
            <button disabled={busy} className="btn-primary w-full">{busy ? "Submitting..." : "Submit for Review"}</button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
