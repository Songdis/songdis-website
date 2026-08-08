"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Landmark, Sparkles, X } from "lucide-react";

import {
  CO_SIGN_DEFAULT_KOBO,
  CO_SIGN_PRESETS_KOBO,
  formatNaira,
  parseNairaToKobo,
  type PublicCoSign,
} from "@/lib/api/co-sign";

interface Props {
  artistName: string;
  cosign: PublicCoSign;
}

/** "Tobi, Ada and Chidi" — Intl-free so it reads the same on every runtime. */
function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function CoSignCard({ artistName, cosign }: Props) {
  // `{"enabled": false}` is the entire payload for an artist who has not set this up.
  // Nothing is rendered — not a card, not an empty state, not a hint that it exists.
  if (!cosign.enabled) return null;
  return <CoSignCardBody artistName={artistName} cosign={cosign} />;
}

function CoSignCardBody({
  artistName,
  cosign,
}: {
  artistName: string;
  cosign: Extract<PublicCoSign, { enabled: true }>;
}) {
  const [amountText, setAmountText] = useState(() =>
    formatNaira(CO_SIGN_DEFAULT_KOBO, { withSymbol: false })
  );
  const [open, setOpen] = useState(false);

  const amountKobo = useMemo(() => parseNairaToKobo(amountText), [amountText]);
  const canOpen = amountKobo !== null && amountKobo > 0;

  const namedSupporters = cosign.recent.map((r) => r.sender_name);

  return (
    <section className="pt-10 sm:pt-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-[10.5px] uppercase leading-none tracking-[0.24em] text-[var(--pk-muted)] sm:text-[11.5px]">
          Co-sign
        </h2>
      </div>

      <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-6 sm:p-7">
        {/* Seal + count. The count is real or it is absent — a "0 co-signs" badge on a
            brand-new artist is a worse first impression than no badge. */}
        {cosign.count > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(150deg,var(--pk-accent),var(--pk-accent-deep))] shadow-[0_6px_18px_var(--pk-glow)]">
              <Sparkles className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--pk-muted)]">
                <b className="text-[15px] font-bold text-[var(--pk-text)]">
                  {cosign.count.toLocaleString("en-NG")}
                </b>{" "}
                {cosign.count === 1 ? "co-sign" : "co-signs"}
                {cosign.total_kobo > 0 && (
                  <>
                    {" · "}
                    {formatNaira(cosign.total_kobo)} raised
                  </>
                )}
              </p>
              {/* Real names only (CS4). No avatars exist, so none are faked. */}
              {namedSupporters.length > 0 && (
                <p className="mt-0.5 truncate text-[12px] text-[var(--pk-muted-2)]">
                  {joinNames(namedSupporters.slice(0, 3))}
                  {namedSupporters.length > 3 &&
                    ` +${namedSupporters.length - 3} more`}
                </p>
              )}
            </div>
          </div>
        )}

        <h3
          className="mb-2 text-[21px] uppercase leading-tight text-[var(--pk-text)] sm:text-[24px]"
          style={{ fontFamily: "var(--pk-headline)" }}
        >
          Co-sign {artistName}
        </h3>
        <p className="mb-5 text-[14px] leading-relaxed text-[var(--pk-muted)]">
          Put your name behind the movement. You&rsquo;ll send a bank transfer straight to{" "}
          {artistName}&rsquo;s Songdis account — no card, no sign-up.
        </p>

        {/* Amount. Naira, not dollars. */}
        <label
          htmlFor="cosign-amount"
          className="mb-1.5 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--pk-muted-2)]"
        >
          How much?
        </label>
        <div className="mb-3 flex items-center rounded-2xl border border-[var(--pk-line)] bg-black/35 px-4 focus-within:border-[var(--pk-accent)] sm:px-5">
          <span
            className="mr-2 text-[26px] font-extrabold text-[var(--pk-text)]"
            style={{ fontFamily: "var(--pk-headline)" }}
            aria-hidden
          >
            ₦
          </span>
          <input
            id="cosign-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0"
            aria-label="Amount in naira"
            className="w-full bg-transparent py-3 text-[28px] font-extrabold text-[var(--pk-text)] outline-none placeholder:text-[var(--pk-muted-2)] sm:text-[30px]"
            style={{ fontFamily: "var(--pk-headline)" }}
          />
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2 sm:gap-2.5">
          {CO_SIGN_PRESETS_KOBO.map((preset) => {
            const active = amountKobo === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountText(formatNaira(preset, { withSymbol: false }))}
                aria-pressed={active}
                className={[
                  "rounded-xl border py-2.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]",
                  active
                    ? "border-[var(--pk-accent)] bg-white/[0.06] text-[var(--pk-text)]"
                    : "border-[var(--pk-line)] text-[var(--pk-text-soft)] hover:border-[var(--pk-accent)]",
                ].join(" ")}
              >
                {formatNaira(preset)}
              </button>
            );
          })}
        </div>

        {/* No message field: with a static account, only the amount and (sometimes) the
            sender's bank name reach us. See the file header. */}

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!canOpen}
          className="w-full rounded-2xl bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[14px] uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_var(--pk-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ fontFamily: "var(--pk-headline)" }}
        >
          Co-sign now
        </button>

        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-[var(--pk-muted-2)]">
          Next you&rsquo;ll get {artistName}&rsquo;s account number to transfer to.
        </p>
      </div>

      {open && (
        <TransferSheet
          artistName={artistName}
          cosign={cosign}
          amountKobo={amountKobo ?? 0}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

/* ─── The transfer instructions ───────────────────────────────── */

/**
 * Everything the fan needs to complete the transfer in their own bank app.
 *
 * The account number is the load-bearing string on this whole screen, so it is the
 * largest thing in the sheet, tracked wide enough to read digit by digit, and copyable
 * in one tap. Nothing else here competes with it.
 */
function TransferSheet({
  artistName,
  cosign,
  amountKobo,
  onClose,
}: {
  artistName: string;
  cosign: Extract<PublicCoSign, { enabled: true }>;
  amountKobo: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState<"number" | "amount" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = useCallback(async (text: string, which: "number" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      // Clipboard blocked (insecure context, or an in-app browser). The number is
      // already selectable text on screen, so there is nothing else useful to do —
      // and a scary error would be worse than the silence.
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Transfer details for ${artistName}`}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--pk-line)] bg-[var(--pk-bg)] px-5 pb-8 pt-3 outline-none sm:max-w-md sm:rounded-2xl sm:border sm:px-6 sm:pb-7"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              className="text-[18px] uppercase leading-tight text-[var(--pk-text)]"
              style={{ fontFamily: "var(--pk-headline)" }}
            >
              Send your co-sign
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--pk-muted)]">
              Open your bank app and transfer to the account below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--pk-line)] text-[var(--pk-muted)] transition hover:text-[var(--pk-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
          >
            <X className="h-[15px] w-[15px]" />
          </button>
        </div>

        {/* The account number — the reason this sheet exists. */}
        <div className="rounded-2xl border border-[var(--pk-line)] bg-black/35 p-5">
          <div className="mb-1 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--pk-muted-2)]">
            <Landmark className="h-3.5 w-3.5 text-[var(--pk-accent)]" strokeWidth={2} aria-hidden />
            Account number
          </div>
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 select-all break-all font-mono text-[26px] font-bold tracking-[0.08em] text-[var(--pk-text)] sm:text-[30px]">
              {cosign.account_number}
            </span>
            <button
              type="button"
              onClick={() => void copy(cosign.account_number, "number")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--pk-line)] px-3.5 py-2 text-[12px] font-semibold text-[var(--pk-text-soft)] transition hover:border-[var(--pk-accent)] hover:text-[var(--pk-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
            >
              {copied === "number" ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <dl className="mt-3 divide-y divide-[var(--pk-line)] rounded-2xl border border-[var(--pk-line)] px-4">
          {cosign.bank_name && (
            <Row label="Bank" value={cosign.bank_name} />
          )}
          {cosign.account_name && (
            <Row label="Account name" value={cosign.account_name} />
          )}
          {amountKobo > 0 && (
            <Row
              label="Suggested amount"
              value={formatNaira(amountKobo)}
              action={
                <button
                  type="button"
                  onClick={() =>
                    void copy(formatNaira(amountKobo, { withSymbol: false }), "amount")
                  }
                  className="text-[11.5px] font-semibold text-[var(--pk-accent)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
                >
                  {copied === "amount" ? "Copied" : "Copy"}
                </button>
              }
            />
          )}
        </dl>

        {/* The amount is advisory. This sentence is the difference between an honest
            instruction and a promise the static account cannot keep. */}
        <p className="mt-4 rounded-xl border border-[var(--pk-line)] bg-[var(--pk-surface)] px-4 py-3 text-[12px] leading-relaxed text-[var(--pk-muted)]">
          Send any amount you like — whatever arrives is credited to {artistName}. The
          figure above is only a suggestion, so there is nothing to match exactly.
        </p>

        <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--pk-muted-2)]">
          Transfers usually show on {artistName}&rsquo;s page within a few minutes. Your
          bank may show your name to them; anything you type in your bank&rsquo;s
          &ldquo;narration&rdquo; box does not reach Songdis.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-[var(--pk-line)] px-6 py-3.5 text-[12.5px] uppercase tracking-[0.12em] text-[var(--pk-text-soft)] transition hover:border-[var(--pk-accent)] hover:text-[var(--pk-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
          style={{ fontFamily: "var(--pk-headline)" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <dt className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-[var(--pk-muted-2)]">
        {label}
      </dt>
      <dd className="ml-auto flex min-w-0 items-center gap-3 text-right">
        <span className="truncate text-[14px] font-semibold text-[var(--pk-text)]">{value}</span>
        {action}
      </dd>
    </div>
  );
}
