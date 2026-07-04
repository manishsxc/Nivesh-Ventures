"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`input-field pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-neon-cyan transition-colors"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
