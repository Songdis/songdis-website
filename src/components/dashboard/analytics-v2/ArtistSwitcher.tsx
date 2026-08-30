"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Layers, Search, X } from "lucide-react";
import type { ProfileSummary } from "@/lib/api/analytics-v2";
import { useAnalyticsV2Optional } from "@/lib/hooks/useAnalyticsV2";
import { BRAND, formatGrantedAt } from "./theme";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  viewer: "Viewer",
};

const SEARCH_THRESHOLD = 6;


const GROUPS: Array<{ key: string; label: string; roles: Array<"owner" | "manager" | "viewer"> }> = [
  { key: "owned", label: "Your artists", roles: ["owner"] },
  { key: "managed", label: "Managed", roles: ["manager", "viewer"] },
];

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({
  profile,
  size = 32,
  rounded = "rounded-lg",
}: {
  profile: ProfileSummary | null;
  size?: number;
  rounded?: string;
}) {
  const label = profile?.display_name ?? "Artist";

  if (profile?.image_url) {
    return (
      <div
        className={`relative overflow-hidden ${rounded} shrink-0 bg-[#0E0808] border border-white/[0.08]`}
        style={{ width: size, height: size }}
      >
        <Image src={profile.image_url} alt="" fill className="object-cover" unoptimized />
      </div>
    );
  }

  return (
    <div
      className={`${rounded} shrink-0 flex items-center justify-center bg-[#0E0808] border border-white/[0.08]`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="font-heading text-white/70 leading-none"
        style={{ fontSize: Math.max(9, size * 0.34) }}
      >
        {initials(label)}
      </span>
    </div>
  );
}

function PooledAvatar({ size = 32, rounded = "rounded-lg" }: { size?: number; rounded?: string }) {
  return (
    <div
      className={`${rounded} shrink-0 flex items-center justify-center border border-[#C30100]/35 bg-[#C30100]/10`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Layers size={Math.max(12, size * 0.42)} className="text-white/75" />
    </div>
  );
}

function RoleChip({ role }: { role: string }) {
  return (
    <span className="font-body text-[9px] uppercase tracking-wider text-white/45 border border-white/[0.08] rounded-full px-1.5 py-px">
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}


export function ArtistSwitcher() {
  const ctx = useAnalyticsV2Optional();
  const [open, setOpen] = useState(false);

  if (!ctx || !ctx.enabled) return null;
  if (ctx.profilesLoading && ctx.profiles.length === 0) {
    return <div className="av2-shimmer h-9 w-32 rounded-full hidden sm:block" />;
  }
  if (ctx.profiles.length < 2) return null;

  const { activeProfile, isPooled } = ctx;
  const name = isPooled ? "All profiles" : activeProfile?.display_name ?? "Select profile";
  const sub = isPooled
    ? `${ctx.profiles.length} pooled`
    : ROLE_LABELS[activeProfile?.role ?? ""] ?? "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Switch artist profile. Current: ${name}`}
        className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#180F0F] hover:border-[#C30100]/45 hover:bg-[#1C1010] pl-1.5 pr-2.5 py-1.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] max-w-[190px] sm:max-w-[240px]"
      >
        {isPooled ? (
          <PooledAvatar size={26} rounded="rounded-full" />
        ) : (
          <Avatar profile={activeProfile} size={26} rounded="rounded-full" />
        )}

        <span className="min-w-0 hidden sm:flex flex-col items-start leading-tight">
          <span className="font-body text-white text-[11px] truncate max-w-[130px]">{name}</span>
          {sub && <span className="font-body text-white/35 text-[9px]">{sub}</span>}
        </span>

        <ChevronDown
          size={13}
          aria-hidden
          className="text-white/35 group-hover:text-white/70 transition-colors shrink-0"
        />
      </button>

      {open && <SwitcherOverlay onClose={() => setOpen(false)} />}
    </>
  );
}


function SwitcherOverlay({ onClose }: { onClose: () => void }) {
  const ctx = useAnalyticsV2Optional();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const profiles = useMemo(() => ctx?.profiles ?? [], [ctx?.profiles]);
  const showSearch = profiles.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.display_name ?? "").toLowerCase().includes(q));
  }, [profiles, query]);

  // Only worth splitting when the account actually holds both kinds. A solo artist
  // with one owned profile should not be shown a "Your artists" heading over a
  // list of one.
  const showGroupHeadings = useMemo(
    () =>
      profiles.some((p) => p.role === "owner") &&
      profiles.some((p) => p.role !== "owner"),
    [profiles]
  );

  if (!ctx) return null;

  const choose = (id: number | null) => {
    ctx.select(id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Switch artist profile"
      className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-black/72 backdrop-blur-sm animate-fade-in"
      />

      <div className="av2-module relative z-[1] w-full max-w-2xl my-auto rounded-2xl border border-white/[0.08] bg-[#140C0C] overflow-hidden">
        {/* Brand glow, top-left, soft */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72"
          style={{
            background: `radial-gradient(circle, ${BRAND}38 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-[1] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h2 className="font-heading text-white uppercase text-base sm:text-lg tracking-wide">
                Switch Profile
              </h2>
              <p className="font-body text-white/40 text-xs mt-1">
                Analytics, tracks and coverage all follow your selection.
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/40 hover:text-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100] rounded"
            >
              <X size={20} />
            </button>
          </div>

          {showSearch && (
            <div className="relative mb-4">
              <Search
                size={14}
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${profiles.length} profiles`}
                className="w-full bg-[#0E0808] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100]/50 transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-0.5">
            {/* Pooled option — only meaningful with more than one profile */}
            {!query && (
              <ProfileRow
                active={ctx.isPooled}
                onClick={() => choose(null)}
                avatar={<PooledAvatar size={44} />}
                title="All profiles"
                meta={`${profiles.length} profiles pooled into one view`}
                badge="Pooled"
              />
            )}

            {/* Grouped by how the account reaches the profile, not alphabetically.
                On a label roster "which of these are mine?" is the first question,
                and it is answered by `role` — owned profiles versus granted ones.
                Headings are suppressed when a group is empty, so a single-artist
                account sees exactly what it saw before. */}
            {GROUPS.map(({ key, label, roles }) => {
              const group = filtered.filter((p) => roles.includes(p.role));
              if (group.length === 0) return null;

              return (
                <div key={key} className="flex flex-col gap-2">
                  {showGroupHeadings && (
                    <p className="font-body text-[10px] uppercase tracking-wider text-white/30 px-1 pt-1">
                      {label}
                    </p>
                  )}

                  {group.map((profile) => (
                    <ProfileRow
                      key={profile.id}
                      active={ctx.activeId === profile.id}
                      onClick={() => choose(profile.id)}
                      avatar={<Avatar profile={profile} size={44} />}
                      title={profile.display_name ?? `Profile ${profile.id}`}
                      meta={
                        formatGrantedAt(profile.granted_at)
                          ? `Access since ${formatGrantedAt(profile.granted_at)}`
                          : undefined
                      }
                      role={profile.role}
                    />
                  ))}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="font-body text-white/35 text-sm text-center py-8">
                No profile matches &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>

          {ctx.profilesError && (
            <p className="font-body text-[#d03b3b] text-xs mt-3">{ctx.profilesError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  active,
  onClick,
  avatar,
  title,
  meta,
  role,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  avatar: React.ReactNode;
  title: string;
  meta?: string;
  role?: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={[
        "w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
        active
          ? "border-[#C30100]/45 bg-[#C30100]/[0.08]"
          : "border-white/[0.06] bg-[#180F0F] hover:border-white/[0.14] hover:bg-[#1C1010]",
      ].join(" ")}
    >
      {avatar}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-white text-sm truncate">{title}</span>
          {role && <RoleChip role={role} />}
          {badge && (
            <span className="font-body text-[9px] uppercase tracking-wider text-white/60 border border-[#C30100]/35 bg-[#C30100]/10 rounded-full px-1.5 py-px">
              {badge}
            </span>
          )}
        </div>
        {meta && <p className="font-body text-white/35 text-[11px] mt-0.5 truncate">{meta}</p>}
      </div>

      {active && (
        <span
          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-[#C30100]"
          aria-label="Selected"
        >
          <Check size={12} className="text-white" />
        </span>
      )}
    </button>
  );
}
