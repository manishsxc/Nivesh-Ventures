"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="h-screen bg-[#050919] text-white flex flex-col overflow-hidden w-full max-w-full">

      {/* CENTER CONTENT (LOGO) */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-[#0d1831] border border-white/10 flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <Image
              src="/logo.png"
              alt="Nivesh Ventures"
              width={76}
              height={76}
              className="object-contain"
            />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.15em]">NIVESH</h1>
            <p className="text-3xl sm:text-4xl font-bold tracking-[0.15em] text-neon-cyan">
              VENTURES
            </p>
            <p className="mt-3 text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-300">
              Invest · Grow · Future
            </p>
          </div>
        </motion.div>
      </div>

      {/* FOOTER ACTION SECTION (JUST ABOVE FOOTER) */}
      <div className="px-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto flex flex-col gap-2"
        >
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center
             rounded-2xl bg-gradient-to-r from-[#1b5bff] to-[#2ecc71]
             px-8 py-2.5 text-sm font-semibold text-white
             shadow-[0_10px_25px_rgba(17,170,255,0.15)]
             w-fit"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center
             rounded-2xl border border-white/20 bg-white/5
             px-8 py-2.5 text-sm font-semibold text-white
             transition hover:border-[#3b6cff]
             w-fit"
            >
              Login
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-1">
            Explore our platform with Get Started button
          </p>
        </motion.div>
      </div>

      {/* FOOTER */}
      <div className="text-center py-2 text-xs text-slate-400 border-t border-white/10 shrink-0">
        © {new Date().getFullYear()} Nivesh Ventures.
      </div>

    </div>
  );
}