"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  enableCoSign,
  getCoSign,
  getCoSignLedger,
  getCoSignPayouts,
  normaliseCoSignBalance,
  normaliseCoSignState,
  normaliseLedger,
  normalisePayouts,
  requestCoSignPayout,
  type CoSignBalance,
  type CoSignEnableRequest,
  type CoSignLedgerEntry,
  type CoSignPayoutRecord,
  type CoSignState,
} from "@/lib/api/co-sign";
import { getPayoutStatus, type PayoutAccount } from "@/lib/api/payout";

export interface CoSignFailure {
  error: string | null;
  /** The Laravel field map — the only place per-field validation messages live. */
  errors: Record<string, string[]> | null;
  status: number;
}

export interface UseCoSign {
  state: CoSignState | null;
  balance: CoSignBalance | null;
  ledger: CoSignLedgerEntry[];
  payouts: CoSignPayoutRecord[];
  /** The verified bank account a payout would land in. Managed under Earnings. */
  payoutAccount: PayoutAccount | null;

  isLoading: boolean;
  loadFailure: CoSignFailure | null;

  isEnabling: boolean;
  enableFailure: CoSignFailure | null;
  enable: (details: CoSignEnableRequest) => Promise<boolean>;

  isRequestingPayout: boolean;
  payoutFailure: CoSignFailure | null;
  requestPayout: (amountKobo: number) => Promise<boolean>;

  reload: () => void;
}

const LEDGER_PAGE_SIZE = 8;

export function useCoSign(profileId: number): UseCoSign {
  const [state, setState] = useState<CoSignState | null>(null);
  const [balance, setBalance] = useState<CoSignBalance | null>(null);
  const [ledger, setLedger] = useState<CoSignLedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<CoSignPayoutRecord[]>([]);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);

  const [loadFailure, setLoadFailure] = useState<CoSignFailure | null>(null);

  const [isEnabling, setIsEnabling] = useState(false);
  const [enableFailure, setEnableFailure] = useState<CoSignFailure | null>(null);

  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutFailure, setPayoutFailure] = useState<CoSignFailure | null>(null);

  const [nonce, setNonce] = useState(0);

  /**
   * Loading is DERIVED, not a flag set at the top of the effect.
   *
   * `loadedKey` records which (profile, attempt) pair the state above actually belongs
   * to, so "we have not finished loading this one yet" is a comparison rather than a
   * synchronous setState inside the effect — which would cascade a second render on
   * every mount and every reload.
   */
  const loadKey = `${profileId}:${nonce}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = loadedKey !== loadKey;

  /* Every async write checks this before setting state — switching artist in the
     header unmounts this hook, and a late response must not repaint the new one. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Read the status endpoint alone. Used on load and after a failed enable. */
  const readState = useCallback(async (): Promise<CoSignState | null> => {
    const res = await getCoSign(profileId);
    if (!res.data) {
      if (alive.current) {
        setLoadFailure({ error: res.error, errors: res.errors ?? null, status: res.status });
      }
      return null;
    }
    const next = normaliseCoSignState(res.data);
    if (alive.current) {
      setState(next);
      setBalance(normaliseCoSignBalance(res.data));
      setLoadFailure(null);
    }
    return next;
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const next = await readState();

      // The ledger, the payout history and the destination account are only
      // meaningful once an account exists. Fetching them for an artist who has not
      // opted in would be three requests to render nothing.
      if (next?.enabled) {
        const [ledgerRes, payoutsRes, destination] = await Promise.all([
          getCoSignLedger(profileId, LEDGER_PAGE_SIZE),
          getCoSignPayouts(profileId),
          getPayoutStatus(),
        ]);

        if (!cancelled && alive.current) {
          if (ledgerRes.data) {
            setLedger(normaliseLedger(ledgerRes.data));
            // The ledger response carries its own balance; it is the fresher of the two.
            setBalance(normaliseCoSignBalance(ledgerRes.data));
          }
          if (payoutsRes.data) setPayouts(normalisePayouts(payoutsRes.data));
          setPayoutAccount(destination.data?.account ?? null);
        }
      } else if (!cancelled && alive.current) {
        setLedger([]);
        setPayouts([]);
        setPayoutAccount(null);
      }

      if (!cancelled && alive.current) setLoadedKey(loadKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, loadKey, readState]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);


  const enable = useCallback(
    async (details: CoSignEnableRequest): Promise<boolean> => {
      setIsEnabling(true);
      setEnableFailure(null);

      const res = await enableCoSign(profileId, details);

   
      if (res.status === 503) {
        if (alive.current) {
          setEnableFailure({
            error:
              "Co-sign is not switched on for Songdis yet. Nothing was sent and no " +
              "account was created — your details were not stored.",
            errors: null,
            status: 503,
          });
          setIsEnabling(false);
        }
        return false;
      }

      if (!res.data) {
        let failure: CoSignFailure = {
          error: res.error,
          errors: res.errors ?? null,
          status: res.status,
        };

        if (!res.errors || Object.keys(res.errors).length === 0) {
          const fresh = await readState();
          if (fresh?.message) failure = { ...failure, error: fresh.message };
        }

        if (alive.current) {
          setEnableFailure(failure);
          setIsEnabling(false);
        }
        return false;
      }

      const next = normaliseCoSignState(res.data);

      if (alive.current) {
        setState(next);
        setIsEnabling(false);
      }

      if (!next.enabled) {
        // 200 but no usable account — treat it as the failure it is rather than
        // showing an "all set" screen with no account number on it.
        if (alive.current) {
          setEnableFailure({
            error:
              next.message ??
              "Your account was not issued. Nothing has been charged — try again in a moment.",
            errors: null,
            status: res.status,
          });
        }
        return false;
      }

      reload();
      return true;
    },
    [profileId, readState, reload]
  );

  /* ─── Request a payout (CS5 — requests, never sends) ────────── */

  const requestPayout = useCallback(
    async (amountKobo: number): Promise<boolean> => {
      if (!payoutAccount) {
        setPayoutFailure({
          error:
            "Add a verified bank account under Earnings first — that is where a co-sign payout lands.",
          errors: null,
          status: 0,
        });
        return false;
      }

      setIsRequestingPayout(true);
      setPayoutFailure(null);

      const res = await requestCoSignPayout(profileId, amountKobo, payoutAccount.id);

      if (!res.data) {
        if (alive.current) {
          setPayoutFailure({
            error: res.error,
            errors: res.errors ?? null,
            status: res.status,
          });
          setIsRequestingPayout(false);
        }
        return false;
      }

      if (alive.current) {
        setBalance(normaliseCoSignBalance(res.data));
        setIsRequestingPayout(false);
      }
      reload();
      return true;
    },
    [payoutAccount, profileId, reload]
  );

  return useMemo(
    () => ({
      state,
      balance,
      ledger,
      payouts,
      payoutAccount,
      isLoading,
      loadFailure,
      isEnabling,
      enableFailure,
      enable,
      isRequestingPayout,
      payoutFailure,
      requestPayout,
      reload,
    }),
    [
      state,
      balance,
      ledger,
      payouts,
      payoutAccount,
      isLoading,
      loadFailure,
      isEnabling,
      enableFailure,
      enable,
      isRequestingPayout,
      payoutFailure,
      requestPayout,
      reload,
    ]
  );
}
