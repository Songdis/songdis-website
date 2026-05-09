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

  // Derived display values
  const totalBalance   = balance?.balance_usd ?? balance?.total_earnings ?? 0;
  const thisMonth      = balance?.this_month ?? 0;
  const fromReleases   = balance?.from_releases ?? 0;
  const fromSplits     = balance?.from_splits ?? 0;

  return { balance, totalBalance, thisMonth, fromReleases, fromSplits, isLoading, error, refresh: load };
}

/* ─── useWithdrawalHistory ────────────────────────────────────── */
export function useWithdrawalHistory() {
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getWithdrawalHistory();
    if (res.error) {
      setError(res.error);
    } else {
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as unknown as Record<string, unknown>)?.data)
        ? ((raw as unknown as Record<string, unknown>).data as WithdrawalRecord[])
        : [];
      setHistory(list);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { history, isLoading, error, refresh: load };
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