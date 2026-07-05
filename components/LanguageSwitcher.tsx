"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("languagePreference") || "en";
    setLang(saved);
  }, []);

  const handleChange = async (newLang: string) => {
    setLang(newLang);
    localStorage.setItem("languagePreference", newLang);
    try {
      const res = await fetch("/api/user/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
      if (res.ok) {
        toast.success(newLang === "hi" ? "भाषा बदलकर हिंदी कर दी गई है" : "Language set to English");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={lang}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-ink outline-none cursor-pointer focus:border-neon-magenta transition"
      >
        <option value="en" className="bg-black text-ink">English</option>
        <option value="hi" className="bg-black text-ink">हिंदी (Hindi)</option>
      </select>
    </div>
  );
}
