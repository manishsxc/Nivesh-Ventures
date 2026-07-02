"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/AuthContext";
import toast from "react-hot-toast";
import { Unlock } from "lucide-react";
import { currencySymbol } from "@/lib/currency";

export default function UnlockAccessPage() {
  const { profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/unlock-access", { cache: "no-store" }).then((r) => r.json()).then(setStatus);
  }
  useEffect(() => { load(); }, []);

  async function renew() {
    setBusy(true);
    try {
      const res = await fetch("/api/unlock-access", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Access renewed for 365 days");
      load();
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Renewal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Buy / Renew Unlock Access</h1>

      <div className="glass-card p-8 max-w-lg text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center mx-auto mb-4">
          <Unlock size={24} className="text-base" />
        </div>
        <p className="text-sm text-ink-muted mb-1">Member</p>
        <p className="font-display text-lg font-semibold mb-4">{profile?.fullName} ({profile?.memberId})</p>

        <div className="bg-base-soft rounded-xl p-4 mb-4">
          <p className="text-xs text-ink-muted">Status</p>
          <p className={`font-semibold ${status?.isActive ? "text-neon-green" : "text-neon-magenta"}`}>
            {status?.isActive ? "Active" : "Inactive"}
          </p>
          {status?.accessExpiresAt && (
            <p className="text-xs text-ink-muted mt-1">
              Expires: {new Date(status.accessExpiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <p className="text-sm text-ink-muted mb-4">Renewal Amount: <span className="text-neon-cyan font-semibold">{currencySymbol(profile?.country)}30</span> — valid for 365 days.</p>
        <button disabled={busy} onClick={renew} className="btn-primary w-full">
          {busy ? "Processing..." : "Renew Unlock Access"}
        </button>
      </div>
    </DashboardShell>
  );
}
