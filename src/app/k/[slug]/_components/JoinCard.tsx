"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { BASE_URL } from "@/lib/api/core";
import { headlineStyle } from "../_theme";

/**
 * "Stay close": a fan leaves an email or WhatsApp number and lands in the artist's Shout Out
 * list, so the next release reaches them directly instead of through an algorithm.
 */
export default function JoinCard({ artistName, artistSlug }: { artistName: string; artistSlug: string | null }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!artistSlug) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() && !phone.trim()) {
      setError("Leave an email or a WhatsApp number.");
      return;
    }
    if (!consent) {
      setError(`Tick the box so ${artistName} can message you.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/public/press-kits/${artistSlug}/join`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || null, phone: phone.trim() || null, consent, company }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const first = json?.errors ? (Object.values(json.errors)[0] as string[] | undefined)?.[0] : null;
        setError(first ?? json?.message ?? "That didn't go through. Try again.");
      } else {
        setDone(json?.message ?? "You're in.");
      }
    } catch {
      setError("Check your connection and try again.");
    }
    setBusy(false);
  };

  const field =
    "w-full rounded-xl border border-[var(--pk-line)] bg-black/25 px-4 py-3 text-[14.5px] text-[var(--pk-text)] outline-none placeholder:text-[var(--pk-muted-2)] focus:border-[var(--pk-accent)]";

  return (
    <section key="join" className="pt-10 sm:pt-12">
      <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-6 sm:p-8">
        <h2 className="text-[20px] uppercase leading-tight text-[var(--pk-text)] sm:text-[24px]" style={headlineStyle}>
          Stay close to {artistName}
        </h2>
        <p className="mt-2 max-w-[520px] text-[14.5px] leading-relaxed text-[var(--pk-text-soft)]">
          New music, shows and drops, sent straight to you. No algorithm in between.
        </p>

        {done ? (
          <p className="mt-6 flex items-center gap-2.5 text-[15px] text-[var(--pk-text)]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--pk-accent)] text-white">
              <Check className="h-4 w-4" strokeWidth={2.6} />
            </span>
            {done}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2" noValidate>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              className={field}
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp, e.g. +234 803 123 4567"
              autoComplete="tel"
              aria-label="WhatsApp number"
              className={field}
            />
            {/* Honeypot: hidden from people, filled in by bots. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="hidden"
              aria-hidden
            />
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[var(--pk-muted)] sm:col-span-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--pk-accent)]"
              />
              <span>
                {artistName} can send me updates by email or WhatsApp. I can unsubscribe or reply STOP at any time.
              </span>
            </label>
            {error && <p className="text-[13.5px] text-[#FF7A5C] sm:col-span-2">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-3.5 text-[13px] uppercase tracking-[0.1em] text-white transition hover:brightness-110 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
              style={headlineStyle}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Keep me posted
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
