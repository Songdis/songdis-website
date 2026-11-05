import { request, type ApiResponse } from "./core";


export const WITHDRAWALS_PAUSED_STATUS = 423;

export const WITHDRAWALS_PAUSED_FALLBACK =
  "Withdrawals are paused for a short while. Your balance is safe and nothing has been lost.";

export interface WithdrawalPauseState {
  withdrawals_paused?: boolean;
  withdrawals_paused_message?: string | null;
}

/** Money owed from outside SongDis, e.g. a previous distributor. Shown, not withdrawable. */
export interface OutstandingEarning {
  id: number;
  label: string;
  description: string | null;
  amount_usd: number;
}

export interface BalanceData extends WithdrawalPauseState {
  outstanding?: OutstandingEarning[];
  balance_usd: number;
  balance_ngn?: number;
  total_earnings?: number;
  this_month?: number;
  from_releases?: number;
  from_splits?: number;
  [key: string]: unknown;
}


export function withdrawalPauseMessage(
  res: ApiResponse<unknown>
): string | null {
  if (res.status !== WITHDRAWALS_PAUSED_STATUS) return null;
  const message = (res.error ?? "").trim();
  return message !== "" ? message : WITHDRAWALS_PAUSED_FALLBACK;
}

export function pauseFromBalance(
  data: WithdrawalPauseState | null | undefined
): string | null {
  if (!data?.withdrawals_paused) return null;
  const message = (data.withdrawals_paused_message ?? "").trim();
  return message !== "" ? message : WITHDRAWALS_PAUSED_FALLBACK;
}

export interface PreviewPayload {
  amount_usd: number;
  target_currency: string;
}


export interface PreviewData {
  quote_reference: string;
  expires_at: string;
  expires_in_seconds: number;

  amount_usd: number;
  target_currency: string;
  exchange_rate: number;
  conversion_fee_usd: number;
  conversion_fee_percentage: number;
  amount_after_fee_usd: number;
  estimated_amount: number;
  transfer_fee_local: number;
  transfer_fee_base: number;
  transfer_fee_vat: number;
  transfer_fee_vat_rate: number;
  transfer_fee_currency: string;
  estimated_amount_after_transfer_fee: number;

  available_balance: number;
  minimum_withdrawal_usd?: number;
  [key: string]: unknown;
}

export interface WithdrawalConfig {
  currency: string;
  conversion_fee_percentage: number;
  min_withdrawal_usd: number;
  transfer_fee: {
    currency: string;
    base: number;
    vat_percent: number;
    vat: number;
    total: number;
  };
  exchange_rate: number | null;
  exchange_rate_updated_at: string | null;
  quote_ttl_minutes: number;
  payout_methods: string[];
}

export interface SendOtpPayload {
  amount_usd: number;
  target_currency: string;
  quote_reference?: string;
}

export interface WithdrawPayload {
  otp_code: string;
  amount_usd: number;
  target_currency: string;
  quote_reference?: string;
  payout_method: "bank_transfer" | "mobile_money";
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  country?: string;
  mno?: string;
  msisdn?: string;
}

export interface WithdrawalRecord {
  id: number;
  amount_usd: number;
  target_currency: string;
  converted_amount: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface Bank {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface VerifiedAccount {
  account_name: string;
  account_number: string;
  bank_name?: string;
  [key: string]: unknown;
}


export async function getBalance() {
  return request<BalanceData>(
    "/withdrawal/royalties/balance",
    { method: "GET" },
    true
  );
}

export async function getWithdrawalConfig() {
  return request<WithdrawalConfig>(
    "/withdrawal/config",
    { method: "GET" },
    true
  );
}

export async function previewWithdrawal(payload: PreviewPayload) {
  return request<PreviewData>(
    "/withdrawal/royalties/preview",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function sendWithdrawalOtp(payload: SendOtpPayload) {
  return request<{ message: string }>(
    "/withdrawal/royalties/send-otp",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function initiateWithdrawal(payload: WithdrawPayload) {
  return request<{ message: string; reference?: string }>(
    "/withdrawal/royalties/verify-and-initiate",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getWithdrawalHistory() {
  return request<WithdrawalRecord[]>(
    "/withdrawal/royalties/history",
    { method: "GET" },
    true
  );
}

export async function getBanks(currency = "NGN") {
  return request<Bank[]>(
    `/startbutton/banks/${currency}`,
    { method: "GET" },
    true
  );
}

export async function verifyAccount(
  bankCode: string,
  accountNumber: string,
  countryCode = "NGN"
) {
  const qs = new URLSearchParams({ bankCode, accountNumber, countryCode });
  return request<VerifiedAccount>(
    `/startbutton/verify-account?${qs}`,
    { method: "GET" },
    true
  );
}