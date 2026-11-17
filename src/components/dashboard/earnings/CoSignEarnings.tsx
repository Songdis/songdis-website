"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, HeartHandshake } from "lucide-react";

import {
  describePayoutStatus,
  formatNaira,
  getCoSignOverview,
  normaliseCoSignOverview,
  requestCoSignPayout,
  type CoSignArtistMoney,
  type CoSignOverview,
} from "@/lib/api/co-sign";
import type { PayoutAccount } from "@/lib/api/payout";
import type { CoSignFailure } from "@/lib/hooks/useCoSign";
import { CoSignPayoutSheet } from "@/components/dashboard/press-kit/CoSignPayoutSheet";

const when = (iso: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

/**
 * Co-sign money: what fans sent each artist through their press kit. Kept apart from the
 * royalty wallet (it is naira, held per artist) and withdrawn to the same bank account.
 */
export default function CoSignEarnings({ destination }: { destination: PayoutAccount | null }) {
  const [data, setData] = useState<CoSignOverview | null>(null);
  const [open, setOpen] = useState<CoSignArtistMoney | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<CoSignFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getCoSignOverview();
    if (res.data) setData(normaliseCoSignOverview(res.data));
  }, []);

  useEffect(() => {
    let alive = true;
    getCoSignOverview().then((res) => {
      if (alive && res.data) setData(normaliseCoSignOverview(res.data));
    });
    return () => { alive = false; };
  }, []);

  // A withdrawal is sent in the background; look again shortly to show where it got to.
  useEffect(() => {
    const moving = data?.artists.some((a) => a.payouts.some((p) => ["requested", "approved", "sent"].includes(p.status)));
    if (!moving) return;
    const t = setTimeout(() => void load(), 15000);
    return () => clearTimeout(t);
  }, [data, load]);

  if (!data || data.artists.length === 0) return null;

  const submit = async (amountKobo: number): Promise<boolean> => {
    if (!open) return false;
    if (!destination) {
      setFailure({ error: "Add your bank account under Payout Account first.", errors: null, status: 0 });
      return false;
    }
    setBusy(true);
    setFailure(null);
    const res = await requestCoSignPayout(open.profile_id, amountKobo, destination.id);
    setBusy(false);
    if (!res.data) {
      setFailure({ error: res.error, errors: res.errors ?? null, status: res.status });
      return false;
    }
    setNotice(`${formatNaira(amountKobo)} is on its way to your bank.`);
    void load();
    return true;
  };

  return (
    <section id="co-sign" className="scroll-mt-24 rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C30100]/15">
            <HeartHandshake size={18} className="text-[#ff6b6b]" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-sm uppercase tracking-wide text-white">Co-sign</h2>
            <p className="font-body text-xs text-white/45">Money fans sent through your press kit, in naira</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-body text-[11px] text-white/45">Ready to withdraw</p>
          <p className="font-heading text-xl font-bold tabular-nums text-white">{formatNaira(data.available_kobo)}</p>
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 font-body text-[13px] text-emerald-300">
          {notice}
        </p>
      )}

      <ul className="mt-4 divide-y divide-white/[0.06]">
        {data.artists.map((a) => {
          const available = a.balance.available_kobo;
          const latest = a.payouts[0];
          return (
            <li key={a.profile_id} className="py-3.5">
              <div className="flex items-center gap-3">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-heading text-sm text-white/70">
                    {a.stage_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-white">{a.stage_name}</p>
                  <p className="font-body text-xs text-white/45">
                    {a.balance.cosign_count.toLocaleString("en-NG")} co-sign{a.balance.cosign_count === 1 ? "" : "s"}
                    {a.balance.settled_out_kobo > 0 && ` · ${formatNaira(a.balance.settled_out_kobo)} paid out`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-heading text-base tabular-nums text-white">{formatNaira(available)}</span>
                  <button
                    type="button"
                    onClick={() => { setFailure(null); setNotice(null); setOpen(a); }}
                    disabled={available <= 0}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#C30100] px-3.5 py-1.5 font-body text-xs font-semibold text-white transition hover:bg-[#a50100] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/30"
                  >
                    <ArrowDownToLine size={13} aria-hidden />
                    Withdraw
                  </button>
                </div>
              </div>

              {latest && (
                <ul className="mt-2.5 space-y-1 pl-[52px]">
                  {a.payouts.slice(0, 3).map((p) => (
                    <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-3 font-body text-xs">
                      <span className="text-white/70 tabular-nums">{formatNaira(p.amount_kobo)}</span>
                      <span className={p.status === "failed" ? "text-[#ff6b6b]" : p.status === "settled" ? "text-emerald-400" : "text-amber-300"}>
                        {describePayoutStatus(p.status)}
                        {when(p.settled_at ?? p.requested_at) && <span className="text-white/35"> · {when(p.settled_at ?? p.requested_at)}</span>}
                      </span>
                      {p.status === "failed" && p.failure_reason && (
                        <span className="basis-full text-white/40">{p.failure_reason}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {open && (
        <CoSignPayoutSheet
          onClose={() => setOpen(null)}
          availableKobo={open.balance.available_kobo}
          destination={destination}
          busy={busy}
          failure={failure}
          onSubmit={submit}
        />
      )}
    </section>
  );
}
