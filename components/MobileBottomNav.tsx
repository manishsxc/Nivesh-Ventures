"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, Wallet, User } from "lucide-react";
import { useChatbot } from "@/lib/ChatbotContext";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/team", label: "Network", icon: Users },
  { href: "__chat__", label: "Assistant", icon: MessageCircle },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { open, setOpen } = useChatbot();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-soft/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.href === "__chat__") {
            return (
              <button
                key="chat"
                onClick={() => setOpen(!open)}
                className="flex flex-col items-center justify-center py-2.5 gap-1"
              >
                <div className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center shadow-neon">
                  <Icon size={20} className="text-base" />
                </div>
                <span className="text-[10px] text-ink-muted">{item.label}</span>
              </button>
            );
          }
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2.5 gap-1 ${active ? "text-neon-cyan" : "text-ink-muted"}`}
            >
              <Icon size={19} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
