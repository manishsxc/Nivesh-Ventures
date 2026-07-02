"use client";

import { useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import ReferralQRCard from "@/components/ReferralQRCard";
import { useAuth } from "@/lib/AuthContext";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { compressImage } from "@/lib/imageCompress";
import { Edit2, Loader2, Key } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { profile, firebaseUser, refreshProfile } = useAuth();
  const [photoUploading, setPhotoUploading] = useState(false);

  // USDT Address Change State
  const [newUsdtAddress, setNewUsdtAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file, 90);
      const url = await uploadToCloudinary(compressed);

      // Save to database
      const res = await fetch("/api/user/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile photo");
      }
      toast.success("Profile photo updated");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function sendUsdtOtp() {
    if (!newUsdtAddress.trim()) {
      toast.error("Enter a new USDT address first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/usdt-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("OTP sent to your email");
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyUsdtOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsdtAddress.trim() || !otp) {
      toast.error("USDT address and OTP are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/usdt-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          newAddress: newUsdtAddress.trim(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("USDT wallet address updated successfully");
      setNewUsdtAddress("");
      setOtp("");
      setOtpSent(false);
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update USDT address");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group w-16 h-16 rounded-full overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center text-xl font-bold text-base">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                {/* Upload Hover Overlay */}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {photoUploading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Edit2 size={16} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={photoUploading}
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
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

          {/* USDT Wallet Management */}
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg mb-2">USDT Wallet Address</h2>
            <p className="text-xs text-ink-muted mb-4">
              Change or register your USDT (BEP20) wallet address. Updates require email OTP verification.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-ink-muted">Current Address</p>
                <p className="text-sm font-mono font-medium mt-0.5 text-neon-cyan break-all">
                  {profile?.usdtWalletAddress || "Not set / Not registered"}
                </p>
              </div>

              {!otpSent ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="input-field font-mono text-sm flex-1"
                    placeholder="Enter new USDT (BEP20) address"
                    value={newUsdtAddress}
                    onChange={(e) => setNewUsdtAddress(e.target.value)}
                  />
                  <button
                    onClick={sendUsdtOtp}
                    disabled={busy}
                    className="btn-primary py-2.5 whitespace-nowrap text-sm flex items-center justify-center gap-1.5"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                    Send Verification OTP
                  </button>
                </div>
              ) : (
                <form onSubmit={verifyUsdtOtp} className="space-y-3 max-w-md">
                  <div>
                    <p className="text-xs text-ink-muted">New Address</p>
                    <p className="text-xs font-mono font-medium text-ink break-all mt-0.5">{newUsdtAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input-field text-center font-bold tracking-widest text-lg"
                      placeholder="6-Digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary px-6 text-sm"
                    >
                      {busy ? "Verifying..." : "Verify & Save"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="text-xs text-neon-magenta hover:underline"
                  >
                    Change address or Resend OTP
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div>
          {profile?.memberId && <ReferralQRCard memberId={profile.memberId} />}
        </div>
      </div>
    </DashboardShell>
  );
}
