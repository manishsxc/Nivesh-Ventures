"use client";

import DashboardShell from "@/components/DashboardShell";
import ReferralQRCard from "@/components/ReferralQRCard";
import { useAuth } from "@/lib/AuthContext";
import { useMemo } from "react";

export default function ProfilePage() {
  const { profile, firebaseUser } = useAuth();

  const displayName = profile?.fullName || firebaseUser?.displayName || "User";
  const displayEmail = profile?.email || firebaseUser?.email || "—";
  const displayAvatar = profile?.profilePhotoUrl || firebaseUser?.photoURL || "";

  const rows = useMemo(
    () => [
      { label: "Full Name", value: displayName },
      { label: "Member ID", value: profile?.memberId || "—" },
      { label: "Email", value: displayEmail },
      { label: "Mobile", value: profile?.mobile || "—" },
      { label: "Country", value: profile?.country || "—" },
      { label: "Sponsor ID", value: profile?.sponsorId || "—" },
      { label: "Rank", value: profile?.rank || "Unranked" },
      { label: "Joined", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—" },
    ],
    [displayEmail, displayName, profile],
  );

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center text-xl font-bold text-base">
                {displayName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <p className="font-display text-lg font-semibold">{displayName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                profile?.isActive ? "bg-neon-green/15 text-neon-green" : "bg-white/5 text-ink-muted"
              }`}>{profile?.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rows.map((r) => (
              <div key={r.label}>
                <p className="text-xs text-ink-muted">{r.label}</p>
                <p className="text-sm font-medium mt-0.5">{r.value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {profile?.memberId && <ReferralQRCard memberId={profile.memberId} />}
      </div>
    </DashboardShell>
  );
}
