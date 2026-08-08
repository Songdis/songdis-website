import { request, type ApiResponse } from "./core";


export const KOBO_PER_NAIRA = 100;


export function formatNaira(kobo: number, options: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = options;
  const safe = Number.isFinite(kobo) ? Math.trunc(kobo) : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);

  const naira = Math.trunc(abs / KOBO_PER_NAIRA);
  const minor = abs % KOBO_PER_NAIRA;

  const whole = naira.toLocaleString("en-NG");
  const body = minor === 0 ? whole : `${whole}.${String(minor).padStart(2, "0")}`;

  return `${negative ? "-" : ""}${withSymbol ? "₦" : ""}${body}`;
}


export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "").trim();
  if (cleaned === "") return null;

  const m = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!m) return null;

  const whole = m[1] ?? "";
  const frac = (m[2] ?? "").slice(0, 2).padEnd(2, "0");
  if (whole === "" && (m[2] ?? "") === "") return null;

  const kobo = Number(whole || "0") * KOBO_PER_NAIRA + Number(frac);
  return Number.isSafeInteger(kobo) ? kobo : null;
}


export const CO_SIGN_PRESETS_KOBO: readonly number[] = [
  500 * KOBO_PER_NAIRA,
  1_000 * KOBO_PER_NAIRA,
  2_000 * KOBO_PER_NAIRA,
  5_000 * KOBO_PER_NAIRA,
];

export const CO_SIGN_DEFAULT_KOBO = CO_SIGN_PRESETS_KOBO[1];



export interface PublicCoSignEntry {
  sender_name: string;
  amount_kobo: number;
  occurred_at: string | null;
}

export type PublicCoSign =
  | { enabled: false }
  | {
      enabled: true;
      bank_name: string | null;
      account_number: string;
      account_name: string | null;
      count: number;
      total_kobo: number;
      recent: PublicCoSignEntry[];
    };

export const CO_SIGN_DISABLED: PublicCoSign = { enabled: false };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function kobo(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    return Number.isSafeInteger(n) ? n : 0;
  }
  return 0;
}

function count(value: unknown): number {
  const n = kobo(value);
  return n > 0 ? n : 0;
}

export function normalisePublicCoSign(raw: unknown): PublicCoSign {
  const box = asRecord(asRecord(raw).cosign);
  if (box.enabled !== true) return CO_SIGN_DISABLED;

  const accountNumber = str(box.account_number);
  if (!accountNumber) return CO_SIGN_DISABLED;

  const recent: PublicCoSignEntry[] = (Array.isArray(box.recent) ? box.recent : []).flatMap(
    (entry) => {
      const e = asRecord(entry);
      const name = str(e.sender_name);
      // CS4 — no name, no row. Never a placeholder, never "Anonymous".
      if (!name) return [];
      return [
        { sender_name: name, amount_kobo: kobo(e.amount_kobo), occurred_at: str(e.occurred_at) },
      ];
    }
  );

  return {
    enabled: true,
    bank_name: str(box.bank_name),
    account_number: accountNumber,
    account_name: str(box.account_name),
    count: count(box.count),
    total_kobo: count(box.total_kobo),
    recent,
  };
}


export type CoSignAccountStatus =
  | "pending_kyc"
  | "pending_account"
  | "active"
  | "failed"
  | "not_configured"
  | "not_started";

export type CoSignKycStage = "not_started" | "needs_identity" | "needs_account" | "ready";

export interface CoSignAccount {
  status: string;
  kyc_stage: CoSignKycStage;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  currency: string;
  failure_reason: string | null;
  issued_at: string | null;
}

export interface CoSignState {
  configured: boolean;
  enabled: boolean;
  status: CoSignAccountStatus;
  kyc_stage: CoSignKycStage;
  account: CoSignAccount | null;
  message: string | null;
}

export interface CoSignBalance {
  credited_kobo: number;
  reserved_kobo: number;
  settled_out_kobo: number;
  available_kobo: number;
  cosign_count: number;
  currency: string;
}

/** `CoSign::toOwnerPayload()`. */
export interface CoSignLedgerEntry {
  id: number;
  amount_kobo: number;
  currency: string;
  sender_name: string | null;
  sender_bank: string | null;
  occurred_at: string | null;
}

export type CoSignPayoutStatus =
  | "requested"
  | "approved"
  | "sent"
  | "settled"
  | "failed";

/** `CoSignPayout::toOwnerPayload()`. */
export interface CoSignPayoutRecord {
  id: number;
  amount_kobo: number;
  status: CoSignPayoutStatus;
  failure_reason: string | null;
  reference: string | null;
  requested_at: string | null;
  approved_at: string | null;
  settled_at: string | null;
}


export interface CoSignEnableRequest {
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  bvn: string;
  phone_country_code: string;
  phone_number: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}


const KYC_STAGES: readonly CoSignKycStage[] = [
  "not_started",
  "needs_identity",
  "needs_account",
  "ready",
];

function kycStage(value: unknown): CoSignKycStage {
  const s = str(value);
  return KYC_STAGES.find((k) => k === s) ?? "not_started";
}

function accountStatus(value: unknown): CoSignAccountStatus {
  const s = str(value);
  const known: CoSignAccountStatus[] = [
    "pending_kyc",
    "pending_account",
    "active",
    "failed",
    "not_configured",
    "not_started",
  ];
  return known.find((k) => k === s) ?? "not_started";
}

function normaliseAccount(raw: unknown): CoSignAccount | null {
  const a = asRecord(raw);
  const number = str(a.account_number);
  if (!number) return null;
  return {
    status: str(a.status) ?? "active",
    kyc_stage: kycStage(a.kyc_stage),
    bank_name: str(a.bank_name),
    account_number: number,
    account_name: str(a.account_name),
    currency: str(a.currency) ?? "NGN",
    failure_reason: str(a.failure_reason),
    issued_at: str(a.issued_at),
  };
}

export function normaliseCoSignState(raw: unknown): CoSignState {
  const root = asRecord(raw);
  const box = Object.keys(asRecord(root.cosign)).length > 0 ? asRecord(root.cosign) : root;
  const account = normaliseAccount(box.account);

  return {
    configured: box.configured !== false,
    enabled: box.enabled === true && account !== null,
    status: accountStatus(box.status),
    kyc_stage: kycStage(box.kyc_stage),
    account,
    message: str(box.message),
  };
}

export function normaliseCoSignBalance(raw: unknown): CoSignBalance {
  const root = asRecord(raw);
  const b = Object.keys(asRecord(root.balance)).length > 0 ? asRecord(root.balance) : root;
  return {
    credited_kobo: count(b.credited_kobo),
    reserved_kobo: count(b.reserved_kobo),
    settled_out_kobo: count(b.settled_out_kobo),
    available_kobo: count(b.available_kobo),
    cosign_count: count(b.cosign_count),
    currency: str(b.currency) ?? "NGN",
  };
}

export function normaliseLedger(raw: unknown): CoSignLedgerEntry[] {
  const items = asRecord(raw).items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((entry, i) => {
    const e = asRecord(entry);
    const id = Number(e.id ?? -1 - i);
    return [
      {
        id: Number.isFinite(id) ? id : -1 - i,
        amount_kobo: kobo(e.amount_kobo),
        currency: str(e.currency) ?? "NGN",
        // CS4 — stays null. The UI reads correctly without it.
        sender_name: str(e.sender_name),
        sender_bank: str(e.sender_bank),
        occurred_at: str(e.occurred_at),
      },
    ];
  });
}

function payoutStatus(value: unknown): CoSignPayoutStatus {
  const s = str(value);
  const known: CoSignPayoutStatus[] = ["requested", "approved", "sent", "settled", "failed"];
  return known.find((k) => k === s) ?? "requested";
}

function normalisePayout(raw: unknown, fallbackId: number): CoSignPayoutRecord {
  const p = asRecord(raw);
  const id = Number(p.id ?? fallbackId);
  return {
    id: Number.isFinite(id) ? id : fallbackId,
    amount_kobo: kobo(p.amount_kobo),
    status: payoutStatus(p.status),
    failure_reason: str(p.failure_reason),
    reference: str(p.reference),
    requested_at: str(p.requested_at),
    approved_at: str(p.approved_at),
    settled_at: str(p.settled_at),
  };
}

export function normalisePayouts(raw: unknown): CoSignPayoutRecord[] {
  const items = asRecord(raw).items;
  if (!Array.isArray(items)) return [];
  return items.map((entry, i) => normalisePayout(entry, -1 - i));
}

export function readPayoutFromResponse(raw: unknown): CoSignPayoutRecord | null {
  const box = asRecord(asRecord(raw).payout);
  return Object.keys(box).length > 0 ? normalisePayout(box, 0) : null;
}


export function describePayoutStatus(status: CoSignPayoutStatus): string {
  switch (status) {
    case "requested":
      return "Waiting for review";
    case "approved":
      return "Approved — not sent yet";
    case "sent":
      return "Sent to your bank";
    case "settled":
      return "Paid out";
    case "failed":
      return "Failed — the money stayed in your balance";
  }
}


const ROOT = "/co-sign";

export async function getCoSign(profileId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/${profileId}`, { method: "GET" }, true);
}


export async function enableCoSign(
  profileId: number,
  payload: CoSignEnableRequest
): Promise<ApiResponse<unknown>> {
  return request<unknown>(
    `${ROOT}/${profileId}/enable`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** `GET /api/co-sign/{profileId}/ledger` → `{balance, items, meta}`. */
export async function getCoSignLedger(
  profileId: number,
  perPage = 10
): Promise<ApiResponse<unknown>> {
  const safe = Math.min(100, Math.max(1, Math.trunc(perPage)));
  return request<unknown>(`${ROOT}/${profileId}/ledger?per_page=${safe}`, { method: "GET" }, true);
}

/** `GET /api/co-sign/{profileId}/payouts` → `{balance, items}` (latest 50). */
export async function getCoSignPayouts(profileId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/${profileId}/payouts`, { method: "GET" }, true);
}


export async function requestCoSignPayout(
  profileId: number,
  amountKobo: number,
  payoutAccountId: number
): Promise<ApiResponse<unknown>> {
  return request<unknown>(
    `${ROOT}/${profileId}/payouts`,
    {
      method: "POST",
      body: JSON.stringify({
        amount_kobo: Math.trunc(amountKobo),
        payout_account_id: payoutAccountId,
      }),
    },
    true
  );
}
