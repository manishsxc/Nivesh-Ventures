"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import AdminSubnav from "@/components/AdminSubnav";
import toast from "react-hot-toast";
import { Search } from "lucide-react";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.memberId} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{m.fullName}</p>
                      <p className="text-xs text-ink-muted">{m.memberId}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">{m.email}</td>
                    <td className="py-2.5 pr-4">{m.rank}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.isActive ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
                      }`}>{m.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => toggleActive(m.memberId, m.isActive)}
                        className="text-xs px-3 py-1 rounded-lg border border-white/15 hover:border-neon-cyan/60 transition">
                        {m.isActive ? "Deactivate" : "Activate"}
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
