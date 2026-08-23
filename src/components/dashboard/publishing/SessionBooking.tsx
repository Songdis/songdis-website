"use client";

/**
 * Booking the done-for-you IPI session (₦50,000).
 *
 * Two screens in one component because they are one decision: pick a time, confirm what
 * it costs. Splitting them across routes would let someone land on "confirm and pay" with
 * no slot chosen.
 *
 * The slot list comes from the API already formatted in West Africa Time. Nothing here
 * re-derives a timezone — a booking shown in one zone and honoured in another is the
 * failure that makes people miss calls.
 */

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Video, Loader2 } from "lucide-react";
import {
  formatNaira,
  getSessionSlots,
  startSessionCheckout,
  type SessionSlot,
} from "@/lib/api/publishing";

const SESSION_PRICE = 50000;

export default function SessionBooking({
  artistProfileId,
  onBack,
}: {
  artistProfileId: number;
  onBack: () => void;
}) {
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [chosen, setChosen] = useState<SessionSlot | null>(null);
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getSessionSlots();
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error ?? "Could not load available times.");
      return;
    }

    setError(null);
    setSlots(res.data.slots);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pay = async () => {
    if (!chosen) return;

    setBusy(true);
    setError(null);

    const res = await startSessionCheckout(artistProfileId, chosen.slot_at);

    if (res.error || !res.data?.checkout_url) {
      setBusy(false);
      // A slot can go between loading the page and paying for it. Reload rather than
      // leaving a dead time selected.
      setError(res.error ?? "Could not start payment.");
      setStep("pick");
      setChosen(null);
      void load();
      return;
    }

    // Leaves the app for the payment page; the booking is confirmed by webhook.
    window.location.href = res.data.checkout_url;
  };

  return (
    <div className="mx-auto max-w-[560px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <button
        onClick={step === "confirm" ? () => setStep("pick") : onBack}
        className="font-body text-xs text-white/40 transition-colors hover:text-white"
      >
        ← Back
      </button>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i <= (step === "pick" ? 1 : 2) ? "bg-[#C30100]" : "bg-white/12"
            }`}
          />
        ))}
      </div>

      {step === "pick" ? (
        <>
          <h2 className="mt-5 font-heading text-xl uppercase leading-[1.2] tracking-wide text-white sm:text-2xl">
            Book your IPI session
          </h2>

          <p className="mt-3 font-body text-sm leading-relaxed text-white/55">
            30 minutes with the Songdis publishing team, on Google Meet. Bring your ID and
            your song list. Times are West Africa Time.
          </p>

          {loading ? (
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-[62px] animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center font-body text-sm text-white/45">
              No times are open right now. Try again shortly, or use the help form and we
              will reach out.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {slots.map((slot) => {
                const active = chosen?.slot_at === slot.slot_at;

                return (
                  <button
                    key={slot.slot_at}
                    onClick={() => setChosen(slot)}
                    aria-pressed={active}
                    className={`min-h-[62px] rounded-xl border px-2 py-2.5 text-center transition-colors ${
                      active
                        ? "border-[#C30100] bg-[#C30100]/[0.12]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/25"
                    }`}
                  >
                    <span className="block font-body text-sm font-semibold text-white">
                      {slot.label_time}
                    </span>
                    <span className="mt-0.5 block font-body text-[11px] text-white/45">
                      {slot.label_day}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
              {error}
            </p>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!chosen}
            className="mt-5 flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:bg-[#C30100]/25 disabled:text-white/50"
          >
            {chosen ? "Continue to payment" : "Pick a time"}
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-5 font-heading text-xl uppercase leading-[1.2] tracking-wide text-white sm:text-2xl">
            Confirm and pay
          </h2>

          <dl className="mt-5 rounded-xl border border-dashed border-white/15 p-4">
            <Row label="Service" value="IPI registration session" />
            <Row
              label="When"
              value={`${chosen?.label_day}, ${chosen?.label_time} WAT`}
              icon={<CalendarClock size={13} className="text-white/40" aria-hidden />}
            />
            <Row
              label="Where"
              value="Google Meet"
              icon={<Video size={13} className="text-white/40" aria-hidden />}
            />

            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <Row label="One-time" value={formatNaira(SESSION_PRICE)} accent />
            </div>
          </dl>

          {/* The single most important line on this screen. Without it people assume the
              fee covers their PRO membership too, and feel cheated when it does not. */}
          <p className="mt-4 font-body text-xs leading-relaxed text-white/50">
            This covers Songdis handling your application end to end.{" "}
            <span className="font-semibold text-white/85">
              Your PRO&rsquo;s own membership fee is separate
            </span>{" "}
            and paid directly to them.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
              {error}
            </p>
          )}

          <button
            onClick={pay}
            disabled={busy}
            className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {busy ? "Taking you to payment…" : `Pay ${formatNaira(SESSION_PRICE)}`}
          </button>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="font-body text-xs text-white/45">{label}</dt>
      <dd
        className={`flex items-center gap-1.5 text-right font-body text-sm ${
          accent ? "font-semibold text-[#ff6b68]" : "font-medium text-white"
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}
