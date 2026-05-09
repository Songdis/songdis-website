"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

/* ─── Types ───────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms — 0 means persistent until manually dismissed
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  loading: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  update: (id: string, opts: Partial<Omit<Toast, "id">>) => void;
}

/* ─── Context ─────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = opts.duration ?? (opts.type === "loading" ? 0 : opts.type === "error" ? 6000 : 4000);

      setToasts((prev) => [...prev.slice(-4), { ...opts, id, duration }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const update = useCallback((id: string, opts: Partial<Omit<Toast, "id">>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...opts } : t))
    );
    // If updating away from loading with a duration, start the dismiss timer
    if (opts.duration && opts.duration > 0) {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(id), opts.duration);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: "success", title, message }), [toast]);

  const error = useCallback((title: string, message?: string) =>
    toast({ type: "error", title, message }), [toast]);

  const info = useCallback((title: string, message?: string) =>
    toast({ type: "info", title, message }), [toast]);

  const loading = useCallback((title: string, message?: string) =>
    toast({ type: "loading", title, message, duration: 0 }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, loading, dismiss, update }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ─── Individual toast item ───────────────────────────────────── */
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const icon = {
    success: <CheckIcon />,
    error:   <ErrorIcon />,
    info:    <InfoIcon />,
    loading: <SpinnerIcon />,
  }[t.type];

  const accent = {
    success: "border-green-500/30 bg-green-500/10",
    error:   "border-[#C30100]/40 bg-[#C30100]/10",
    info:    "border-white/15 bg-white/[0.04]",
    loading: "border-white/15 bg-white/[0.04]",
  }[t.type];

  const iconColor = {
    success: "text-green-400",
    error:   "text-[#C30100]",
    info:    "text-white/60",
    loading: "text-white/60",
  }[t.type];

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl max-w-sm w-full",
        "transition-all duration-300",
        accent,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      <div className={`shrink-0 mt-0.5 ${iconColor}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-white text-sm font-medium leading-snug">{t.title}</p>
        {t.message && (
          <p className="font-body text-white/50 text-xs mt-0.5 leading-relaxed">{t.message}</p>
        )}
      </div>
      {t.type !== "loading" && (
        <button
          onClick={() => onDismiss(t.id)}
          className="shrink-0 text-white/30 hover:text-white transition-colors mt-0.5"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}

/* ─── Toast container ─────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}