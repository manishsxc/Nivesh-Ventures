"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import Link from "next/link";
import { Search, Pin, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
    setLoading(false);
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(memberId: string, current: boolean) {
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, isActive: !current }),
    });
    if (res.ok) {
      toast.success(`Member ${!current ? "activated" : "deactivated"}`);
      load();
    } else {
      toast.error("Update failed");
    }
  }

  async function togglePin(memberId: string, currentPin: boolean) {
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, isPinned: !currentPin, action: "pin" }),
    });
    if (res.ok) {
      toast.success(!currentPin ? "Member pinned to top" : "Member unpinned");
      load();
    } else {
      toast.error("Pin toggle failed");
    }
  }

  async function shiftOrder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const currentMember = members[index];
    const targetMember = members[targetIndex];

    const currentOrder = currentMember.sortOrder || 0;
    const targetOrder = targetMember.sortOrder || 0;

    // Swap orders
    const res1 = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: currentMember.memberId, sortOrder: targetOrder || (index + 1), action: "reorder" }),
    });

    const res2 = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: targetMember.memberId, sortOrder: currentOrder || (index + 2), action: "reorder" }),
    });

    if (res1.ok && res2.ok) {
      toast.success("Position updated");
      load();
    } else {
      toast.error("Reorder failed");
    }
  }

  return (
    <DashboardShell>
      <AdminSubnav />
      <h1 className="font-display text-2xl font-bold mb-6">Member Management</h1>

      <div className="glass-card p-5">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2 mb-4">
          <input className="input-field flex-1" placeholder="Search by name, ID or email" value={q}
            onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary flex items-center gap-2"><Search size={15} /> Search</button>
        </form>

        {loading ? (
          <p className="text-sm text-ink-muted">Loading...</p>
        ) : !members.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-white/10">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.memberId} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 pr-4 flex items-center gap-1">
                      <button disabled={idx === 0} onClick={() => shiftOrder(idx, "up")} className="text-ink-muted hover:text-neon-cyan disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button disabled={idx === members.length - 1} onClick={() => shiftOrder(idx, "down")} className="text-ink-muted hover:text-neon-cyan disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/members/${m.memberId}`} className="font-medium hover:text-neon-cyan transition-colors flex items-center gap-1.5">
                        {m.fullName}
                        {m.isPinned && <Pin size={12} className="text-yellow-400 rotate-45 fill-yellow-400" />}
                      </Link>
                      <p className="text-xs text-ink-muted">{m.memberId}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">{m.email}</td>
                    <td className="py-2.5 pr-4">{m.rank}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.isActive ? "bg-neon-green/15 text-neon-green" : "bg-neon-magenta/15 text-neon-magenta"
                      }`}>{m.isActive ? "Unlocked" : "Locked"}</span>
                    </td>
                    <td className="py-2.5 flex items-center gap-2">
                      <button onClick={() => toggleActive(m.memberId, m.isActive)}
                        className="text-xs px-3 py-1 rounded-lg border border-white/15 hover:border-neon-cyan/60 transition">
                        {m.isActive ? "Lock Profile" : "Unlock Profile"}
                      </button>
                      <button onClick={() => togglePin(m.memberId, m.isPinned)}
                        className={`text-xs p-1.5 rounded-lg border transition ${m.isPinned ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" : "border-white/15 hover:border-yellow-400/60"}`}
                        title={m.isPinned ? "Unpin member" : "Pin member"}
                      >
                        <Pin size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
