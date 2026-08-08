"use client";

/**
 * The small pieces the press-kit editor is built from: the inline fields that stand in
 * for the mock's `contentEditable` nodes, the sheet, the toast, and the failure surface.
 *
 * ── Why these are real form controls and not contentEditable ────────────────
 *
 * The mock marks editable text with `.ed` and flips `contentEditable` on. In React a
 * controlled contentEditable fights the caret on every keystroke, and on a phone it
 * loses the keyboard type, the autocorrect hints and half of the accessibility tree.
 * These render as `<input>`/`<textarea>` wearing the same dashed accent outline, which
 * is what the artist actually recognises about `.editing` mode.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { ACCENT_TEXT } from "./theme";

/* ─── Inline text fields ──────────────────────────────────────── */

const INLINE_BASE =
  "w-full bg-transparent text-white placeholder:text-white/25 rounded-md px-2 py-1.5 " +
  "border border-dashed border-white/20 transition-colors " +
  "focus:outline-none focus:border-solid focus:border-[#E5342F] focus:bg-white/[0.03]";

export function InlineField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  error,
  maxLength,
  inputMode,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
  hint?: string;
  error?: string | null;
  maxLength?: number;
  inputMode?: "text" | "email" | "url";
  id?: string;
}) {
  const generated = useRef(`pk-${Math.random().toString(36).slice(2, 9)}`);
  const fieldId = id ?? generated.current;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label
        htmlFor={fieldId}
        className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40"
      >
        {label}
      </label>
      <input
        id={fieldId}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`${INLINE_BASE} font-body text-sm ${
          error ? "border-solid border-[#d03b3b]" : ""
        }`}
      />
      {error ? (
        <p className="font-body text-[11px]" style={{ color: ACCENT_TEXT }}>
          {error}
        </p>
      ) : hint ? (
        <p className="font-body text-[11px] text-white/30">{hint}</p>
      ) : null}
    </div>
  );
}

/** Auto-growing textarea — a bio should never be edited through a four-line porthole. */
export function InlineArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  minRows = 4,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  minRows?: number;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const generated = useRef(`pk-${Math.random().toString(36).slice(2, 9)}`);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label
        htmlFor={generated.current}
        className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40"
      >
        {label}
      </label>
      <textarea
        id={generated.current}
        ref={ref}
        rows={minRows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`${INLINE_BASE} font-body text-sm leading-relaxed resize-none overflow-hidden ${
          error ? "border-solid border-[#d03b3b]" : ""
        }`}
      />
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p className="font-body text-[11px]" style={{ color: ACCENT_TEXT }}>
            {error}
          </p>
        ) : hint ? (
          <p className="font-body text-[11px] text-white/30">{hint}</p>
        ) : (
          <span />
        )}
        {maxLength && (
          <span className="font-body text-[10px] text-white/25 tabular-nums shrink-0">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Buttons ─────────────────────────────────────────────────── */

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        // A large brand fill is the one place #C30100 is legitimate — the label on top
        // is white, not brand red.
        "font-heading uppercase text-[11px] tracking-[0.12em] text-white rounded-full",
        "px-5 py-2.5 bg-[#C30100] hover:bg-[#a30100] transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5342F]",
        full ? "w-full" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  danger = false,
  full = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  full?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "font-body text-[12px] rounded-full px-4 py-2 border transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]",
        danger
          ? "text-[#E5342F] border-[#E5342F]/40 hover:bg-[#E5342F]/10"
          : "text-white/70 border-white/12 hover:text-white hover:border-white/30",
        full ? "w-full flex items-center justify-center gap-2" : "inline-flex items-center gap-2",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "w-8 h-8 rounded-lg border grid place-items-center transition-colors shrink-0",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]",
        active
          ? "text-white border-[#E5342F]/50 bg-[#E5342F]/12"
          : "text-white/55 border-white/10 hover:text-white hover:border-white/25",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ─── Card ────────────────────────────────────────────────────── */

export function Panel({
  children,
  className = "",
  muted = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <section
      className={[
        "rounded-xl border bg-[#180F0F]",
        muted ? "border-white/[0.04] opacity-70" : "border-white/[0.07]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

/* ─── Failure surface ─────────────────────────────────────────── */

/**
 * `errors` is the Laravel field map and is the ONLY place per-field validation
 * messages live. Rendering `error` alone shows one problem at a time and hides the
 * rest — on a form with contacts, quotes and placements on it, that means fixing three
 * things across three round trips. Every field is listed.
 */
export function FailureNotice({
  title,
  error,
  errors,
  onRetry,
  tone = "error",
}: {
  title?: string;
  error: string | null;
  errors?: Record<string, string[]> | null;
  onRetry?: () => void;
  tone?: "error" | "warning";
}) {
  const fields = Object.entries(errors ?? {});
  const accent = tone === "warning" ? "#fab219" : "#d03b3b";

  return (
    <div
      role="alert"
      className="rounded-lg p-3.5 flex flex-col gap-2 border"
      style={{ borderColor: `${accent}4d`, backgroundColor: `${accent}12` }}
    >
      <p className="font-body text-white text-xs font-medium flex items-start gap-2">
        <AlertTriangle size={14} style={{ color: accent }} className="mt-px shrink-0" aria-hidden />
        <span>
          {title && <span className="block text-white/90">{title}</span>}
          <span className={title ? "text-white/70" : ""}>{error ?? "Something went wrong."}</span>
        </span>
      </p>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-1.5 pl-6">
          {fields.map(([field, messages]) => (
            <li key={field} className="font-body text-white/65 text-[11px]">
              <span className="text-white/40">{prettyField(field)}: </span>
              {messages.join(" ")}
            </li>
          ))}
        </ul>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-start font-body text-[11px] text-white/70 hover:text-white border border-white/10 hover:border-white/25 rounded-full px-3 py-1 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** `contacts.bookings` reads better as "Contacts › bookings" than as a JSON path. */
function prettyField(field: string): string {
  return field
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" › ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning";
}) {
  const accent = tone === "warning" ? "#fab219" : "rgba(255,255,255,0.25)";
  return (
    <p
      className="font-body text-[11px] leading-relaxed rounded-lg px-3 py-2.5 border text-white/55"
      style={{ borderColor: `${tone === "warning" ? "#fab21940" : "rgba(255,255,255,0.07)"}` }}
    >
      <span style={{ color: accent }} aria-hidden>
        ●{" "}
      </span>
      {children}
    </p>
  );
}

/* ─── Sheet ───────────────────────────────────────────────────── */

/**
 * The mock's bottom sheet. One page with sheets, not separate routes — so theme and
 * address never take the artist away from what they were editing.
 *
 * Bottom-anchored on a phone (thumb reach), centred from `sm:` up. Escape closes it and
 * focus moves into the panel on open, because a sheet you cannot dismiss from the
 * keyboard is a trap.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[
          "relative w-full sm:max-w-lg max-h-[88dvh] overflow-y-auto outline-none",
          "bg-[#0E0808] border-t sm:border border-white/[0.09]",
          "rounded-t-3xl sm:rounded-2xl px-5 sm:px-6 pt-3 pb-6 sm:pb-6",
        ].join(" ")}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="font-heading text-white uppercase text-base tracking-wide">{title}</h2>
            {subtitle && (
              <p className="font-body text-white/45 text-xs mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full grid place-items-center text-white/50 hover:text-white border border-white/10 hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4">{children}</div>

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
}

/* ─── Toast ───────────────────────────────────────────────────── */

export interface ToastMessage {
  id: number;
  text: string;
  tone: "ok" | "bad";
}

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (text: string, tone: "ok" | "bad" = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), text, tone });
    timer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { toast, show };
}

export function Toaster({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[90] pointer-events-none"
    >
      <div className="flex items-center gap-2 rounded-full bg-[#231719] border border-white/10 px-4 py-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
        <span
          className="w-4 h-4 rounded-full grid place-items-center shrink-0"
          style={{ backgroundColor: toast.tone === "ok" ? "#0ca30c" : "#d03b3b" }}
          aria-hidden
        >
          {toast.tone === "ok" ? (
            <Check size={10} className="text-white" />
          ) : (
            <X size={10} className="text-white" />
          )}
        </span>
        <span className="font-body text-white text-xs">{toast.text}</span>
      </div>
    </div>
  );
}

/* ─── File picker ─────────────────────────────────────────────── */

/**
 * A hidden `<input type="file">` driven by a render-prop trigger.
 *
 * `capture` is deliberately NOT set: on a phone that would force the camera and remove
 * the artist's photo library, which is where a press shot actually lives.
 */
export function FilePicker({
  onPick,
  accept = "image/*",
  disabled = false,
  children,
}: {
  onPick: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  children: (open: () => void) => React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset first: picking the same file twice must fire onChange both times.
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      {children(() => {
        if (!disabled) ref.current?.click();
      })}
    </>
  );
}

/* ─── Shimmer ─────────────────────────────────────────────────── */

export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`av2-shimmer rounded-md ${className}`} />;
}
