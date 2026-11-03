import type { ReleaseStatus } from "@/lib/api/music";

export type { ReleaseStatus };

/**
 * The status column is not clean: the admin panel writes "Live", "Delivered" and "Needdoc"
 * while the rest of the system writes lowercase, and one value is stored with a space
 * ("Taken Down"). Every read must go through here, because a raw key lookup against
 * STATUS_CONFIG silently falls through to a blank white badge — which is what roughly
 * 3,500 of ~4,400 releases were doing.
 *
 * Aliases map the stored spellings onto the canonical key rather than adding more entries,
 * so there is still one config row per status.
 */
const STATUS_ALIASES: Record<string, ReleaseStatus> = {
  needdoc: "need_documentation",
  need_doc: "need_documentation",
  needs_documentation: "need_documentation",
  taken_down: "takedown",
  take_down: "takedown",
};

export function normaliseStatus(raw?: string | null): string {
  const key = (raw ?? "").toLowerCase().trim().replace(/\s+/g, "_");
  return STATUS_ALIASES[key] ?? key;
}

export const STATUS_CONFIG: Record<
  ReleaseStatus,
  { label: string; color: string; bg: string }
> = {
  live:               { label: "Live",               color: "#22c55e", bg: "rgba(34,197,94,0.15)"   },
  pending:            { label: "Pending",            color: "#f97316", bg: "rgba(249,115,22,0.15)"  },
  delivered:          { label: "Delivered",          color: "#60a5fa", bg: "rgba(96,165,250,0.15)"  },
  distributed:        { label: "Distributed",        color: "#2dd4bf", bg: "rgba(45,212,191,0.15)"  },
  need_documentation: { label: "Need Documentation", color: "#facc15", bg: "rgba(250,204,21,0.15)"  },
  draft:              { label: "Draft",              color: "#ffffff", bg: "rgba(255,255,255,0.15)" },
  takedown:           { label: "Takedown",           color: "#f97316", bg: "rgba(249,115,22,0.15)"  },
  rejected:           { label: "Rejected",           color: "#ef4444", bg: "rgba(239,68,68,0.15)"   },
  under_review:       { label: "Under Review",       color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  approved:           { label: "Approved",           color: "#34d399", bg: "rgba(52,211,153,0.15)"  },
};

/** Always use this instead of indexing STATUS_CONFIG directly. */
export function statusConfigFor(raw?: string | null) {
  const key = normaliseStatus(raw);

  return (
    STATUS_CONFIG[key as ReleaseStatus] ?? {
      label: raw ?? "Unknown",
      color: "#ffffff",
      bg: "rgba(255,255,255,0.10)",
    }
  );
}
