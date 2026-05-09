/**
 * lib/api/earnings.ts
 *
 * Endpoint mapping (from Postman collection):
 *   GET  /withdrawal/royalties/balance
 *   POST /withdrawal/royalties/preview
 *   POST /withdrawal/royalties/send-otp
 *   POST /withdrawal/royalties/verify-and-initiate
 *   GET  /withdrawal/royalties/history
 *   GET  /startbutton/banks/NGN
 *   GET  /startbutton/verify-account
 */

import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */

export interface BalanceData {
  balance_usd: number;
  balance_ngn?: number;
  total_earnings?: number;
  this_month?: number;
  from_releases?: number;
  from_splits?: number;
  [key: string]: unknown;
}

export interface PreviewPayload {
  amount_usd: number;
  target_currency: string;
}

export interface PreviewData {
  amount_usd: number;
  target_currency: string;
  exchange_rate: number;
  converted_amount: number;
  conversion_fee: number;
  transfer_fee: number;
  will_receive: number;
  [key: string]: unknown;
}

export interface SendOtpPayload {
  amount_usd: number;
  target_currency: string;
}

export interface WithdrawPayload {
  otp_code: string;
  amount_usd: number;
  target_currency: string;
  payout_method: "bank_transfer" | "mobile_money";
  // Bank transfer (NGN)
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  country?: string;
  // Mobile money (KES etc)
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

/* ─── API functions ───────────────────────────────────────────── */

export async function getBalance() {
  return request<BalanceData>(
    "/withdrawal/royalties/balance",
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