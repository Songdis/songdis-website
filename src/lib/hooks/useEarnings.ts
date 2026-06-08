/**
 * lib/hooks/useEarnings.ts
 */

import { useState, useEffect, useCallback } from "react";
import {
  getBalance,
  getWithdrawalHistory,
  getBanks,
  previewWithdrawal,
  sendWithdrawalOtp,
  initiateWithdrawal,
  verifyAccount,
  type BalanceData,
  type PreviewData,
  type WithdrawalRecord,
  type Bank,
  type WithdrawPayload,
} from "@/lib/api/earnings";

/* ─── useEarningsBalance ──────────────────────────────────────── */
export function useEarningsBalance() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getBalance();
    if (res.error) {
      setError(res.error);
    } else {
      // API may return balance nested under .data or flat
      const raw = res.data as Record<string, unknown> | null;
      const data = (raw?.data as BalanceData) ?? (raw as BalanceData);
      setBalance(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Map confirmed API fields:
  // data.total_available_usd  → Total Balance
  // data.breakdown.from_my_releases → This Month (best proxy available)
  // data.breakdown.from_my_releases → From Releases
  // data.split_earnings_usd   → From Splits
  const d = balance as Record<string, unknown> | null;
  const breakdown = (d?.breakdown as Record<string, unknown>) ?? {};
  const totalBalance = (d?.total_available_usd ?? d?.balance_usd ?? d?.total_earnings ?? 0) as number;
  const thisMonth    = (d?.this_month ?? breakdown?.this_month ?? 0) as number;
  const fromReleases = (breakdown?.from_my_releases ?? d?.from_releases ?? 0) as number;
  const fromSplits   = (d?.split_earnings_usd ?? breakdown?.from_splits ?? d?.from_splits ?? 0) as number;

  return { balance, totalBalance, thisMonth, fromReleases, fromSplits, isLoading, error, refresh: load };
}

/* ─── useWithdrawalHistory ────────────────────────────────────── */
export function useWithdrawalHistory(pageSize = 10) {
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = 1) => {
    setIsLoading(true);
    const res = await getWithdrawalHistory();
    if (res.error) {
      setError(res.error);
    } else {
      const raw = res.data as Record<string, unknown> | null;
      let list: WithdrawalRecord[] = [];
      let total = 1;

      if (Array.isArray(raw)) {
        list = raw as WithdrawalRecord[];
        total = Math.ceil(list.length / pageSize);
      } else if (Array.isArray(raw?.data)) {
        list = raw.data as WithdrawalRecord[];
        total = Math.ceil(((raw.total as number) ?? list.length) / pageSize);
      }

      setHistory(list.slice((p - 1) * pageSize, p * pageSize));
      setTotalPages(Math.max(1, total));
      setPage(p);
    }
    setIsLoading(false);
  }, [pageSize]);

  useEffect(() => { load(1); }, [load]);

  const goToPage = (p: number) => { if (p >= 1 && p <= totalPages) load(p); };

  return { history, isLoading, error, refresh: () => load(page), page, totalPages, goToPage };
}

/* ─── useBanks ────────────────────────────────────────────────── */
export function useBanks(currency = "NGN") {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getBanks(currency);
    if (!res.error) {
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as unknown as Record<string, unknown>)?.data)
        ? ((raw as unknown as Record<string, unknown>).data as Bank[])
        : [];
      setBanks(list);
    }
    setIsLoading(false);
  }, [currency]);

  useEffect(() => { load(); }, [load]);

  return { banks, isLoading };
}

/* ─── useWithdrawal — full withdrawal flow ────────────────────── */
export function useWithdrawal() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [accountName, setAccountName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchPreview = useCallback(async (amountUsd: number, targetCurrency: string) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    const res = await previewWithdrawal({ amount_usd: amountUsd, target_currency: targetCurrency });
    if (res.error) {
      setPreviewError(res.error);
    } else {
      const raw = res.data as Record<string, unknown> | null;
      setPreview((raw?.data as PreviewData) ?? (raw as PreviewData));
    }
    setIsLoadingPreview(false);
  }, []);

  const fetchOtp = useCallback(async (
    amountUsd: number,
    targetCurrency: string,
    onSuccess?: () => void
  ) => {
    setIsLoadingOtp(true);
    setOtpError(null);
    const res = await sendWithdrawalOtp({ amount_usd: amountUsd, target_currency: targetCurrency });
    if (res.error) {
      setOtpError(res.error);
    } else {
      onSuccess?.();
    }
    setIsLoadingOtp(false);
  }, []);

  const withdraw = useCallback(async (
    payload: WithdrawPayload,
    onSuccess?: () => void
  ) => {
    setIsLoadingWithdraw(true);
    setWithdrawError(null);
    const res = await initiateWithdrawal(payload);
    if (res.error) {
      setWithdrawError(res.error);
    } else {
      onSuccess?.();
    }
    setIsLoadingWithdraw(false);
  }, []);

  const verifyBankAccount = useCallback(async (
    bankCode: string,
    accountNumber: string
  ) => {
    if (accountNumber.length < 10) return;
    setIsVerifying(true);
    setAccountName(null);
    const res = await verifyAccount(bankCode, accountNumber);
    if (!res.error && res.data) {
      const raw = res.data as Record<string, unknown>;
      const name = (raw?.account_name ?? (raw?.data as Record<string,unknown>)?.account_name ?? "") as string;
      setAccountName(name);
    }
    setIsVerifying(false);
  }, []);

  return {
    preview, fetchPreview, isLoadingPreview, previewError,
    fetchOtp, isLoadingOtp, otpError,
    withdraw, isLoadingWithdraw, withdrawError,
    accountName, verifyBankAccount, isVerifying,
  };
}