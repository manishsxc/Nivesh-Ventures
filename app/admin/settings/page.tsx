"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import FileUploadField from "@/components/FileUploadField";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [s, setS] = useState<any>({ bankDetails: {}, pricing: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then((r) => r.json()).then((d) =>
      setS({ bankDetails: {}, pricing: {}, ...d.settings })
    );
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) toast.success("Settings saved"); else toast.error("Failed");
    setSaving(false);
  }

  const generalFields = [
    { key: "websiteName", label: "Website Name" },
    { key: "logoUrl", label: "Logo URL" },
    { key: "contactEmail", label: "Contact Email" },
    { key: "contactPhone", label: "Contact Phone" },
    { key: "paymentUsdtAddress", label: "Payment USDT Address (BEP-20)" },
    { key: "shareRewardAmount", label: "Referral Share Reward (per successful share)" },
    { key: "termsUrl", label: "Terms & Conditions URL" },
    { key: "privacyUrl", label: "Privacy Policy URL" },
  ];

  const bankFields = [
    { key: "bankName", label: "Bank Name" },
    { key: "accountNumber", label: "Account Number" },
    { key: "ifsc", label: "IFSC Code" },
    { key: "accountHolder", label: "Account Holder Name" },
  ];

  const pricingFields = [
    { key: "unlockAccessPrice", label: "Unlock Access Price" },
    { key: "minInvestment", label: "Minimum Investment" },
    { key: "minWithdrawal", label: "Minimum Withdrawal" },
  ];

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Website Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-3">
          <h2 className="font-display font-semibold mb-1">General</h2>
          {generalFields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-ink-muted block mb-1">{f.label}</label>
              <input className="input-field" value={s[f.key] || ""} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-3">Payment QR Code</h2>
            <FileUploadField
              label="QR Code (users scan to pay)"
              value={s.paymentQrUrl || ""}
              onChange={(v) => setS({ ...s, paymentQrUrl: v })}
              showWarning={false}
            />
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display font-semibold mb-1">Bank Account Details</h2>
            {bankFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-ink-muted block mb-1">{f.label}</label>
                <input
                  className="input-field"
                  value={s.bankDetails?.[f.key] || ""}
                  onChange={(e) => setS({ ...s, bankDetails: { ...s.bankDetails, [f.key]: e.target.value } })}
                />
              </div>
            ))}
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display font-semibold mb-1">Pricing</h2>
            {pricingFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-ink-muted block mb-1">{f.label}</label>
                <input
                  type="number"
                  className="input-field"
                  value={s.pricing?.[f.key] ?? ""}
                  onChange={(e) => setS({ ...s, pricing: { ...s.pricing, [f.key]: Number(e.target.value) } })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button disabled={saving} onClick={save} className="btn-primary w-full max-w-md mt-6">
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </DashboardShell>
  );
}
