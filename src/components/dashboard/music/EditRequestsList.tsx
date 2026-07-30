"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  getRevisions,
  withdrawRevision,
  type Revision,
  type RevisionStatus,
} from "@/lib/api/editRequests";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUS_STYLE: Record<RevisionStatus, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  approved: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  withdrawn: "text-white/40 bg-white/[0.04] border-white/10",
};

const STATUS_LABEL: Record<RevisionStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Not approved",
  withdrawn: "Withdrawn",
};

const FILTERS: { key: RevisionStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Not approved" },
];

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Renders one changed value the same way the review modal does. */
function DiffValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-white/25">Empty</span>;
  }

  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }

  if (Array.isArray(value)) {
    const shown = value.slice(0, 6).join(", ");
    return (
      <span className="break-words">
        {shown}
        {value.length > 6 && <span className="text-white/40"> +{value.length - 6} more</span>}
      </span>
    );
  }

  const text = String(value);
  return (
    <span className="break-words">
      {text.length > 160 ? text.slice(0, 160) + "…" : text}
    </span>
  );
}

interface EditRequestsListProps {
  /** Called after a withdrawal so the release list can refresh its statuses. */
  onChanged?: () => void;
  /** Reports counts up to the stat cards, so both read the same data. */
  onStats?: (stats: { total: number; pending: number; approved: number }) => void;
}

export default function EditRequestsList({ onChanged, onStats }: EditRequestsListProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RevisionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const { success, error: toastError } = useToast();

  const load = useCallback(async () => {
    const res = await getRevisions();

    if (res.data && !res.error) {
      const payload = res.data as unknown as Record<string, unknown>;
      const list = (payload.data ?? payload) as Revision[];
      const rows = Array.isArray(list) ? list : [];

      setRevisions(rows);

      onStats?.({
        total: rows.length,
        pending: rows.filter((r) => r.status === "pending").length,
        approved: rows.filter((r) => r.status === "approved").length,
      });
    }

    setLoading(false);
  }, [onStats]);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async () => {
    if (confirmId === null) return;

    setWithdrawing(true);
    try {
      const res = await withdrawRevision(confirmId);

      if (res.error) {
        toastError("Could not withdraw", res.error);
      } else {
        success("Request withdrawn", "You can edit this release again now.");
        setConfirmId(null);
        await load();
        onChanged?.();
      }
    } catch {
      toastError("Could not withdraw", "Something went wrong.");
    } finally {
      setWithdrawing(false);
    }
  };

  const visible = revisions.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!search) return true;

    const haystack = [r.release?.track_title, r.reason, r.summary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search.toLowerCase());
  });

  const pendingCount = revisions.filter((r) => r.status === "pending").length;

  return (
    <>

      {pendingCount > 0 && (
        <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/[0.06] px-4 py-3 flex items-start gap-3">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-body text-white/70 text-xs leading-relaxed">
            {pendingCount === 1 ? "One release has" : `${pendingCount} releases have`} changes
            awaiting review. You can&apos;t send new changes for{" "}
            {pendingCount === 1 ? "it" : "them"} until we&apos;ve looked — withdraw the request
            below if you need to change what you asked for.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search requests..."
          className="flex-1 min-w-0 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "all"
            ? revisions.length
            : revisions.filter((r) => r.status === f.key).length;

          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                "font-body text-xs rounded-full px-3 py-1.5 border transition-colors",
                filter === f.key
                  ? "bg-white/10 text-white border-white/20"
                  : "text-white/40 border-white/[0.06] hover:text-white/70",
              ].join(" ")}
            >
              {f.label}
              {count > 0 && <span className="text-white/30 ml-1.5">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-body text-white/30 text-sm">Loading requests...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-1">
          <p className="font-body text-white/30 text-sm">
            {revisions.length === 0
              ? "No edit requests yet."
              : "Nothing matches that filter."}
          </p>
          {revisions.length === 0 && (
            <p className="font-body text-white/20 text-xs">
              Changes you send for review will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((item) => {
            const isOpen = expanded === item.id;
            const diff = item.diff ?? [];

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/[0.06] bg-[#180F0F] overflow-hidden"
              >
                <div className="flex items-start gap-3 sm:gap-4 p-4">
                  {item.release?.album_art_url ? (
                    <Image
                      src={item.release.album_art_url}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="rounded-lg object-cover shrink-0 w-12 h-12"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#1A0808] shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* The release name, not "Release #1296". */}
                      <p className="font-body text-white text-sm font-medium truncate">
                        {item.release?.track_title ?? "Release"}
                      </p>
                      <span
                        className={[
                          "font-body text-[10px] rounded-full px-2 py-0.5 border shrink-0",
                          STATUS_STYLE[item.status],
                        ].join(" ")}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                      {item.requires_redelivery && item.status === "pending" && (
                        <span className="font-body text-[10px] rounded-full px-2 py-0.5 border border-white/10 text-white/40 shrink-0">
                          Needs redelivery
                        </span>
                      )}
                    </div>

                    <p className="font-body text-white/50 text-xs">
                      {item.change_count} change{item.change_count === 1 ? "" : "s"}
                      {item.summary ? ` · ${item.summary}` : ""}
                    </p>

                    {item.reason && (
                      <p className="font-body text-white/30 text-xs mt-1 line-clamp-2">
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    )}

                    <p className="font-body text-white/25 text-xs mt-1">
                      Sent {formatDate(item.created_at)}
                      {item.reviewed_at ? ` · Reviewed ${formatDate(item.reviewed_at)}` : ""}
                    </p>

                    {/* The reviewer's reason matters most when the answer is no. */}
                    {item.status === "rejected" && item.admin_notes && (
                      <div className="mt-2 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2">
                        <p className="font-body text-red-300/80 text-[11px] font-medium mb-0.5">
                          Why it wasn&apos;t approved
                        </p>
                        <p className="font-body text-white/60 text-xs">{item.admin_notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      {diff.length > 0 && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : item.id)}
                          className="font-body text-white/50 text-xs hover:text-white transition-colors"
                        >
                          {isOpen ? "Hide changes" : "See changes"}
                        </button>
                      )}

                      {item.status === "pending" && (
                        <button
                          onClick={() => setConfirmId(item.id)}
                          className="font-body text-[#C30100] text-xs hover:text-white transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isOpen && diff.length > 0 && (
                  <div className="border-t border-white/[0.06] bg-[#140C0C] p-4 flex flex-col gap-3">
                    {diff.map((entry) => (
                      <div key={entry.field} className="min-w-0">
                        <p className="font-body text-white/70 text-xs font-medium mb-1">
                          {entry.label}
                        </p>
                        <div className="font-body text-xs text-white/40 line-through break-words">
                          <DiffValue value={entry.from} />
                        </div>
                        <div className="font-body text-xs text-white mt-0.5 break-words">
                          <span className="text-[#C30100] mr-1">→</span>
                          <DiffValue value={entry.to} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        destructive
        busy={withdrawing}
        title="Withdraw this request?"
        confirmLabel="Yes, withdraw"
        cancelLabel="Keep it"
        onConfirm={handleWithdraw}
        onCancel={() => setConfirmId(null)}
        message={
          <p>
            The changes won&apos;t be applied, and your release stays exactly as it is.
            You&apos;ll be able to edit it and send a new request straight away.
          </p>
        }
      />
    </>
  );
}
