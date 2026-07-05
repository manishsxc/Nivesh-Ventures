"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#about" },
  { label: "Business", href: "#business" },
  { label: "Income Plan", href: "#income" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const container = document.getElementById("landing-desktop");
    if (!container) return;
    const handler = () => setScrolled(container.scrollTop > 60);
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#0A0E1A]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_32px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#0d1831] border border-white/10 flex items-center justify-center group-hover:border-neon-violet/50 transition-all duration-300 shadow-neon-sm">
            <Image src="/logo.png" alt="Nivesh Ventures" width={30} height={30} className="object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-base tracking-[0.12em] text-white">NIVESH</span>
            <span className="font-display font-bold text-base tracking-[0.12em] text-neon-cyan">VENTURES</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm font-medium text-ink-muted hover:text-white transition-colors duration-200 group py-1"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-gradient-to-r from-neon-violet to-neon-cyan group-hover:w-full transition-all duration-350 rounded-full" />
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="btn-landing-ghost !py-2.5 !px-5 !text-sm !rounded-xl">
            Login
          </Link>
          <Link href="/register" className="btn-landing-primary !py-2.5 !px-5 !text-sm !rounded-xl landing-glow-pulse">
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle (shown between lg–xl) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden text-white p-2 hover:bg-white/10 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Dropdown nav for lg-xl screens */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="xl:hidden bg-[#0A0E1A]/98 backdrop-blur-2xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-8 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-ink-muted hover:text-white transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <Link href="/login" className="btn-landing-ghost !py-2 !px-4 !text-sm !rounded-lg flex-1 text-center">Login</Link>
                <Link href="/register" className="btn-landing-primary !py-2 !px-4 !text-sm !rounded-lg flex-1 text-center">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
