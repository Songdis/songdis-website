import { request } from "./core";

export interface PayoutAccount {
  id: number;
  bank_name: string | null;
  bank_code: string;
  account_number: string;
  account_name: string;
  account_type: "personal" | "business";
  status: "active" | "pending_review" | "replaced" | "rejected";
  currency: string;
  added_on: string | null;
}

export interface PayoutStatus {
  identity_verified: boolean;
  verified_name: string | null;
  verified_on: string | null;
  account: PayoutAccount | null;
  pending_review: PayoutAccount | null;
  enforced: boolean;
  can_withdraw: boolean;
  provider_ready: boolean;
}

export async function getPayoutStatus() {
  return request<PayoutStatus>("/withdrawal/payout/status", { method: "GET" }, true);
}


export async function verifyIdentity(payload: {
  document_front: string;
  document_back?: string;
}) {
  return request<{ verified_name: string; document_type: string }>(
    "/withdrawal/payout/verify-identity",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}


/**
 * Changing an account does not apply it — the server holds it and emails a code.
 * A first-time add still returns the saved account directly, so callers have to look at
 * `otp_required` rather than assuming success means "done".
 */
export interface PayoutOtpChallenge {
  otp_required: true;
  /** Seconds until the staged change is dropped. */
  expires_in: number;
  /** Masked, for "we sent a code to ob••@…" — never the full address. */
  sent_to: string;
  account_preview: {
    account_name: string;
    bank_name: string;
    account_number_masked: string;
  };
}

export function isOtpChallenge(
  data: PayoutAccount | PayoutOtpChallenge | null
): data is PayoutOtpChallenge {
  return Boolean(data && (data as PayoutOtpChallenge).otp_required);
}

export async function savePayoutAccount(payload: {
  bank_code: string;
  bank_name?: string;
  account_number: string;
  account_type?: "personal" | "business";
  selfie?: string;
  document_front?: string;
}) {
  return request<PayoutAccount | PayoutOtpChallenge>(
    "/withdrawal/payout/account",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}


export async function confirmPayoutAccountChange(otpCode: string) {
  return request<PayoutAccount>(
    "/withdrawal/payout/account/confirm",
    { method: "POST", body: JSON.stringify({ otp_code: otpCode }) },
    true
  );
}
