"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Landmark, Loader2, X } from "lucide-react";

import {
  CO_SIGN_DEFAULT_KOBO,
  CO_SIGN_PRESETS_KOBO,
  formatNaira,
  getPublicCoSignStatus,
  parseNairaToKobo,
  startPublicCoSign,
  type PublicCoSign,
} from "@/lib/api/co-sign";

interface Props {
  artistName: string;
  artistSlug: string;
  cosign: PublicCoSign;
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function CoSignCard({ artistName, artistSlug, cosign }: Props) {
  if (!cosign.enabled) return null;
  return <CoSignCardBody artistName={artistName} artistSlug={artistSlug} cosign={cosign} />;
}

function CoSignCardBody({
  artistName,
  artistSlug,
  cosign,
}: {
  artistName: string;
  artistSlug: string;
  cosign: Extract<PublicCoSign, { enabled: true }>;
}) {
  const [amountText, setAmountText] = useState(() =>
    formatNaira(CO_SIGN_DEFAULT_KOBO, { withSymbol: false })
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // Back from the payment page: ?cosigned=<reference>.
  const [returning] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("cosigned")
  );

  const amountKobo = useMemo(() => parseNairaToKobo(amountText), [amountText]);
  const canOpen = amountKobo !== null && amountKobo >= (cosign.pay_online ? cosign.min_kobo : 1);

  const payOnline = async () => {
    if (!amountKobo) return;
    setPaying(true);
    setPayError(null);
    const res = await startPublicCoSign(artistSlug, { amount_kobo: amountKobo, name: name.trim() || undefined });
    if (res.error || !res.data?.checkout_url) {
      setPaying(false);
      setPayError(res.errors?.amount_kobo?.[0] ?? res.error ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.href = res.data.checkout_url;
  };
  const amountRef = useRef<HTMLInputElement | null>(null);
  const namedSupporters = cosign.recent.map((r) => r.sender_name);

  useEffect(() => {
    if (window.location.hash !== "#cosign") return;
    const focus = () => amountRef.current?.select();
    const timer = window.setTimeout(focus, 400); // after the smooth scroll settles
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section id="cosign" className="scroll-mt-24 pt-10 sm:pt-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-[10.5px] uppercase leading-none tracking-[0.24em] text-[var(--pk-muted)] sm:text-[11.5px]">
          Co-sign
        </h2>
      </div>

      <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-6 sm:p-7">
        {cosign.count > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--pk-muted)]">
                <b className="text-[15px] font-bold text-[var(--pk-text)]">
                  {cosign.count.toLocaleString("en-NG")}
                </b>{" "}
                {cosign.count === 1 ? "co-sign" : "co-signs"}
              </p>
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
          {cosign.pay_online ? (
            <>Put your name behind the movement. Pay by card or bank transfer — no sign-up.</>
          ) : (
            <>
              Put your name behind the movement. You&rsquo;ll send a bank transfer straight to{" "}
              {artistName}&rsquo;s Songdis account — no card, no sign-up.
            </>
          )}
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
            ref={amountRef}
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

        {cosign.pay_online && (
          <>
            <label
              htmlFor="cosign-name"
              className="mb-1.5 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--pk-muted-2)]"
            >
              Your name <span className="normal-case tracking-normal">(optional, shown on this page)</span>
            </label>
            <input
              id="cosign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              placeholder="Leave blank to co-sign quietly"
              className="mb-5 w-full rounded-2xl border border-[var(--pk-line)] bg-black/35 px-4 py-3.5 text-[15px] text-[var(--pk-text)] outline-none placeholder:text-[var(--pk-muted-2)] focus:border-[var(--pk-accent)] sm:px-5"
            />
          </>
        )}

        <button
          type="button"
          onClick={cosign.pay_online ? payOnline : () => setOpen(true)}
          disabled={!canOpen || paying}
          className="w-full rounded-2xl bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[14px] uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_var(--pk-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ fontFamily: "var(--pk-headline)" }}
        >
          {paying ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Opening secure payment…
            </span>
          ) : cosign.pay_online && amountKobo ? (
            `Co-sign ${formatNaira(amountKobo)}`
          ) : (
            "Co-sign now"
          )}
        </button>

        {payError && (
          <p role="alert" className="mt-3 text-center text-[12.5px] text-[#ff6b6b]">
            {payError}
          </p>
        )}

        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-[var(--pk-muted-2)]">
          {cosign.pay_online
            ? `Card or bank transfer, on a secure payment page. Every naira goes to ${artistName}.`
            : `Next you’ll get ${artistName}’s account number to transfer to.`}
        </p>
      </div>

      {returning && <CoSignThanks artistName={artistName} artistSlug={artistSlug} reference={returning} />}

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
              onClick={() => void copy(cosign.account_number ?? "", "number")}
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

/**
 * After paying: "Confirming…" until Bachs confirms, then a thank-you that fades out by
 * itself. The co-sign is only real once the webhook lands — this just watches for it.
 */
function CoSignThanks({ artistName, artistSlug, reference }: { artistName: string; artistSlug: string; reference: string }) {
  const [state, setState] = useState<"checking" | "paid" | "slow">("checking");
  const [amountKobo, setAmountKobo] = useState(0);
  const [shown, setShown] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Tidy the address bar, keep the anchor.
    const url = new URL(window.location.href);
    url.searchParams.delete("cosigned");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);

    const enter = window.setTimeout(() => setShown(true), 30);
    let tries = 0;
    let done = false;
    const check = async () => {
      if (done) return;
      tries += 1;
      const res = await getPublicCoSignStatus(artistSlug, reference);
      if (res.data?.status === "paid") {
        done = true;
        setAmountKobo(res.data.amount_kobo);
        setState("paid");
      } else if (tries >= 15) {
        done = true;
        setState("slow");
      }
    };
    void check();
    const poll = window.setInterval(check, 3000);
    return () => {
      window.clearTimeout(enter);
      window.clearInterval(poll);
    };
  }, [artistSlug, reference]);

  // Leave by itself a few seconds after the result is in.
  useEffect(() => {
    if (state === "checking") return;
    const out = window.setTimeout(() => setShown(false), state === "paid" ? 5000 : 7000);
    const remove = window.setTimeout(() => {
      setGone(true);
      if (state === "paid") window.location.reload(); // show the new count and name
    }, state === "paid" ? 5400 : 7400);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(remove);
    };
  }, [state]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => state !== "checking" && setShown(false)}
      className={`fixed inset-x-0 bottom-6 z-[95] mx-auto flex w-[calc(100%-32px)] max-w-sm items-center gap-3.5 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-bg)]/95 px-4 py-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur transition-all duration-[400ms] ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
          state === "paid" ? "bg-[#1f9d55]" : "bg-white/[0.08]"
        }`}
      >
        {state === "paid" ? (
          <Check className="h-5 w-5 text-white animate-[pk-pop_420ms_cubic-bezier(.2,1.4,.4,1)]" strokeWidth={3} aria-hidden />
        ) : state === "checking" ? (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--pk-muted)]" aria-hidden />
        ) : (
          <Landmark className="h-5 w-5 text-[var(--pk-muted)]" aria-hidden />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--pk-text)]">
          {state === "paid"
            ? `You co-signed ${artistName}`
            : state === "checking"
              ? "Confirming your co-sign…"
              : "Payment still processing"}
        </p>
        <p className="text-[12px] text-[var(--pk-muted)]">
          {state === "paid"
            ? `${formatNaira(amountKobo)} · thank you for the support`
            : state === "checking"
              ? "This takes a few seconds."
              : "Bank transfers can take a few minutes. It will show here once it lands."}
        </p>
      </div>
      <style>{`@keyframes pk-pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
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
