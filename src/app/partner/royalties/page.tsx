"use client";

import { useCallback, useEffect, useState } from "react";
import PartnerLayout from "@/components/partner/PartnerLayout";
import {
  fetchPartnerRoyaltiesByPeriod,
  fetchPartnerRoyaltiesByPlatform,
  fetchPartnerRoyaltySummary,
  type PartnerRoyaltyByPeriod,
  type PartnerRoyaltyByPlatform,
  type PartnerRoyaltySummary,
} from "@/lib/api/partner";

/**
 * Amounts are shown per currency and never combined. `royalty_data` carries a currency per
 * row, so one merged total would be adding naira to dollars — a number that looks
 * authoritative and means nothing.
 */
function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // An unrecognised currency code should not blank the figure out.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function PartnerRoyaltiesPage() {
  const [summary, setSummary] = useState<PartnerRoyaltySummary | null>(null);
  const [platforms, setPlatforms] = useState<PartnerRoyaltyByPlatform | null>(null);
  const [periods, setPeriods] = useState<PartnerRoyaltyByPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [summaryRes, platformRes, periodRes] = await Promise.all([
      fetchPartnerRoyaltySummary(),
      fetchPartnerRoyaltiesByPlatform(),
      fetchPartnerRoyaltiesByPeriod(),
    ]);

    const failure = summaryRes.error ?? platformRes.error ?? periodRes.error;

    if (failure) {
      setError(failure);
      setLoading(false);
      return;
    }

    setError(null);
    setSummary(summaryRes.data);
    setPlatforms(platformRes.data);
    setPeriods(periodRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerLayout pageTitle="Royalties">
      {loading && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl h-56 animate-pulse" />
      )}

      {!loading && error && (
        <div className="bg-[#1A0808] border border-[#C30100]/40 rounded-2xl p-5">
          <p className="font-body text-white text-sm">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 font-heading uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] px-4 py-2 text-white hover:bg-[#C30100] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/*
        "Not reportable" is a distinct state from "earned nothing". It means no assigned
        release carries a UPC or ISRC yet, so there is nothing for the royalty feeds to
        match against — showing a confident 0.00 here would be a lie.
      */}
      {!loading && !error && summary && !summary.reportable && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 sm:p-10 text-center">
          <h2 className="font-heading text-white uppercase text-base sm:text-lg tracking-wide">
            Not yet reportable
          </h2>
          <p className="font-body text-white/50 text-sm mt-2 max-w-md mx-auto">
            None of the releases shared with you carry a UPC or ISRC yet, so royalty
            reporting cannot be matched to them. This is not the same as having earned
            nothing — figures will appear here once identifiers are issued and the first
            statements land.
          </p>
        </div>
      )}

      {!loading && !error && summary?.reportable && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {summary.totals.length === 0 ? (
              <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5">
                <p className="font-heading text-white/40 uppercase text-[11px] tracking-[0.18em]">
                  Earnings
                </p>
                <p className="font-body text-white/50 text-sm mt-2">
                  No statements have landed for these releases yet.
                </p>
              </div>
            ) : (
              summary.totals.map((total) => (
                <div
                  key={total.currency}
                  className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5"
                >
                  <p className="font-heading text-white/40 uppercase text-[11px] tracking-[0.18em]">
                    Earnings ({total.currency})
                  </p>
                  <p className="font-heading text-white text-xl sm:text-2xl mt-1.5">
                    {money(total.amount, total.currency)}
                  </p>
                </div>
              ))
            )}

            <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5">
              <p className="font-heading text-white/40 uppercase text-[11px] tracking-[0.18em]">
                Reported streams
              </p>
              <p className="font-heading text-white text-xl sm:text-2xl mt-1.5">
                {summary.total_streams.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mt-4">
            <h3 className="font-heading text-white uppercase text-sm tracking-[0.18em] mb-4">
              By platform
            </h3>

            {!platforms?.platforms.length ? (
              <p className="font-body text-white/40 text-sm">Nothing reported yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px]">
                  <thead>
                    <tr className="text-left">
                      <th className="font-heading text-white/30 uppercase text-[10px] tracking-[0.2em] pb-3">
                        Platform
                      </th>
                      <th className="font-heading text-white/30 uppercase text-[10px] tracking-[0.2em] pb-3 text-right">
                        Streams
                      </th>
                      <th className="font-heading text-white/30 uppercase text-[10px] tracking-[0.2em] pb-3 text-right">
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.platforms.map((row, i) => (
                      <tr key={`${row.platform}-${row.currency}-${i}`} className="border-t border-white/[0.05]">
                        <td className="font-body text-white text-sm py-3">
                          {row.platform || "Unknown"}
                        </td>
                        <td className="font-body text-white/60 text-sm py-3 text-right">
                          {row.streams.toLocaleString()}
                        </td>
                        <td className="font-body text-white text-sm py-3 text-right whitespace-nowrap">
                          {money(row.amount, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mt-4">
            <h3 className="font-heading text-white uppercase text-sm tracking-[0.18em] mb-4">
              By period
            </h3>

            {!periods?.periods.length ? (
              <p className="font-body text-white/40 text-sm">Nothing reported yet.</p>
            ) : (
              <ul className="flex flex-col">
                {periods.periods.map((row, i) => (
                  <li
                    key={`${row.period}-${row.currency}-${i}`}
                    className="flex items-center justify-between gap-3 py-3 border-b border-white/[0.05] last:border-0"
                  >
                    <span className="font-body text-white text-sm">{row.period || "—"}</span>
                    <span className="font-body text-white/50 text-xs shrink-0">
                      {row.streams.toLocaleString()} streams
                    </span>
                    <span className="font-body text-white text-sm shrink-0 whitespace-nowrap">
                      {money(row.amount, row.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PartnerLayout>
  );
}
