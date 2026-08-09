"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Palette,
  Users,
} from "lucide-react";
import { getProfiles, type ProfileSummary } from "@/lib/api/analytics-v2";
import { publicKitLabel, publicKitUrl } from "@/lib/api/press-kit";
import { ANALYTICS_V2_ENABLED, useAnalyticsV2Optional } from "@/lib/hooks/useAnalyticsV2";
import { usePressKit, type UsePressKit } from "@/lib/hooks/usePressKit";
import { AddressSheet } from "./AddressSheet";
import { CoSignPanel } from "./CoSignPanel";
import { EditorSections, HeroEditor } from "./EditorSections";
import {
  FailureNotice,
  Notice,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Shimmer,
  Toaster,
  useToast,
} from "./primitives";
import { ThemeSheet } from "./ThemeSheet";
import { ACCENT_TEXT, pageTheme } from "./theme";


interface EditorScope {
  profiles: ProfileSummary[];
  activeId: number | null;
  loading: boolean;
  error: string | null;
  select: (id: number) => void;
  /** Back to "no artist chosen" — which is pooled, and shows the picker again. */
  clear: () => void;
  /** True when the header switcher is what is driving the selection. */
  followsHeader: boolean;
}

function useEditorScope(): EditorScope {
  const ctx = useAnalyticsV2Optional();
  const headerDriven = Boolean(ctx?.enabled);


  if (process.env.NODE_ENV !== "production" && ANALYTICS_V2_ENABLED && !ctx) {
    console.warn(
      "[PressKitEditor] No AnalyticsV2Provider above this component — the header artist " +
        "switcher will be ignored and the editor will fall back to its own profile list. " +
        "The provider belongs in app/dashboard/layout.tsx, above the page module."
    );
  }

  const [fallback, setFallback] = useState<ProfileSummary[]>([]);
  const [fallbackId, setFallbackId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!headerDriven);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (headerDriven) return;
    let cancelled = false;

    (async () => {
      const res = await getProfiles();
      if (cancelled) return;
      if (res.data) {
        setFallback(res.data);
 
        if (res.data.length === 1) setFallbackId(res.data[0].id);
        setError(null);
      } else {
        setError(res.error ?? "Could not load your artist profiles.");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [headerDriven]);

  if (headerDriven && ctx) {
    return {
      profiles: ctx.profiles,
      activeId: ctx.activeId,
      loading: ctx.profilesLoading,
      error: ctx.profilesError,
      select: (id) => ctx.select(id),
      clear: () => ctx.select(null),
      followsHeader: true,
    };
  }

  return {
    profiles: fallback,
    activeId: fallbackId,
    loading,
    error,
    select: setFallbackId,
    clear: () => setFallbackId(null),
    followsHeader: false,
  };
}


export function PressKitEditor() {
  const scope = useEditorScope();

  if (scope.loading && scope.profiles.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Shimmer className="h-24 w-full" />
        <Shimmer className="h-40 w-full" />
      </div>
    );
  }

  if (scope.error && scope.profiles.length === 0) {
    return <FailureNotice title="Artist profiles" error={scope.error} errors={null} />;
  }

  if (scope.profiles.length === 0) {
    return (
      <Panel>
        <div className="p-8 text-center">
          <p className="font-body text-white/60 text-sm">
            No artist profile is linked to this account yet.
          </p>
          <p className="font-body text-white/30 text-xs mt-1.5">
            A press kit belongs to an artist profile, so one has to exist before there is
            anything to build.
          </p>
        </div>
      </Panel>
    );
  }

  if (scope.activeId === null) {
    return <ArtistPicker scope={scope} />;
  }

  const profile = scope.profiles.find((p) => p.id === scope.activeId) ?? null;

  return (
    <EditorForProfile
      key={scope.activeId}
      profileId={scope.activeId}
      profile={profile}
      scope={scope}
    />
  );
}

/* ─── Picker ──────────────────────────────────────────────────── */

/**
 * Shown when the account is pooled. Deliberately NOT a silent "first artist wins":
 * every one of these is a separate public page, and writing to the wrong one is
 * visible to the world.
 */
function ArtistPicker({ scope }: { scope: EditorScope }) {
  return (
    <Panel>
      <div className="p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Users size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT_TEXT }} aria-hidden />
          <div>
            <h2 className="font-heading text-white uppercase text-sm tracking-wide">
              Whose press kit?
            </h2>
            <p className="font-body text-white/45 text-xs mt-1 leading-relaxed">
              Each artist has their own press kit and their own public address, so there
              is no combined one to edit.
              {scope.followsHeader &&
                " Picking here also sets the artist in the header switcher."}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {scope.profiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                onClick={() => scope.select(profile.id)}
                className="w-full flex items-center gap-3 rounded-xl border border-white/[0.07] hover:border-white/25 bg-black/20 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
              >
                <span className="w-9 h-9 rounded-lg overflow-hidden bg-[#0E0808] border border-white/[0.08] grid place-items-center shrink-0">
                  {profile.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading text-white/60 text-[11px]">
                      {(profile.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 min-w-0">
                  <span className="font-body text-white text-sm block truncate">
                    {profile.display_name ?? `Profile ${profile.id}`}
                  </span>
                  <span className="font-body text-white/35 text-[11px] block capitalize">
                    {profile.role}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <Notice>
          Only artists you own can be edited. A profile shared with you can be read, but
          its public page is not yours to change.
        </Notice>
      </div>
    </Panel>
  );
}


function EditorForProfile({
  profileId,
  profile,
  scope,
}: {
  profileId: number;
  profile: ProfileSummary | null;
  scope: EditorScope;
}) {
  const kit = usePressKit(profileId, profile?.display_name ?? "");
  const { toast, show } = useToast();

  const [themeOpen, setThemeOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);

  const slugValue = kit.slug.current ?? kit.draft.artist.slug;
  const publicUrl = publicKitUrl(slugValue);
  const addressLabel = publicKitLabel(slugValue);

  useEffect(() => {
    if (!kit.isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [kit.isDirty]);

  const copyAddress = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      show("Link copied");
    } catch {
      show("Could not copy — long-press the link instead", "bad");
    }
  }, [publicUrl, show]);

  const onSave = useCallback(async () => {
    const ok = await kit.save();
    show(ok ? "Press kit saved" : "Could not save — see the message above", ok ? "ok" : "bad");
  }, [kit, show]);

  const onPublish = useCallback(async () => {
    const ok = kit.isPublished ? await kit.unpublish() : await kit.publish();
    if (!ok) {
      show("Could not change publish state", "bad");
      return;
    }
    show(kit.isPublished ? "Press kit is now private" : "Press kit is live");
  }, [kit, show]);

  const themeName = useMemo(() => pageTheme(kit.draft.kit.theme).name, [kit.draft.kit.theme]);

  if (kit.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Shimmer className="h-20 w-full" />
        <Shimmer className="h-56 w-full" />
        <Shimmer className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Who is being edited — a label needs this stated, not inferred. */}
      <p className="font-body text-white/45 text-xs">
        Editing the press kit for{" "}
        <span className="text-white/90">
          {kit.draft.artist.name || profile?.display_name || `profile ${profileId}`}
        </span>
        {scope.profiles.length > 1 && (
          <>
            {" · "}
            <button
              type="button"
              onClick={scope.clear}
              className="underline underline-offset-2 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:text-white"
            >
              change artist
            </button>
          </>
        )}
      </p>

      {kit.loadFailure && (
        <FailureNotice
          title={
            kit.loadFailure.status === 404
              ? "Your press kit has not been created on the server yet"
              : "Could not load your press kit"
          }
          error={
            kit.loadFailure.status === 404
              ? "You can lay it out here, but nothing will save until the press-kit API is live."
              : kit.loadFailure.error
          }
          errors={kit.loadFailure.errors}
          tone={kit.loadFailure.status === 404 ? "warning" : "error"}
          onRetry={kit.reload}
        />
      )}

      {/* Status + tools */}
      <Panel>
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <StatusChip published={kit.isPublished} />
              <div className="min-w-0">
                <p className="font-body text-white text-[13px] truncate">
                  {addressLabel ?? "No web address yet"}
                </p>
                <p className="font-body text-white/35 text-[11px]">
                  {kit.isPublished
                    ? "Anyone with this link can see your kit."
                    : "Nobody can see this yet."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SecondaryButton onClick={() => void copyAddress()} disabled={!publicUrl}>
                <Copy size={13} aria-hidden />
                Copy link
              </SecondaryButton>

              {publicUrl && kit.isPublished && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-[12px] rounded-full px-4 py-2 border border-white/12 text-white/70 hover:text-white hover:border-white/30 transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
                >
                  <ExternalLink size={13} aria-hidden />
                  View
                </a>
              )}

              <SecondaryButton onClick={() => void onPublish()} disabled={kit.isPublishing}>
                {kit.isPublishing ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                ) : kit.isPublished ? (
                  <EyeOff size={13} aria-hidden />
                ) : (
                  <Eye size={13} aria-hidden />
                )}
                {kit.isPublished ? "Unpublish" : "Publish"}
              </SecondaryButton>
            </div>
          </div>

          {kit.publishFailure && (
            <FailureNotice
              title="Publish state unchanged"
              error={kit.publishFailure.error}
              errors={kit.publishFailure.errors}
            />
          )}

          <div className="flex items-center gap-2 flex-wrap border-t border-white/[0.05] pt-4">
            <SecondaryButton onClick={() => setThemeOpen(true)}>
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${pageTheme(kit.draft.kit.theme).accent}, ${
                    pageTheme(kit.draft.kit.theme).gold
                  })`,
                }}
                aria-hidden
              />
              {themeName} theme
            </SecondaryButton>
            <SecondaryButton onClick={() => setAddressOpen(true)}>
              <Globe size={13} aria-hidden />
              Web address
            </SecondaryButton>
            <SecondaryButton onClick={() => setThemeOpen(true)}>
              <Palette size={13} aria-hidden />
              Headline style
            </SecondaryButton>
          </div>

          {kit.isPublished && kit.isDirty && (
            <Notice tone="warning">
              Your page is live and you have unsaved changes. Visitors still see the last
              saved version until you save.
            </Notice>
          )}
        </div>
      </Panel>

      <HeroEditor kit={kit} />
      <EditorSections kit={kit} />

      <CoSignPanel
        profileId={profileId}
        artistName={kit.draft.artist.name || profile?.display_name || "this artist"}
      />

      <SaveBar kit={kit} onSave={onSave} />

      <ThemeSheet
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        theme={kit.draft.kit.theme}
        headlineFont={kit.draft.kit.headline_font}
        onTheme={kit.setTheme}
        onHeadlineFont={kit.setHeadlineFont}
      />

      <AddressSheet
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        slug={kit.slug}
        suggestedFrom={kit.draft.artist.name || profile?.display_name || ""}
        onCheck={kit.checkSlug}
        onSave={kit.changeSlug}
        onCopy={() => void copyAddress()}
        isPublished={kit.isPublished}
      />

      <Toaster toast={toast} />
    </div>
  );
}

function StatusChip({ published }: { published: boolean }) {
  return (
    <span
      className="font-body text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border shrink-0 flex items-center gap-1.5"
      style={{
        color: published ? "#0ca30c" : "rgba(255,255,255,0.5)",
        borderColor: published ? "#0ca30c55" : "rgba(255,255,255,0.12)",
        backgroundColor: published ? "rgba(12,163,12,0.1)" : "transparent",
      }}
    >
      {published ? <Check size={10} aria-hidden /> : <EyeOff size={10} aria-hidden />}
      {published ? "Live" : "Draft"}
    </span>
  );
}

function SaveBar({ kit, onSave }: { kit: UsePressKit; onSave: () => void }) {
  if (!kit.isDirty && !kit.saveFailure) {
    return kit.savedAt ? (
      <p className="font-body text-white/30 text-[11px] text-center">All changes saved.</p>
    ) : null;
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[70] px-3 pb-3 pt-6 pointer-events-none bg-gradient-to-t from-[#0E0808] via-[#0E0808]/90 to-transparent">
      <div className="pointer-events-auto max-w-3xl mx-auto flex flex-col gap-2">
        {kit.saveFailure && (
          <FailureNotice
            title="Your changes were not saved"
            error={kit.saveFailure.error}
            errors={kit.saveFailure.errors}
          />
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-[#180F0F] px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
          <AlertTriangle size={15} className="shrink-0" style={{ color: ACCENT_TEXT }} aria-hidden />
          <p className="font-body text-white/70 text-[12px] flex-1 min-w-0">
            You have unsaved changes.
          </p>
          <SecondaryButton onClick={kit.discard} disabled={kit.isSaving}>
            Discard
          </SecondaryButton>
          <PrimaryButton onClick={onSave} disabled={kit.isSaving}>
            {kit.isSaving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
