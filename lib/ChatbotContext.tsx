"use client";

import { createContext, useContext, useState } from "react";

const ChatbotContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ChatbotContext.Provider value={{ open, setOpen }}>{children}</ChatbotContext.Provider>;
}

export const useChatbot = () => useContext(ChatbotContext);
