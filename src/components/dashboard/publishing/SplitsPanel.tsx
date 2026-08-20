"use client";

/**
 * Publishing splits — who wrote a song, in what shares.
 *
 * Two things drive the whole design:
 *
 *  1. The publisher rejects a split whose shares do not add up to exactly 100%. So the
 *     total is shown live, in the same place the numbers are typed, and Submit stays
 *     disabled until it is right. Discovering that after a fifteen-second round trip is
 *     the worst possible moment to find out.
 *
 *  2. Songdis takes its cut from the royalty when it arrives, NOT from the split — so
 *     100% belongs to the writers and nothing here reserves a publisher share.
 *
 * Mobile first: one column, full-width controls, 44px+ targets, share inputs numeric.
 */

import { useMemo, useState } from "react";
import {
  createSplit,
  retrySplit,
  SPLIT_IN_FLIGHT,
  SPLIT_LABEL,
  type PublishingSplit,
  type PublishingWriter,
} from "@/lib/api/publishing";

type Row = { name: string; ipi: string; share: string };

const inputCls =
  "w-full min-h-[48px] rounded-xl border border-white/10 bg-[#0E0808] px-3.5 font-body text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C30100]/60";

export default function SplitsPanel({
  splits,
  writers,
  onChanged,
}: {
  splits: PublishingSplit[];
  writers: PublishingWriter[];
  onChanged: (message?: string) => void;
}) {
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <SplitForm
        writers={writers}
        onCancel={() => setCreating(false)}
        onDone={(msg) => {
          setCreating(false);
          onChanged(msg);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-wide text-white">Splits</h2>
          <p className="mt-1 font-body text-xs leading-relaxed text-white/45">
            Who wrote each song, and what share each writer holds.
          </p>
        </div>
      </div>

      <button
        onClick={() => setCreating(true)}
        className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
      >
        New split
      </button>

      {splits.length === 0 && (
        <p className="rounded-xl border border-white/[0.07] bg-[#140C0C] px-4 py-8 text-center font-body text-sm text-white/45">
          No splits yet.
        </p>
      )}

      {splits.map((s) => (
        <SplitCard key={s.id} split={s} onChanged={onChanged} />
      ))}
    </div>
  );
}

function SplitCard({
  split,
  onChanged,
}: {
  split: PublishingSplit;
  onChanged: (message?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inFlight = SPLIT_IN_FLIGHT.includes(split.status);
  const failed = split.status === "failed";

  const tone = failed
    ? "border-[#C30100]/30 bg-[#C30100]/[0.08] text-[#ff6b68]"
    : split.status === "registered"
      ? "border-green-500/25 bg-green-500/[0.08] text-green-300"
      : "border-amber-500/30 bg-amber-500/[0.08] text-amber-300";

  const retry = async () => {
    setBusy(true);
    const res = await retrySplit(split.id);
    setBusy(false);
    onChanged(res.error ? undefined : "Picking up where it stopped.");
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#140C0C] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold text-white">{split.title}</p>
          <p className="mt-0.5 font-body text-xs text-white/45">
            {split.writers.length} writer{split.writers.length === 1 ? "" : "s"}
            {split.isrcs.length > 0 && ` · ${split.isrcs.length} ISRC${split.isrcs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-body text-[11px] ${tone}`}>
          {SPLIT_LABEL[split.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {split.writers.map((w) => (
          <li key={w.ipi} className="flex items-center justify-between gap-3 font-body text-xs">
            <span className="min-w-0 truncate text-white/70">
              {w.name || `IPI ${w.ipi}`}
            </span>
            <span className="shrink-0 tabular-nums text-white/50">{w.share}%</span>
          </li>
        ))}
      </ul>

      {failed && split.last_error && (
        <p className="mt-3 rounded-lg border border-[#C30100]/25 bg-[#C30100]/[0.06] px-3 py-2 font-body text-[11px] leading-relaxed text-white/70">
          {split.last_error}
        </p>
      )}

      {failed && (
        <button
          onClick={retry}
          disabled={busy}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white transition-colors hover:border-white/35 disabled:opacity-40"
        >
          {/* "Continue", not "Start again": the job resumes from the step it stopped at,
              because re-running create would leave a second split at the publisher. */}
          {busy ? "Working…" : "Continue"}
        </button>
      )}

      {inFlight && (
        <p className="mt-3 font-body text-[11px] text-white/35">
          This takes about a minute. You can leave this page.
        </p>
      )}
    </div>
  );
}

function SplitForm({
  writers,
  onCancel,
  onDone,
}: {
  writers: PublishingWriter[];
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const registered = useMemo(
    () => writers.filter((w) => w.status === "registered"),
    [writers]
  );

  const [title, setTitle] = useState("");
  const [isrcs, setIsrcs] = useState("");
  const [rows, setRows] = useState<Row[]>(() =>
    // Seeded with the account's own registered writer where there is exactly one — the
    // common case is "me and one collaborator", and typing your own IPI again is friction
    // with a real cost if you fat-finger it.
    registered.length === 1
      ? [{ name: `${registered[0].first_name} ${registered[0].last_name}`, ipi: registered[0].ipi, share: "100" }]
      : [{ name: "", ipi: "", share: "" }]
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /*
   * Totalled in integer basis points, not floats. 33.33 + 33.33 + 33.34 is exactly 100 in
   * hundredths but not in binary, and the artist should not be told their split is wrong
   * because of that.
   */
  const totalBps = rows.reduce((sum, r) => {
    const n = parseFloat(r.share);
    return sum + (Number.isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);

  const totalPct = totalBps / 100;
  const exact = totalBps === 10000;

  const filled = rows.filter((r) => r.ipi.replace(/\D+/g, "").length > 0);
  const ready = title.trim() && filled.length > 0 && exact && !busy;

  const set = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    setBusy(true);
    setErr(null);

    const res = await createSplit({
      title: title.trim(),
      isrcs: isrcs
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      writers: filled.map((r) => ({
        ipi: r.ipi.replace(/\D+/g, ""),
        name: r.name.trim() || undefined,
        share: parseFloat(r.share),
      })),
    });

    setBusy(false);

    if (res.error) {
      setErr(res.error);
      return;
    }

    onDone("Submitted. We are registering this split — it can take a minute.");
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <button
        onClick={onCancel}
        className="font-body text-xs text-white/40 transition-colors hover:text-white"
      >
        ← Back
      </button>

      <h2 className="mt-3 font-heading text-lg uppercase tracking-wide text-white">New split</h2>
      <p className="mt-2 font-body text-xs leading-relaxed text-white/50">
        Shares are the writers&rsquo; only — Songdis takes its cut from the royalty when it
        arrives, not from this split.
      </p>

      <div className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block font-body text-[11px] uppercase tracking-wider text-white/40">
            Song title
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-body text-[11px] uppercase tracking-wider text-white/40">
            ISRCs (optional)
          </span>
          <input
            value={isrcs}
            onChange={(e) => setIsrcs(e.target.value)}
            placeholder="QZPEW2418835, QZNWW2164732"
            className={inputCls}
          />
          <p className="mt-1.5 font-body text-[11px] leading-relaxed text-white/35">
            Separate with commas. Leave blank if the song is not out yet — you can add them
            later.
          </p>
        </label>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-body text-[11px] uppercase tracking-wider text-white/40">
              Writers
            </span>
            <span
              className={`font-body text-xs tabular-nums ${
                exact ? "text-green-400" : "text-amber-400"
              }`}
            >
              {totalPct}% of 100%
            </span>
          </div>

          <div className="space-y-2.5">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-[#0E0808] p-3">
                <div className="space-y-2.5">
                  <input
                    value={r.name}
                    onChange={(e) => set(i, { name: e.target.value })}
                    placeholder="Writer name"
                    className={inputCls}
                  />
                  <div className="flex gap-2.5">
                    <input
                      value={r.ipi}
                      onChange={(e) => set(i, { ipi: e.target.value })}
                      placeholder="IPI"
                      inputMode="numeric"
                      className={`${inputCls} flex-1`}
                    />
                    <div className="relative w-[104px] shrink-0">
                      <input
                        value={r.share}
                        onChange={(e) => set(i, { share: e.target.value })}
                        placeholder="0"
                        inputMode="decimal"
                        className={`${inputCls} pr-7 text-right`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-white/35">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {rows.length > 1 && (
                  <button
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                    className="mt-2 font-body text-[11px] text-white/35 transition-colors hover:text-[#ff6b68]"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setRows((prev) => [...prev, { name: "", ipi: "", share: "" }])}
            className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/12 font-heading text-[11px] uppercase tracking-widest text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Add a writer
          </button>

          {!exact && filled.length > 0 && (
            <p className="mt-2 font-body text-[11px] leading-relaxed text-amber-400/90">
              {totalPct > 100
                ? `That is ${totalPct - 100}% too much.`
                : `${(100 - totalPct).toFixed(2).replace(/\.?0+$/, "")}% still to assign.`}{" "}
              The publisher rejects anything that is not exactly 100%.
            </p>
          )}
        </div>

        {err && (
          <p className="rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
            {err}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!ready}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Submit split"}
        </button>
      </div>
    </div>
  );
}
