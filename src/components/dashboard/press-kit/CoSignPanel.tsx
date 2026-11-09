"use client";

import { useCallback, useState } from "react";
import {
  ArrowDownToLine,
  BadgeCheck,
  Copy,
  Loader2,
} from "lucide-react";

import {
  disableCoSign,
  describePayoutStatus,
  formatNaira,
  type CoSignLedgerEntry,
  type CoSignPayoutRecord,
} from "@/lib/api/co-sign";
import { useCoSign } from "@/lib/hooks/useCoSign";
import { CoSignPayoutSheet } from "./CoSignPayoutSheet";
import {
  FailureNotice,
  Notice,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Shimmer,
  Toaster,
  useToast,
} from "./primitives";
import { ACCENT_TEXT } from "./theme";

interface Props {
  profileId: number;
  artistName: string;
  /**
   * Render without the panel chrome. Used when the panel is embedded as the body of the
   * "Co-sign" row in the section order — that row already supplies the card, so an extra
   * bordered box (and a second "Co-sign" heading) would be noise.
   */
  bare?: boolean;
}


function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}


export function CoSignPanel({ profileId, artistName, bare = false }: Props) {
  const cs = useCoSign(profileId);
  const { toast, show } = useToast();

  const [payoutOpen, setPayoutOpen] = useState(false);

  const account = cs.state?.account ?? null;
  const accountNumber = account?.account_number ?? null;

  const copyNumber = useCallback(async () => {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      show("Account number copied");
    } catch {
      show("Could not copy — select the number instead", "bad");
    }
  }, [accountNumber, show]);

  const onEnable = useCallback(async () => {
    const ok = await cs.enable();
    if (ok) show("Co-sign is on. Fans can back you from your press kit");
    else show("Couldn't turn Co-sign on. Please try again", "bad");
    return ok;
  }, [cs, show]);

  const [turningOff, setTurningOff] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const onDisable = useCallback(async () => {
    setTurningOff(true);
    const res = await disableCoSign(profileId);
    setTurningOff(false);
    setConfirmOff(false);
    if (res.error) {
      show("Couldn't turn Co-sign off. Please try again", "bad");
      return;
    }
    show("Co-sign is off. It's no longer on your press kit");
    cs.reload();
  }, [profileId, cs, show]);

  const onRequestPayout = useCallback(
    async (amountKobo: number) => {
      const ok = await cs.requestPayout(amountKobo);
      if (ok) show(`${formatNaira(amountKobo)} payout requested`);
      return ok;
    },
    [cs, show]
  );

  if (cs.isLoading) {
    return (
      <Shell bare={bare}>
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-20 w-full" />
      </Shell>
    );
  }

  if (cs.loadFailure?.status === 404) {
    return (
      <Shell bare={bare}>
        <SectionHeading bare>Co-sign</SectionHeading>
        <p className="font-body text-white/45 text-xs leading-relaxed">
          Co-sign belongs to the artist who owns this profile. You can see their press
          kit, but their fan payments are not yours to set up.
        </p>
      </Shell>
    );
  }

  if (cs.loadFailure) {
    return (
      <Shell bare={bare}>
        <SectionHeading bare>Co-sign</SectionHeading>
        <FailureNotice
          title="Could not load co-sign"
          error={cs.loadFailure.error}
          errors={cs.loadFailure.errors}
          onRetry={cs.reload}
        />
      </Shell>
    );
  }

  if (cs.state && !cs.state.configured) {
    return (
      <Shell bare={bare}>
        <SectionHeading bare>Co-sign</SectionHeading>
        <p className="font-body text-white/45 text-xs leading-relaxed">
          Fan payments are not switched on for Songdis yet. When they are, you will be
          able to open a naira account here and take co-signs straight from your press
          kit.
        </p>
      </Shell>
    );
  }

  const isActive = Boolean(cs.state?.enabled && account);

  return (
    <>
      <Shell bare={bare}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 min-w-0">
            <SectionHeading bare>Co-sign</SectionHeading>
            <p className="font-body text-white/40 text-[11px] leading-relaxed">
              {isActive
                ? "Fans back you from your press kit, by card or bank transfer."
                : "Let fans back you with money, right from your press kit."}
            </p>
          </div>
          {isActive && (
            <span
              className="font-body text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border shrink-0 flex items-center gap-1.5"
              style={{
                color: "#0ca30c",
                borderColor: "#0ca30c55",
                backgroundColor: "rgba(12,163,12,0.1)",
              }}
            >
              <BadgeCheck size={10} aria-hidden />
              On
            </span>
          )}
        </div>

        {isActive && account ? (
          <>
            <ActiveCoSign
              account={account}
              cs={cs}
              onCopy={() => void copyNumber()}
              onPayout={() => setPayoutOpen(true)}
            />
            <div className="mt-4 border-t border-white/[0.06] pt-3.5">
              {confirmOff ? (
                <div className="flex flex-wrap items-center gap-3 animate-[cs-in_200ms_ease-out]">
                  <span className="font-body text-white/60 text-[12px]">Take Co-sign off your press kit? Your balance stays.</span>
                  <button
                    type="button"
                    onClick={() => void onDisable()}
                    disabled={turningOff}
                    className="font-body text-[12px] font-semibold text-[#ff6b6b] hover:text-[#ff8b8b] disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {turningOff && <Loader2 size={12} className="animate-spin" aria-hidden />}
                    {turningOff ? "Turning off…" : "Turn off"}
                  </button>
                  <button type="button" onClick={() => setConfirmOff(false)} disabled={turningOff} className="font-body text-[12px] text-white/45 hover:text-white">
                    Keep it on
                  </button>
                  <style>{`@keyframes cs-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmOff(true)} className="font-body text-[12px] text-white/40 hover:text-white/70 underline underline-offset-4 decoration-white/20">
                  Turn off co-sign
                </button>
              )}
            </div>
          </>
        ) : (
          <NotYetOn
            artistName={artistName}
            busy={cs.isEnabling}
            wasTurnedOff={cs.state?.status === "disabled"}
            onStart={() => void onEnable()}
          />
        )}
      </Shell>


      {payoutOpen && (
        <CoSignPayoutSheet
          onClose={() => setPayoutOpen(false)}
          availableKobo={cs.balance?.available_kobo ?? 0}
          destination={cs.payoutAccount}
          busy={cs.isRequestingPayout}
          failure={cs.payoutFailure}
          onSubmit={onRequestPayout}
        />
      )}

      <Toaster toast={toast} />
    </>
  );
}

function SectionHeading({
  children,
  bare = false,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  if (bare) return null;
  return (
    <h2 className="font-heading text-white uppercase text-sm tracking-wide">{children}</h2>
  );
}

/**
 * The panel chrome, or nothing when `bare`. `bare` mode is used inside the section-order
 * row, which already provides the card and the "Co-sign" label — so the heading is
 * dropped there and only the substantive content is shown.
 */
function Shell({ bare, children }: { bare: boolean; children: React.ReactNode }) {
  if (bare) {
    return <div className="flex flex-col gap-4">{children}</div>;
  }
  return (
    <Panel>
      <div className="p-4 sm:p-5 flex flex-col gap-4">{children}</div>
    </Panel>
  );
}


function NotYetOn({
  artistName,
  busy,
  wasTurnedOff,
  onStart,
}: {
  artistName: string;
  busy: boolean;
  wasTurnedOff: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {wasTurnedOff && (
        <p className="font-body text-white/80 text-[13px] font-semibold">Co-sign is off. Fans can&apos;t co-sign you right now.</p>
      )}
      <p className="font-body text-white/60 text-[12.5px] leading-relaxed">
        Your press kit gets a Co-sign button. Fans choose an amount and pay by card or bank
        transfer on a secure page, and it lands in your balance here, ready to pay out.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={onStart} disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" aria-hidden />
              Turning on…
            </span>
          ) : (
            wasTurnedOff ? "Turn co-sign back on" : "Turn on co-sign"
          )}
        </PrimaryButton>
        <span className="font-body text-white/30 text-[11px]">
          One tap · no BVN · {artistName} keeps everything sent
        </span>
      </div>
    </div>
  );
}


function ActiveCoSign({
  account,
  cs,
  onCopy,
  onPayout,
}: {
  account: NonNullable<ReturnType<typeof useCoSign>["state"]>["account"];
  cs: ReturnType<typeof useCoSign>;
  onCopy: () => void;
  onPayout: () => void;
}) {
  if (!account) return null;

  const balance = cs.balance;
  const available = balance?.available_kobo ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {account.provider === "bachs" || !account.account_number ? (
        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40 mb-1.5">How fans co-sign</p>
          <p className="font-body text-white/75 text-[13px] leading-relaxed">
            The Co-sign button on your press kit. Fans pick an amount and pay by card or bank transfer.
          </p>
        </div>
      ) : (
      /* An older personal account — still receives transfers. */
      <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40 mb-1.5">
          Your co-sign account
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-white text-[22px] tracking-[0.06em] select-all">
            {account.account_number}
          </span>
          <SecondaryButton onClick={onCopy}>
            <Copy size={13} aria-hidden />
            Copy
          </SecondaryButton>
        </div>
        <p className="font-body text-white/45 text-xs mt-1.5">
          {[account.bank_name, account.account_name].filter(Boolean).join(" · ") ||
            "Details pending from your bank"}
        </p>
      </div>
      )}

      <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden bg-white/[0.06] sm:grid-cols-4">
        <Figure label="Available" value={formatNaira(available)} strong />
        <Figure label="Co-signs" value={(balance?.cosign_count ?? 0).toLocaleString("en-NG")} />
        <Figure label="Awaiting payout" value={formatNaira(balance?.reserved_kobo ?? 0)} />
        <Figure label="Paid out" value={formatNaira(balance?.settled_out_kobo ?? 0)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={onPayout} disabled={available <= 0 || cs.isRequestingPayout}>
          {cs.isRequestingPayout ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" aria-hidden />
              Requesting…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <ArrowDownToLine size={12} aria-hidden />
              Request payout
            </span>
          )}
        </PrimaryButton>
        {available <= 0 && (
          <span className="font-body text-white/30 text-[11px]">
            Nothing to pay out yet.
          </span>
        )}
      </div>

      {cs.payoutFailure && (
        <FailureNotice
          title="Your payout was not requested"
          error={cs.payoutFailure.error}
          errors={cs.payoutFailure.errors}
        />
      )}

      <RecentCoSigns items={cs.ledger} />
      <RecentPayouts items={cs.payouts} />
    </div>
  );
}

function Figure({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="bg-[#180F0F] px-3.5 py-3">
      <p className="font-body text-[10px] uppercase tracking-[0.1em] text-white/35">{label}</p>
      <p
        className={`font-heading mt-1 tabular-nums ${
          strong ? "text-white text-[17px]" : "text-white/75 text-[14px]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}


function RecentCoSigns({ items }: { items: CoSignLedgerEntry[] }) {
  if (items.length === 0) {
    return (
      <Notice>
        No co-signs yet. Share your press kit — the account number is already on it.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40">
        Recent co-signs
      </h3>
      <ul className="flex flex-col divide-y divide-white/[0.05]">
        {items.map((entry) => {
          const when = formatWhen(entry.occurred_at);
          return (
            <li key={entry.id} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1 min-w-0">
                <span className="font-body text-white text-[13px] block truncate">
                  {entry.sender_name ?? "Transfer"}
                </span>
                <span className="font-body text-white/30 text-[11px] block truncate">
                  {[entry.sender_bank, when].filter(Boolean).join(" · ") || "—"}
                </span>
              </span>
              <span className="font-heading text-white text-[13px] tabular-nums shrink-0">
                {formatNaira(entry.amount_kobo)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecentPayouts({ items }: { items: CoSignPayoutRecord[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40">
        Payouts
      </h3>
      <ul className="flex flex-col divide-y divide-white/[0.05]">
        {items.slice(0, 5).map((p) => {
          const when = formatWhen(p.settled_at ?? p.requested_at);
          return (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1 min-w-0">
                <span className="font-body text-white text-[13px] block">
                  {formatNaira(p.amount_kobo)}
                </span>
                <span
                  className="font-body text-[11px] block truncate"
                  style={{ color: p.status === "failed" ? ACCENT_TEXT : "rgba(255,255,255,0.3)" }}
                >
                  {describePayoutStatus(p.status)}
                  {when ? ` · ${when}` : ""}
                </span>
              </span>
              {p.failure_reason && (
                <span className="font-body text-white/35 text-[11px] max-w-[45%] text-right">
                  {p.failure_reason}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
