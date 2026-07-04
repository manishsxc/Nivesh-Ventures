"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import toast from "react-hot-toast";

import PasswordInput from "@/components/ui/PasswordInput";

export default function TransferPage() {
  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [amount, setAmount] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  // Debounced/Effect lookup for receiver member ID
  useEffect(() => {
    const term = receiverId.trim();
    if (term.length < 5) {
      setReceiverName("");
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/lookup?memberId=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = await res.json();
          setReceiverName(data.fullName || "");
        } else {
          setReceiverName("");
        }
      } catch {
        setReceiverName("");
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [receiverId]);

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
      setReceiverId(""); setAmount(""); setAccessKey(""); setRemarks(""); setReceiverName("");
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
        <div className="relative">
          <input className="input-field" placeholder="Receiver Member ID" value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)} />
          {receiverName && (
            <p className="text-xs text-neon-green mt-1 font-medium">Receiver: {receiverName}</p>
          )}
        </div>
        <input className="input-field" type="number" placeholder="Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
        <input className="input-field" placeholder="Remarks (optional)" value={remarks}
          onChange={(e) => setRemarks(e.target.value)} />
        <PasswordInput placeholder="Access Key" value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)} />
        <button disabled={busy} className="btn-primary w-full">{busy ? "Sending..." : "Transfer Funds"}</button>
      </form>
    </DashboardShell>
  );
}
