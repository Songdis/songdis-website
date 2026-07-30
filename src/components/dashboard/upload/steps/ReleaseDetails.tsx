"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { UploadState, AdditionalArtist, StepFieldErrors } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";
import { getProfile } from "@/lib/api/auth";
import { getLabelPermission, uploadArtwork } from "@/lib/api/music";
import type { UploadProgress } from "@/lib/api/music";
import ArtistProfileModal from "@/components/dashboard/settings/ArtistProfileModal";
import type { ArtistProfile } from "@/components/dashboard/settings/ArtistProfileModal";


function ArtworkGenerator({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[860px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-5 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <StepHeader title="AI Artwork Generator" subtitle="Create unique album art with Ayo AI" />

        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <SparkleIcon />
          </div>
          <p className="font-heading text-white uppercase text-sm tracking-wide">Coming Back Soon</p>
          <p className="font-body text-white/50 text-sm text-center max-w-md">
            AI-powered artwork generation is on its way back. For now, you can upload your own cover art or choose from templates.
          </p>
          <button
            onClick={onClose}
            className="mt-2 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 hover:border-white/40 px-8 py-3 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px] leading-relaxed">{hint}</p>}
    </div>
  );
}

function DashSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronIcon />
    </div>
  );
}

interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  fieldErrors?: StepFieldErrors;
  clearFieldError?: (key: string) => void;
  /** Editing an existing release: identifiers are read-only. */
  isEditing?: boolean;
}

export default function ReleaseDetails({ state, update, onBack, onContinue, onSaveDraft, fieldErrors = {}, clearFieldError, isEditing = false }: Props) {
  const [artworkGen, setArtworkGen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [profiles, setProfiles] = useState<ArtistProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [canEditLabel, setCanEditLabel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  useEffect(() => {
    getLabelPermission().then((res) => {
      if (res.error || !res.data) return;
      setCanEditLabel(res.data.can_edit_label);
    });
  }, []);

  useEffect(() => {
    getProfile().then((res) => {
      if (res.error || !res.data) return;
      const raw = res.data as unknown as Record<string, unknown>;
      const list = Array.isArray(raw.profiles)
        ? raw.profiles
        : Array.isArray(res.data)
          ? res.data
            : Array.isArray(raw.data)
              ? raw.data
              : [];
      const mapped = (list as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ""),
        stageName: (p.stage_name ?? p.stageName ?? "") as string,
        fullName: (p.full_name ?? p.fullName ?? "") as string,
        email: (p.email ?? "") as string,
        phone: (p.phone ?? "") as string,
        dob: (p.dob ?? "") as string,
        location: (p.location ?? "") as string,
        bio: (p.bio ?? "") as string,
        instagram: (p.instagram_url ?? p.instagram ?? "") as string,
        twitter: (p.twitter_url ?? p.twitter ?? "") as string,
        facebook: (p.facebook_url ?? p.facebook ?? "") as string,
        tiktok: (p.tiktok_url ?? p.tiktok ?? "") as string,
        appleMusic: (p.apple_music_url ?? p.appleMusic ?? "") as string,
        spotify: (p.spotify_url ?? p.spotify ?? "") as string,
        cover: (p.cover ?? "") as string,
        avatar: (p.profile_image ?? p.spotify_image_url ?? p.avatar_url ?? "/images/avatar-artiste.svg") as string,
      }));
      setProfiles(mapped);

      /* Auto-fill primary artist if not already set */
      if (!state.primaryArtist && mapped.length > 0) {
        const name = mapped[0].stageName || mapped[0].fullName;
        if (name) update({ primaryArtist: name });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrimaryArtistChange = (value: string) => {
    if (value === "__add_new__") {
      setShowProfileModal(true);
    } else {
      update({ primaryArtist: value });
    }
  };

  const handleNewProfileSaved = (profile: ArtistProfile) => {
    setProfiles((prev) => [...prev, profile]);
    update({ primaryArtist: profile.stageName || profile.fullName });
    setShowProfileModal(false);
  };

  const releaseTypeLabel =
    state.releaseType === "single" ? "Upload Single" :
    state.releaseType === "album" ? "Upload Album" : "Upload Mixtape";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      img.src = objectUrl;
    });
    if (img.width < 3000 || img.height < 3000) {
      alert(`Artwork must be at least 3000×3000 pixels. Your image is ${img.width}×${img.height}.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    update({ artwork: previewUrl, artworkFile: file });
    setUploading(true);
    setUploadProgress(null);

    try {
      const result = await uploadArtwork(file, (p) => setUploadProgress(p));
      update({
        artworkUrl: result.file_url,
        artworkKey: result.s3_key,
        artworkSizes: result.sizes ?? null,
        artworkFile: null,
      });
    } catch (err) {
      console.error("Artwork upload failed:", err);
      update({ artwork: null, artworkFile: null });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto">
        <StepHeader title={releaseTypeLabel} subtitle="Complete all steps to submit your release for distribution" />
        <StepProgress current={1} />

        <button
          onClick={() => setArtworkGen(true)}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] py-4 mb-5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <AyoIcon />
          </div>
          <span className="font-body text-[#C30100] text-sm">Generate Cover Art with Ayo</span>
        </button>

        {/* Artwork upload */}
        {state.artwork ? (
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-xl overflow-hidden group cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
            <Image src={state.artwork} alt="Artwork" fill className="object-cover" unoptimized />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {uploadProgress && (
                  <div className="w-24">
                    <p className="font-body text-white text-xs text-center mb-1">{uploadProgress.percentage}%</p>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C30100] rounded-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="font-body text-white text-xs">Change</p>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-[#C30100]/40 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#C30100]/70 transition-colors mb-5">
            <UploadIcon />
            <p className="font-body text-white/50 text-sm">{uploading ? "Uploading..." : "Click to upload artwork"}</p>
            <p className="font-body text-white/25 text-xs">or drag and drop · Min 3000×3000px · Max 10MB</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
        {fieldErrors.artwork && <p className="font-body text-[#C30100] text-xs text-center mb-2">{fieldErrors.artwork}</p>}

        {/* Form grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Release Title" hint="Enter your song or project name exactly as you want it shown.">
            <input value={state.releaseTitle} onChange={(e) => { update({ releaseTitle: e.target.value }); clearFieldError?.("releaseTitle"); }}
              placeholder="e.g Scatter the place"
              className={`w-full bg-[#0E0808] border rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none transition-colors ${
                fieldErrors.releaseTitle ? "border-[#C30100]" : "border-white/10 focus:border-[#C30100]"
              }`} />
            {fieldErrors.releaseTitle && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.releaseTitle}</p>}
          </Field>

          <Field label="Release Version (Optional)" hint="Leave empty unless Remix or Deluxe Edition.">
            <input value={state.releaseVersion} onChange={(e) => update({ releaseVersion: e.target.value })}
              placeholder="eg deluxe, remix"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="Primary Artist" hint="Select from your artist profiles or add a new one.">
            <div className="relative">
              <select
                value={state.primaryArtist}
                onChange={(e) => handlePrimaryArtistChange(e.target.value)}
                className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
              >
                {profiles.length === 0 && (
                  <option value="">No profiles found</option>
                )}
                {profiles.map((p) => (
                  <option key={p.id} value={p.stageName || p.fullName}>
                    {p.stageName || p.fullName}
                    {p.fullName && p.stageName ? ` (${p.fullName})` : ""}
                  </option>
                ))}
                <option value="__add_new__">+ Add Another Artist</option>
              </select>
              <ChevronIcon />
            </div>
          </Field>

          {/* Additional Artists */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="font-body text-white/70 text-xs">Additional Artists (Optional)</label>
              <button type="button" onClick={() => {
                const newArtist: AdditionalArtist = {
                  id: `artist_${Date.now()}_${Math.random()}`,
                  name: "",
                  artistId: "",
                  role: "featuring",
                };
                update({ additionalArtists: [...state.additionalArtists, newArtist] });
              }} className="font-body text-[#C30100] text-xs hover:text-[#C30100]/80 transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Artist
              </button>
            </div>
            {state.additionalArtists.length > 0 && (
              <div className="space-y-2">
                {state.additionalArtists.map((artist) => (
                  <div key={artist.id} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <ArtistNameInput
                        profiles={profiles}
                        value={artist.name}
                        onChange={(name, artistId) => {
                          update({
                            additionalArtists: state.additionalArtists.map((a) =>
                              a.id === artist.id ? { ...a, name, artistId: artistId || a.artistId } : a
                            ),
                          });
                        }}
                      />
                    </div>
                    <select
                      value={artist.role}
                      onChange={(e) => {
                        update({
                          additionalArtists: state.additionalArtists.map((a) =>
                            a.id === artist.id ? { ...a, role: e.target.value as AdditionalArtist["role"] } : a
                          ),
                        });
                      }}
                      className="w-full sm:w-36 appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
                    >
                      <option value="primary">Primary Artist</option>
                      <option value="featuring">Featuring</option>
                      <option value="remixer">Remixer</option>
                    </select>
                    <button type="button" onClick={() => {
                      update({ additionalArtists: state.additionalArtists.filter((a) => a.id !== artist.id) });
                    }} className="text-white/30 hover:text-[#C30100] transition-colors self-center shrink-0 p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Label" hint={canEditLabel ? "Label name that appears on stores. Defaults to SongDis Ltd." : "Defaults to SongDis Ltd (Growth plan required to customize)"}>
            <div className="relative">
              <input
                value={canEditLabel ? state.label : "SongDis Ltd"}
                onChange={(e) => canEditLabel && update({ label: e.target.value })}
                placeholder="Your label name for this release"
                disabled={!canEditLabel}
                className={`w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-sm outline-none focus:border-[#C30100] transition-colors ${
                  canEditLabel
                    ? "text-white placeholder:text-white/25"
                    : "text-white/50 cursor-not-allowed pr-32"
                }`}
              />
              {!canEditLabel && (
                // Was pointing at /subscription — a route that does not exist in
                // this app — and opening in a new tab. `pr-32` above keeps the
                // value from running underneath it.
                <Link
                  href="/dashboard/settings?tab=subscription"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 hover:text-amber-300 hover:underline whitespace-nowrap"
                >
                  Upgrade to Growth
                </Link>
              )}
            </div>
          </Field>

          <Field label="Meta data language" hint="What language is your song title written in?">
            <DashSelect value={state.metaLanguage} onChange={(v) => update({ metaLanguage: v })}
              options={["English", "French", "Spanish", "Yoruba", "Igbo", "Hausa"]} />
          </Field>

          <Field
            label={isEditing ? "UPC Code" : "UPC Code (Optional)"}
            hint={isEditing
              ? "This identifies your release on streaming platforms and cannot be changed."
              : "Leave empty. We will give you one for free."}
          >
            <input
              value={state.upcCode}
              onChange={(e) => update({ upcCode: e.target.value })}
              readOnly={isEditing}
              disabled={isEditing}
              placeholder={isEditing ? "Not assigned yet" : "Auto generated if left blank"}
              className={[
                "w-full border rounded-lg px-4 py-3 font-body text-sm outline-none transition-colors",
                isEditing
                  ? "bg-[#0A0606] border-white/[0.06] text-white/40 cursor-not-allowed"
                  : "bg-[#0E0808] border-white/10 text-white placeholder:text-white/25 focus:border-[#C30100]",
              ].join(" ")}
            />
          </Field>

          <Field label="C Line (Copyright)" hint="Who owns the song/lyrics?">
            <DashSelect value={state.cLine} onChange={(v) => update({ cLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="P Line" hint="Who owns the audio recording?">
            <DashSelect value={state.pLine} onChange={(v) => update({ pLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="Release Type" hint="1–3 songs = Single. 4–6 = EP. 7+ = Album.">
            <input
              value={state.releaseType === "single" ? "Single" : state.noOfTracks >= 7 ? "Album" : state.noOfTracks >= 4 ? "EP" : "Album/EP"}
              disabled
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white/50 text-sm outline-none cursor-not-allowed" />
          </Field>

          <Field label="No of Tracks" hint={state.releaseType === "single" ? "Singles can only have 1 track." : "Estimated track count. Actual tracks are determined by files uploaded in the next step."}>
            <input type="number" min={state.releaseType === "single" ? 1 : 2} max={50} value={state.noOfTracks}
              disabled={state.releaseType === "single"}
              onChange={(e) => update({ noOfTracks: Math.max(state.releaseType === "single" ? 1 : 2, parseInt(e.target.value) || 1) })}
              className={["w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors",
                state.releaseType === "single" ? "text-white/50 cursor-not-allowed" : ""].join(" ")} />
          </Field>

          <Field label="Explicit Content" hint="Does your song contain strong language or adult content?">
            <DashSelect value={state.explicitContent} onChange={(v) => update({ explicitContent: v })} options={["Yes", "No", "Clean"]} />
          </Field>

          <Field label="Cover Art AI Use" hint="If you used AI to make your cover art, notify it.">
            <DashSelect value={state.coverArtAiUse} onChange={(v) => update({ coverArtAiUse: v })} options={["None", "Partial AI", "Fully AI Generated"]} />
          </Field>
        </div>

        <div className="mt-8">
          <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
        </div>
      </div>

      {artworkGen && (
        <ArtworkGenerator
          onClose={() => setArtworkGen(false)}
        />
      )}

      {showProfileModal && (
        <ArtistProfileModal
          profile={null}
          onClose={() => setShowProfileModal(false)}
          onSave={handleNewProfileSaved}
        />
      )}
    </>
  );
}

function ArtistNameInput({ profiles, value, onChange }: { profiles: ArtistProfile[]; value: string; onChange: (name: string, artistId?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = profiles.filter((p) => {
    const name = p.stageName || p.fullName;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); }}
        onFocus={() => setOpen(true)}
        placeholder="Type or select artist..."
        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-2.5 font-body text-white text-xs placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A0808] border border-white/[0.07] rounded-lg shadow-xl max-h-40 overflow-y-auto">
          {filtered.map((p) => {
            const name = p.stageName || p.fullName;
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(name, p.id); setSearch(name); setOpen(false); }}
                className="w-full text-left px-4 py-2 font-body text-white text-xs hover:bg-white/[0.05] transition-colors"
              >
                {name}
                {p.fullName && p.stageName ? <span className="text-white/30 ml-1">({p.fullName})</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UploadIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function AyoIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#C30100"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SparkleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }