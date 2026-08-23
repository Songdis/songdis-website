import { request } from "./core";

/**
 * Publishing administration.
 *
 * A songwriter can only be registered with an IPI, which a PRO issues on affiliation —
 * nothing here creates one. So the API has two entry points, not one: register a writer,
 * or record that the artist needs help getting affiliated.
 */

export type WriterStatus = "pending" | "registered" | "failed";

export interface PublishingWriter {
  id: number;
  artist_profile_id: number;
  first_name: string;
  last_name: string;
  email: string;
  affiliation: string;
  ipi: string;
  status: WriterStatus;
  last_error: string | null;
  registered_at: string | null;
}

export interface PublishingHelpRequest {
  id: number;
  artist_profile_id: number | null;
  full_name: string | null;
  email: string;
  status: string;
  created_at: string | null;
}

export type SplitStatus =
  | "draft"
  | "creating"
  | "created"
  | "assigning"
  | "assigned"
  | "registering"
  | "registered"
  | "failed";

export interface SplitWriter {
  ipi: string;
  name: string | null;
  /** Percent, not a fraction — 70 means 70%. */
  share: number;
  position: number;
}

export interface PublishingSplit {
  id: number;
  title: string;
  artist_profile_id: number | null;
  music_upload_id: number | null;
  remote_splits_id: string | null;
  isrcs: string[];
  status: SplitStatus;
  last_error: string | null;
  registered_at: string | null;
  writers: SplitWriter[];
}

export interface SplitPayload {
  title: string;
  artist_profile_id?: number | null;
  music_upload_id?: number | null;
  isrcs?: string[];
  writers: Array<{ ipi: string; name?: string; share: number }>;
}

export interface PublishingOverview {
  /** False on Basic — the UI shows the upgrade prompt rather than the form. */
  entitled: boolean;
  /** False when the publisher credentials are missing from the environment. */
  configured: boolean;
  /**
   * Songdis's commission on collected writer royalties, as a percent.
   *
   * Comes from the same config the split job sends to the publisher, so what an artist is
   * told and what is filed at the PRO cannot drift apart.
   */
  publisher_share_percent?: number;
  affiliations: string[];
  writers: PublishingWriter[];
  help_requests: PublishingHelpRequest[];
  splits: PublishingSplit[];
  /** Artist profiles already paid for. Anything not here must pay before registering. */
  paid_profile_ids?: number[];
}

export interface WriterPayload {
  artist_profile_id: number;
  first_name: string;
  last_name: string;
  email: string;
  affiliation: string;
  ipi: string;
}

export interface HelpRequestPayload {
  artist_profile_id?: number | null;
  full_name?: string;
  email: string;
  phone?: string;
  country?: string;
  note?: string;
}

export async function getPublishingOverview() {
  return request<PublishingOverview>("/publishing", { method: "GET" }, true);
}

/**
 * Returns 202, not 201: the remote workflow takes about fifteen seconds and runs on a
 * queue, so the writer comes back `pending` and settles to `registered` or `failed`.
 */
export async function createWriter(payload: WriterPayload) {
  return request<PublishingWriter>(
    "/publishing/writers",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function createHelpRequest(payload: HelpRequestPayload) {
  return request<PublishingHelpRequest>(
    "/publishing/help-requests",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** The PROs relevant to this catalogue, with enough context to pick the right one. */
export const AFFILIATION_HINTS: Record<string, string> = {
  ASCAP: "United States",
  BMI: "United States",
  SESAC: "United States",
  PRS: "United Kingdom",
  SACEM: "France",
  GEMA: "Germany",
  SOCAN: "Canada",
  APRA: "Australia / New Zealand",
  SAMRO: "South Africa",
  COSON: "Nigeria",
  MCSN: "Nigeria",
  GHAMRO: "Ghana",
  OTHER: "Somewhere else",
};

/**
 * Submitting a split runs three remote calls on a queue, so this returns 202 with a
 * `draft` row. It settles through created / assigned to registered, or stops at failed.
 */
export async function createSplit(payload: SplitPayload) {
  return request<PublishingSplit>(
    "/publishing/splits",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** Resumes from whatever step it stopped at — never restarts from the top. */
export async function retrySplit(id: number) {
  return request<PublishingSplit>(`/publishing/splits/${id}/retry`, { method: "POST" }, true);
}

/** Statuses that mean the publisher is mid-call; the UI polls while any split is here. */
export const SPLIT_IN_FLIGHT: SplitStatus[] = [
  "draft",
  "creating",
  "created",
  "assigning",
  "assigned",
  "registering",
];

export const SPLIT_LABEL: Record<SplitStatus, string> = {
  draft: "Queued",
  creating: "Creating…",
  created: "Created",
  assigning: "Attaching ISRCs…",
  assigned: "ISRCs attached",
  registering: "Registering…",
  registered: "Registered",
  failed: "Needs attention",
};

/* ── Buying publishing ────────────────────────────────────────────
 * Two one-time products, both per artist profile:
 *   access  ₦70,000  register the songwriter with the publisher
 *   session ₦50,000  we obtain the IPI for an artist who has no PRO
 *
 * Every call returns a checkout URL. Payment is confirmed by the Bachs webhook — never
 * by the browser coming back — so the page polls `getCheckoutStatus` on return.
 */

export interface CheckoutStart {
  checkout_url: string | null;
  reference: string;
  amount: number;
  currency: string;
  slot_at?: string;
}

export interface SessionSlot {
  /** UTC instant. Send this back verbatim; never re-derive it in the browser. */
  slot_at: string;
  /** Already formatted in West Africa Time by the API. */
  label_time: string;
  label_day: string;
}

export type SessionStatus =
  | "pending_payment"
  | "booked"
  | "completed"
  | "cancelled"
  | "slot_lost";

export interface BookedSession {
  id: number;
  artist_profile_id: number;
  status: SessionStatus;
  slot_at: string;
  label_time: string | null;
  label_day: string | null;
  label_full: string | null;
  meeting_url: string | null;
  amount: number;
  currency: string;
  paid_at: string | null;
}

export interface CheckoutStatus {
  paid_profile_ids: number[];
  sessions: BookedSession[];
}

export async function startAccessCheckout(artistProfileId: number) {
  return request<CheckoutStart>(
    "/publishing/checkout/access",
    { method: "POST", body: JSON.stringify({ artist_profile_id: artistProfileId }) },
    true
  );
}

export async function getSessionSlots() {
  return request<{ timezone: string; slots: SessionSlot[] }>(
    "/publishing/checkout/slots",
    { method: "GET" },
    true
  );
}

export async function startSessionCheckout(artistProfileId: number, slotAt: string) {
  return request<CheckoutStart>(
    "/publishing/checkout/session",
    {
      method: "POST",
      body: JSON.stringify({ artist_profile_id: artistProfileId, slot_at: slotAt }),
    },
    true
  );
}

export async function getCheckoutStatus() {
  return request<CheckoutStatus>("/publishing/checkout/status", { method: "GET" }, true);
}

/** Naira, the only currency publishing is sold in. */
export function formatNaira(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}
