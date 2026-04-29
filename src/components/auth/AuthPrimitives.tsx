"use client";

import React, { useState, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   AUTH INPUT
───────────────────────────────────────────────────────────────── */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="font-body text-white text-sm"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full bg-[#1A0808] border rounded-lg px-4 py-3",
            "font-body text-white text-sm placeholder:text-white/30",
            "outline-none transition-colors duration-200",
            "focus:border-[#C30100]",
            error ? "border-red-500" : "border-white/10",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="font-body text-red-400 text-xs mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

/* ─────────────────────────────────────────────────────────────────
   PASSWORD INPUT (with show/hide toggle)
───────────────────────────────────────────────────────────────── */
interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ label, error, id, className = "", ...props }, ref) => {
  const [show, setShow] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-body text-white text-sm">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={show ? "text" : "password"}
          className={[
            "w-full bg-[#1A0808] border rounded-lg px-4 py-3 pr-11",
            "font-body text-white text-sm placeholder:text-white/30",
            "outline-none transition-colors duration-200",
            "focus:border-[#C30100]",
            error ? "border-red-500" : "border-white/10",
            className,
          ].join(" ")}
          {...props}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200 focus-visible:outline-none"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <p className="font-body text-red-400 text-xs mt-0.5">{error}</p>
      )}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

/* ─────────────────────────────────────────────────────────────────
   AUTH BUTTON
───────────────────────────────────────────────────────────────── */
interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "outline";
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  isLoading = false,
  variant = "primary",
  disabled,
  className = "",
  ...props
}) => {
  const base =
    "w-full font-heading uppercase tracking-widest text-sm rounded-full py-4 px-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] focus-visible:ring-offset-2 focus-visible:ring-offset-[#140C0C] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-[#140C0C] text-white border border-[#C30100] hover:bg-[#C30100]",
    outline:
      "bg-transparent text-white border border-white/20 hover:border-white/50",
  };

  return (
    <button
      disabled={disabled ?? isLoading}
      className={[base, variants[variant], className].join(" ")}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────
   OTP INPUT (6 boxes, auto-advance, paste support)
───────────────────────────────────────────────────────────────── */
interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusAt = useCallback(
    (index: number) => inputsRef.current[index]?.focus(),
    []
  );

  const handleChange = (index: number, char: string) => {
    const cleaned = char.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? cleaned : d)).join("");
    onChange(next);
    if (cleaned && index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = digits.map((d, i) => (i === index ? "" : d)).join("");
        onChange(next);
      } else if (index > 0) {
        focusAt(index - 1);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`OTP digit ${i + 1}`}
            className={[
              "w-12 h-14 text-center font-heading text-white text-xl",
              "bg-[#1A0808] border rounded-lg",
              "outline-none transition-colors duration-200",
              "focus:border-[#C30100]",
              error ? "border-red-500" : "border-white/15",
            ].join(" ")}
          />
        ))}
      </div>
      {error && (
        <p className="font-body text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   FORM ERROR BANNER
───────────────────────────────────────────────────────────────── */
export const FormError: React.FC<{ message: string | null }> = ({
  message,
}) => {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
      <p className="font-body text-red-400 text-sm">{message}</p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SVG ICONS (inline — no icon library dependency)
───────────────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);