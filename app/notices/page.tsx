"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notices", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setNotices(d.notices || []));
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">Notice Board</h1>
      <div className="glass-card p-5">
        {!notices.length ? (
          <p className="text-sm text-ink-muted py-8 text-center">No notices yet.</p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n._id} className="bg-base-soft rounded-xl p-4">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-ink-muted mt-1">{n.message}</p>
                <p className="text-xs text-neon-cyan mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
