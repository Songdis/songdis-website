"use client";

/**
 * songdis.com/pay/CODE — where a friend pays for an artist ("Pay for me").
 *
 * The person paying is usually not on SongDis. They see who is asking, what it is for, the
 * amount and the artist's message, then pay with the Bachs form opened over this page, and
 * end on a thank-you here. Bachs's redirect (if the overlay was not used) comes back with
 * ?paid=1 and the page waits for the payment to be confirmed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublicPay, startPublicPay, type PayView } from "@/lib/api/payRequests";
import { openBachsOverlay, type BachsEvent } from "@/lib/bachs";

type Phase = "loading" | "ready" | "paying" | "confirming" | "done" | "missing";

export default function PayPage() {
  const params = useParams();
  const search = useSearchParams();
  const code = String(params?.code ?? "").toUpperCase();

  const [view, setView] = useState<PayView | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerMessage, setPayerMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const res = await getPublicPay(code);
    if (!res.data) return null;
    setView(res.data);
    return res.data;
  }, [code]);

  // Wait for Bachs to confirm, then celebrate.
  const confirm = useCallback(() => {
    setPhase("confirming");
    let tries = 0;
    if (polling.current) clearInterval(polling.current);
    polling.current = setInterval(async () => {
      tries++;
      const v = await refresh();
      if (v?.status === "paid" || tries > 40) {
        if (polling.current) clearInterval(polling.current);
        setPhase("done");
      }
    }, 3000);
  }, [refresh]);

  useEffect(() => {
    let alive = true;
    getPublicPay(code).then((res) => {
      if (!alive) return;
      if (!res.data) {
        setError(res.error ?? "This payment link does not exist.");
        setPhase("missing");
        return;
      }
      setView(res.data);
      if (res.data.status === "paid") setPhase("done");
      else if (search.get("paid") === "1") confirm();
      else setPhase("ready");
    });
    return () => {
      alive = false;
      if (polling.current) clearInterval(polling.current);
    };
  }, [code, search, confirm]);

  const pay = async () => {
    setError(null);
    setPhase("paying");
    const res = await startPublicPay(code, {
      payer_name: payerName.trim() || undefined,
      payer_message: payerMessage.trim() || undefined,
    });
    if (!res.data?.checkout_url) {
      setError(res.error ?? "We couldn't start the payment. Please try again.");
      setPhase("ready");
      return;
    }
    try {
      await openBachsOverlay(res.data.checkout_url, (event: BachsEvent) => {
        if (event.type === "checkout.completed") confirm();
        if (event.type === "checkout.failed") {
          setError("That payment didn't go through. Nothing was charged; you can try again.");
          setPhase("ready");
        }
        if (event.type === "checkout.closed" || event.type === "checkout.expired") {
          setPhase((p) => (p === "paying" ? "ready" : p));
        }
      });
    } catch {
      // Overlay could not load: fall back to Bachs's own page, which returns here with ?paid=1.
      window.location.href = res.data.checkout_url;
    }
  };

  const first = view?.artist.name ?? "";
  const expired = view?.status === "expired" || view?.status === "cancelled";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0707] px-4 py-8 sm:py-14">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#C30100]/25 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-[440px]">
        <Link href="/" className="mx-auto mb-6 flex w-fit items-center" aria-label="SongDis">
          <Image src="/images/logo.svg" alt="SongDis" width={120} height={32} unoptimized className="h-7 w-auto" />
        </Link>

        {phase === "loading" && <div className="h-[420px] animate-pulse rounded-3xl bg-white/[0.04]" />}

        {phase === "missing" && (
          <Card>
            <p className="text-center text-4xl">🔗</p>
            <h1 className="mt-3 text-center font-heading text-lg uppercase tracking-wide text-white">Link not found</h1>
            <p className="mt-2 text-center font-body text-sm text-white/60">{error}</p>
          </Card>
        )}

        {view && phase === "done" && (
          <Card>
            <div className="text-center">
              <div className="mx-auto mb-2 text-5xl animate-bounce" aria-hidden>🎉</div>
              <Avatar view={view} size={76} />
              <h1 className="mt-4 font-heading text-xl uppercase tracking-wide text-white">
                {view.status === "paid" ? `You just helped ${first}!` : "Payment received"}
              </h1>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/60">
                {view.status === "paid"
                  ? `${view.item} is now active for ${first}. We've let them know it was you${view.payer_name ? `, ${view.payer_name}` : ""}. Thank you for backing their music!`
                  : `We're confirming your payment with the bank. ${first} will be notified as soon as it's done. You can close this page.`}
              </p>
              <Link href="/" className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 px-6 font-heading text-[11px] uppercase tracking-widest text-white/80 hover:text-white">
                Make music too? Try SongDis
              </Link>
            </div>
          </Card>
        )}

        {view && phase === "confirming" && (
          <Card>
            <div className="py-6 text-center">
              <svg className="mx-auto animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              <p className="mt-4 font-heading text-sm uppercase tracking-wide text-white">Confirming your payment…</p>
              <p className="mt-1 font-body text-xs text-white/50">This usually takes a few seconds.</p>
            </div>
          </Card>
        )}

        {view && (phase === "ready" || phase === "paying") && (
          <Card>
            <div className="text-center">
              <Avatar view={view} size={84} />
              <p className="mt-4 font-body text-sm text-white/60">
                <span className="font-semibold text-white">{first}</span> is asking you to help pay for
              </p>
              <h1 className="mt-1 font-heading text-lg uppercase tracking-wide text-white">{view.item}</h1>
              <p className="mt-4 font-heading text-[44px] leading-none tracking-tight text-white">{view.amount_display}</p>
            </div>

            {view.note && (
              <div className="relative mt-6 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="font-body text-sm leading-relaxed text-white/85">&ldquo;{view.note}&rdquo;</p>
                <p className="mt-1.5 font-body text-[11px] text-white/40">— {first}</p>
              </div>
            )}

            {view.perks.length > 0 && (
              <ul className="mt-5 space-y-2">
                {view.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 font-body text-[13px] text-white/70">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#C30100]/25 text-[10px] text-[#ff8a8a]">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            )}

            {expired ? (
              <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center font-body text-sm text-white/60">
                This link has expired. Ask {first} to send you a new one.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-2.5">
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value.slice(0, 80))}
                    placeholder="Your name (so they know it was you)"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 font-body text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C30100]/60"
                  />
                  {showMessage ? (
                    <textarea
                      value={payerMessage}
                      onChange={(e) => setPayerMessage(e.target.value.slice(0, 280))}
                      rows={2}
                      placeholder={`A message for ${first} (optional)`}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-body text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C30100]/60"
                    />
                  ) : (
                    <button type="button" onClick={() => setShowMessage(true)} className="font-body text-xs text-white/45 underline underline-offset-2 hover:text-white/70">
                      + Add a message for {first}
                    </button>
                  )}
                </div>

                {error && <p className="mt-3 rounded-lg bg-[#C30100]/10 px-3 py-2 font-body text-xs text-[#ff8a8a]">{error}</p>}

                <button
                  onClick={pay}
                  disabled={phase === "paying"}
                  className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#C30100] font-heading text-xs uppercase tracking-widest text-white shadow-[0_10px_40px_-10px_rgba(195,1,0,0.8)] transition hover:bg-[#a80000] active:scale-[0.99] disabled:opacity-60"
                >
                  {phase === "paying" ? "Opening secure payment…" : `Pay ${view.amount_display}`}
                </button>
                <p className="mt-3 text-center font-body text-[11px] text-white/35">
                  🔒 Secure payment · Card or bank transfer · Link valid until {new Date(view.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </>
            )}
          </Card>
        )}

        <p className="mt-6 text-center font-body text-[11px] text-white/30">
          SongDis gets music on Spotify, Apple Music, Audiomack, Boomplay and 200+ stores.
        </p>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/[0.08] bg-[#140C0C]/90 p-6 shadow-2xl backdrop-blur sm:p-7">{children}</div>;
}

function Avatar({ view, size }: { view: PayView; size: number }) {
  return view.artist.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={view.artist.image}
      alt={view.artist.name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="mx-auto rounded-full object-cover ring-4 ring-[#C30100]/40"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-[#C30100] to-[#5a0000] font-heading text-2xl text-white ring-4 ring-[#C30100]/40"
    >
      {view.artist.name.slice(0, 1).toUpperCase()}
    </div>
  );
}
