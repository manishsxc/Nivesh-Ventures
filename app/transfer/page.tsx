"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";

export default function TransferPage() {
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/p2p-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, amount: Number(amount), accessKey, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Sent to ${data.receiverName}`);
      setReceiverId(""); setAmount(""); setAccessKey(""); setRemarks("");
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">P2P Transfer</h1>
      <form onSubmit={submit} className="glass-card p-6 max-w-md space-y-3">
        <input className="input-field" placeholder="Receiver Member ID" value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)} />
        <input className="input-field" type="number" placeholder="Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
        <input className="input-field" placeholder="Remarks (optional)" value={remarks}
          onChange={(e) => setRemarks(e.target.value)} />
        <input className="input-field" type="password" placeholder="Access Key" value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)} />
        <button disabled={busy} className="btn-primary w-full">{busy ? "Sending..." : "Transfer Funds"}</button>
      </form>
    </DashboardShell>
  );
}
