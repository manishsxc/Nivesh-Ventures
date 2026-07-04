"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase";
import CopyrightGate from "@/components/CopyrightGate";
import { useAuth } from "@/lib/AuthContext";
import PasswordInput from "@/components/ui/PasswordInput";

const countries = ["India", "United States", "United Kingdom", "United Arab Emirates", "Nepal", "Bangladesh", "Other"];

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    country: "India",
    sponsorId: params.get("ref") || "",
    position: "left",
    otp: "",
  });

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.email || form.password.length < 6) {
      toast.error("Fill all fields — password needs 6+ characters");
      return;
    }
    setLoading(true);
    try {
      // Create the Firebase auth account first.
      await createUserWithEmailAndPassword(auth, form.email, form.password);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("OTP sent to your Gmail");
      setStep(2);
    } catch (err: any) {
      toast.error(err.message?.replace("Firebase: ", "") || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, firebaseIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Account created — check your email for your Member ID");
      await refreshProfile();
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card neon-border w-full max-w-md p-8"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Image src="/logo.png" alt="Nivesh Ventures" width={36} height={36} className="rounded-lg" />
          <span className="font-display font-bold text-lg">Nivesh Ventures</span>
        </div>

        <h1 className="font-display text-xl font-semibold text-center mb-1">Create your account</h1>
        <p className="text-sm text-ink-muted text-center mb-6">
          Step {step} of 2 — {step === 1 ? "Your details" : "Verify email"}
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <input className="input-field" placeholder="Real full name" value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)} />
            <input className="input-field" placeholder="Mobile number" value={form.mobile}
              onChange={(e) => update("mobile", e.target.value)} />
            <input className="input-field" type="email" placeholder="Gmail address" value={form.email}
              onChange={(e) => update("email", e.target.value)} />
            <PasswordInput placeholder="Create password (6+ chars)" value={form.password}
              onChange={(e) => update("password", e.target.value)} />
            <select className="input-field" value={form.country} onChange={(e) => update("country", e.target.value)}>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input-field" placeholder="Referral code (optional)" value={form.sponsorId}
              onChange={(e) => update("sponsorId", e.target.value)} />
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-2 input-field cursor-pointer">
                <input type="radio" name="pos" checked={form.position === "left"} onChange={() => update("position", "left")} />
                Left
              </label>
              <label className="flex-1 flex items-center gap-2 input-field cursor-pointer">
                <input type="radio" name="pos" checked={form.position === "right"} onChange={() => update("position", "right")} />
                Right
              </label>
            </div>
            <button disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Sending OTP..." : "Send OTP & Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-3">
            <p className="text-sm text-ink-muted">Enter the 6-digit code sent to <span className="text-neon-cyan">{form.email}</span></p>
            <input className="input-field text-center tracking-[0.5em] text-lg" maxLength={6} placeholder="000000"
              value={form.otp} onChange={(e) => update("otp", e.target.value.replace(/\D/g, ""))} />
            <button disabled={loading} className="btn-primary w-full">
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full text-sm">Back</button>
          </form>
        )}

        <p className="text-center text-sm text-ink-muted mt-6">
          Already registered? <Link href="/login" className="text-neon-cyan">Log in</Link>
        </p>
      </motion.div>
      <footer className="fixed bottom-3 left-0 right-0 text-center text-xs text-ink-muted flex items-center justify-center gap-1.5">
        <CopyrightGate /> {new Date().getFullYear()} Nivesh Ventures
      </footer>
    </div>
  );
}
