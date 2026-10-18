"use client";

import { useId } from "react";

/**
 * Form primitives for the music video submission form.
 *
 * Pulled out of the page because the form now has around sixty fields across twelve sections,
 * and the same input markup repeated sixty times is where inconsistent focus states, missing
 * labels and silently different paddings come from.
 */

const INPUT_CLASS =
  "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white " +
  "text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors";

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-body text-white/50 text-xs block mb-1.5">
        {label}
        {required && <span className="text-[#C30100] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="font-body text-white/25 text-[11px] mt-1 leading-relaxed">{hint}</p>}
      {error && <p className="font-body text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  type = "text",
  inputMode,
  max,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "url" | "email";
  max?: number;
  min?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  rows = 4,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  max?: number;
}) {
  // Shown from the start, not only once the limit is hit: these are hard partner limits, and
  // finding out at 1,040 characters that the cap was 1,000 means rewriting rather than trimming.
  const counter = max ? `${value.length} / ${max.toLocaleString()}` : null;
  const over = max ? value.length > max : false;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="font-body text-white/50 text-xs">
          {label}
          {required && <span className="text-[#C30100] ml-0.5">*</span>}
        </label>
        {counter && (
          <span className={["font-body text-[10px]", over ? "text-red-400" : "text-white/25"].join(" ")}>
            {counter}
          </span>
        )}
      </div>
      <textarea
        value={value}
        rows={rows}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS + " resize-y leading-relaxed"}
      />
      {hint && <p className="font-body text-white/25 text-[11px] mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

/** A horizontal set of mutually exclusive choices. Wraps to a column at phone widths. */
export function ChoiceRow<T extends string>({
  label,
  hint,
  required,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  options: readonly { id: T; name: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <div className="flex flex-col sm:flex-row gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              "flex-1 py-2.5 px-3 rounded-lg border text-xs font-heading transition-all",
              value === o.id
                ? "border-[#C30100] bg-[#C30100]/10 text-[#C30100]"
                : "border-white/10 text-white/40 hover:border-white/25",
            ].join(" ")}
          >
            {o.name}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Yes / No, kept as a tri-state so "unanswered" is distinguishable from "No". */
export function YesNo({
  label,
  hint,
  required,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <div className="flex gap-2">
        {[
          { v: true, name: "Yes" },
          { v: false, name: "No" },
        ].map((o) => (
          <button
            key={o.name}
            type="button"
            onClick={() => onChange(o.v)}
            className={[
              "flex-1 py-2.5 rounded-lg border text-xs font-heading transition-all",
              value === o.v
                ? "border-[#C30100] bg-[#C30100]/10 text-[#C30100]"
                : "border-white/10 text-white/40 hover:border-white/25",
            ].join(" ")}
          >
            {o.name}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="flex items-start gap-3 text-left w-full disabled:opacity-40"
    >
      <div
        className={[
          "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          checked ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
        ].join(" ")}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="font-body text-white/60 text-xs leading-relaxed">{label}</span>
    </button>
  );
}

/** Multi-select pills, for platforms and travel cities. */
export function PillGroup({
  label,
  hint,
  required,
  options,
  selected,
  onToggle,
  noteFor,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  options: readonly { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  /** An extra line under a specific option, e.g. why Spotify is unavailable. */
  noteFor?: (id: string) => string | null;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const on = selected.includes(o.id);
          const note = noteFor?.(o.id) ?? null;

          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={[
                "flex items-start gap-2.5 py-2.5 px-3 rounded-lg border text-left transition-all",
                on
                  ? "border-[#C30100] bg-[#C30100]/10"
                  : "border-white/10 hover:border-white/25",
              ].join(" ")}
            >
              <div
                className={[
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-px transition-colors",
                  on ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
                ].join(" ")}
              >
                {on && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="min-w-0">
                <span className={["block font-heading text-xs", on ? "text-[#C30100]" : "text-white/60"].join(" ")}>
                  {o.name}
                </span>
                {note && <span className="block font-body text-amber-400/70 text-[10px] mt-0.5 leading-snug">{note}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/** Section heading plus the one line of context the paper form carries. */
export function SectionHead({ index, title, note }: { index: number; title: string; note?: string }) {
  return (
    <div>
      <p className="font-body text-white/25 text-[10px] uppercase tracking-widest mb-1">
        Section {index} of 12
      </p>
      <h2 className="font-heading text-white uppercase text-sm tracking-widest">{title}</h2>
      {note && <p className="font-body text-white/40 text-xs mt-1.5 leading-relaxed">{note}</p>}
    </div>
  );
}

/**
 * A field that accepts a code OR the sentinel the form prescribes.
 *
 * The paper form says to write "SONGDIS GENERATE" when the artist has no UPC or ISRC. Typed
 * by hand that arrives as "songdis generate", "SONGDIS-GENERATE" and a dozen other spellings,
 * none of which a later lookup will match, so the sentinel is a button instead.
 */
export function CodeField({
  label,
  value,
  onChange,
  sentinel,
  sentinelLabel,
  hint,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  sentinel: string;
  sentinelLabel: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const isSentinel = value === sentinel;

  return (
    <Field label={label} hint={hint} required={required}>
      <input
        id={id}
        value={isSentinel ? "" : value}
        disabled={isSentinel}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isSentinel ? sentinel : placeholder}
        className={INPUT_CLASS + (isSentinel ? " opacity-40" : "")}
      />
      <button
        type="button"
        onClick={() => onChange(isSentinel ? "" : sentinel)}
        className="font-body text-[#C30100] text-[11px] hover:underline mt-1.5"
      >
        {isSentinel ? "I have a code, let me type it" : sentinelLabel}
      </button>
    </Field>
  );
}
