"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  auth,
  signInWithEmailAndPassword,
} from "@/lib/firebase";
import CopyrightGate from "@/components/CopyrightGate";
import { useAuth } from "@/lib/AuthContext";

import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      if (!idToken) {
        throw new Error("Firebase ID token unavailable");
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseIdToken: idToken }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Login response was not JSON:", text);
        throw new Error(text || "Login failed");
      }
      if (!res.ok) {
        console.error("Login failed response:", data);
        throw new Error(data.error || data.stack || "Login failed");
      }
      toast.success("Welcome back!");
      await refreshProfile();
      router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err.message?.replace("Firebase: ", "") || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card neon-border w-full max-w-md p-8"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Image src="/logo.png" alt="Nivesh Ventures" width={36} height={36} className="rounded-lg" />
          <span className="font-display font-bold text-lg">Nivesh Ventures</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-center mb-6">Log in to your account</h1>

        <form onSubmit={handleLogin} className="space-y-3">
          <input className="input-field" type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <PasswordInput placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
        >
          {loading ? "Please wait..." : "Continue with Google"}
        </button> */}

        <p className="text-center text-sm text-ink-muted mt-4">
          <Link href="/reset-password" className="text-neon-cyan">Forgot password?</Link>
        </p>

        <p className="text-center text-sm text-ink-muted mt-3">
          New here? <Link href="/register" className="text-neon-cyan">Create an account</Link>
        </p>
      </motion.div>
      <footer className="fixed bottom-3 left-0 right-0 text-center text-xs text-ink-muted flex items-center justify-center gap-1.5">
        <CopyrightGate /> {new Date().getFullYear()} Nivesh Ventures
      </footer>
    </div>
  );
}
