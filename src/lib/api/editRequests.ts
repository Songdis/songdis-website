import { request } from "./core";

const BASE = "/v2";

/** How a changed value should be rendered in the review list. */
export type DiffKind = "text" | "longtext" | "date" | "bool" | "list" | "file";

export interface DiffEntry {
  field: string;
  label: string;
  kind: DiffKind;
  from: unknown;
  to: unknown;
  /** File changes only — so old and new can be shown side by side. */
  from_url?: string | null;
  to_url?: string | null;
}

export type RevisionStatus = "pending" | "approved" | "rejected" | "withdrawn";

export interface Revision {
  id: number;
  status: RevisionStatus;
  reason: string | null;
  change_count: number;
  summary: string;
  has_audio_change: boolean;
  has_artwork_change: boolean;
  requires_redelivery: boolean;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  diff?: DiffEntry[];
  release: {
    id: number;
    track_title: string | null;
    album_art_url: string | null;
    status: string | null;
  } | null;
}

/** One row of a multi-track release. An album is stored as one row per track. */
export interface EditFormTrack {
  id: number;
  track_title: string | null;
  mix_version: string | null;
  audio_file_path: string | null;
  s3_key: string | null;
  s3_bucket: string | null;
  isrc_code: string | null;
  lyrics: string | null;
  primary_genre: string | null;
  secondary_genre: string | null;
  explicit_content: boolean;
}

export interface EditFormPayload {
  release: {
    id: number;
    status: string | null;
    upload_type: string | null;
    track_title: string | null;
    is_album: boolean;
    track_count: number;
  };
  /** Every track already on the release, so nothing has to be re-uploaded. */
  tracks: EditFormTrack[];
  /** Current values, keyed by column, ready to seed the upload form. */
  values: Record<string, unknown>;
  /** Shown read-only. UPC and ISRC identify the release to the DSPs. */
  locked_fields: Record<string, string | null>;
  editable_fields: Record<string, { label: string; kind: DiffKind }>;
  pending_revision: Revision | null;
}

/** The release as upload-form state, plus what may and may not be changed. */
export async function getEditForm(releaseId: number) {
  return request<EditFormPayload>(
    `${BASE}/releases/${releaseId}/edit-form`,
    { method: "GET" },
    true
  );
}

/**
 * Submit every change at once — metadata, artwork and audio together.
 *
 * The server computes the diff; nothing about what changed is trusted from
 * here. Omitted fields are left alone rather than blanked.
 */
export async function submitRevision(
  releaseId: number,
  payload: { reason: string; proposed: Record<string, unknown> }
) {
  return request<Revision>(
    `${BASE}/releases/${releaseId}/revisions`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getRevisions(status?: RevisionStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<{ data: Revision[]; total: number }>(
    `${BASE}/revisions${qs}`,
    { method: "GET" },
    true
  );
}

export async function getRevision(id: number) {
  return request<Revision>(`${BASE}/revisions/${id}`, { method: "GET" }, true);
}

/** Cancel a pending request so a corrected one can be sent. */
export async function withdrawRevision(id: number) {
  return request<Revision>(
    `${BASE}/revisions/${id}/withdraw`,
    { method: "POST" },
    true
  );
}

/* ─────────────────────────── Presentation ─────────────────────────── */

/** Render a diff value for the review list. */
export function formatDiffValue(value: unknown, kind: DiffKind): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (kind) {
    case "bool":
      return value ? "Yes" : "No";

    case "date":
      return new Date(String(value)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    case "list": {
      const list = Array.isArray(value) ? value : [value];
      if (list.length === 0) return "—";
      return list
        .map((v) => (typeof v === "string" ? v : (v as { name?: string })?.name ?? JSON.stringify(v)))
        .join(", ");
    }

    case "file":
      return "Replaced";

    case "longtext": {
      const text = String(value);
      return text.length > 120 ? `${text.slice(0, 120)}…` : text;
    }

    default:
      return String(value);
  }
}

export function statusLabel(status: RevisionStatus): string {
  return {
    pending: "Awaiting review",
    approved: "Approved",
    rejected: "Declined",
    withdrawn: "Withdrawn",
  }[status];
}
