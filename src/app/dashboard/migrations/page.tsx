"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/components/ui/Toast";
import {
  fetchMigrations,
  searchMigrationArtists,
  fetchArtistReleases,
  previewRelease,
  initiateMigration,
  uploadAudio,
  type Migration,
  type SpotifyArtist,
  type SpotifyRelease,
  type ReleaseDetail,
  type SpotifyTrack,
} from "@/lib/api/music";


type View = "list" | "new";
type Step = "search" | "releases" | "details" | "confirm";

interface FeaturedArtist {
  name: string;
  spotify_id?: string;
}

interface Collaborator {
  id: string;
  name: string;
  role: string;
  type: "producer" | "writer" | "performer";
}

interface ReleaseFormState {
  upload_type: string;
  release_title: string;
  primary_artist: string;
  release_date?: string;
  upc_code?: string;
  album_art_url?: string;
  isrc_code?: string;
  total_tracks?: number;
  tracks?: ExtendedTrack[];
  spotify_album_id?: string;
  spotify_metadata?: unknown;
  metadata_source?: unknown;
  featured_artists?: FeaturedArtist[];
  collaborators?: Collaborator[];
  label: string;
  c_line: string;
  p_line: string;
  cover_art_ai_use: "None" | "All" | "Some";
  stereo_ai_use: "None" | "All" | "Some";
  primary_genre: string;
  secondary_genre: string;
  metadata_language: string;
  territory_rights: "worldwide" | "africa" | "custom";
  platforms: string[];
  audio_file_path?: string;
  s3_key?: string;
  uploadProgress?: number;
  uploading?: boolean;
  uploaded?: boolean;
  identifying?: boolean;
  isrc_source?: "spotify" | "acrcloud" | "manual";
}

interface ExtendedTrack extends SpotifyTrack {
  uploadProgress?: number;
  uploading?: boolean;
  uploaded?: boolean;
  identifying?: boolean;
  isrc_source?: "spotify" | "acrcloud" | "manual";
  featured_artists?: FeaturedArtist[];
  collaborators?: Collaborator[];
}


const STEPS: { key: Step; label: string }[] = [
  { key: "search", label: "Find Artist" },
  { key: "releases", label: "Pick Releases" },
  { key: "details", label: "Fill Details" },
  { key: "confirm", label: "Submit" },
];

const GENRES = [
  "Afrobeats", "Afropop", "Highlife", "Fuji", "Hip-Hop",
  "R&B", "Pop", "Gospel", "Reggae", "Jazz", "Electronic",
];

const SUB_GENRES: Record<string, string[]> = {
  Afrobeats: ["Afropop", "Afro-fusion", "Alté", "Afro-swing", "Afro-house", "Amapiano"],
  "Hip-Hop": ["Trap", "Drill", "Afro-trap", "Conscious Rap", "Grime"],
  "R&B": ["Contemporary R&B", "Neo-Soul", "Soul", "Funk"],
  Pop: ["Dance Pop", "Electropop", "Indie Pop", "K-Pop"],
  Gospel: ["Contemporary Gospel", "Traditional Gospel", "Gospel Rap"],
  Reggae: ["Dancehall", "Roots Reggae", "Dub"],
  Electronic: ["House", "Techno", "Trance", "EDM", "Afro-house"],
  Jazz: ["Smooth Jazz", "Contemporary Jazz", "Fusion"],
  Highlife: ["Contemporary Highlife", "Hiplife"],
  Fuji: ["Traditional Fuji", "Contemporary Fuji"],
};

const WRITER_ROLES = ["Songwriter", "Composer", "Lyricist", "Arranger", "Adapter"];
const PRODUCER_ROLES = ["Producer", "Co-Producer", "Mixing Engineer", "Mastering Engineer", "Recording Engineer", "Sound Engineer"];
const PERFORMER_ROLES = ["Lead Vocals", "Background Vocals", "Guitar", "Bass Guitar", "Drums", "Keyboards", "Piano", "Violin", "Saxophone", "Trumpet", "DJ", "Rap", "Percussion"];
const COLLAB_TYPE_ROLES: Record<string, string[]> = { producer: PRODUCER_ROLES, writer: WRITER_ROLES, performer: PERFORMER_ROLES };

const ALL_PLATFORMS = ["Spotify", "Apple Music", "Tidal", "Amazon Music", "YouTube Music", "Deezer", "Pandora", "SoundCloud", "Boomplay", "Audiomack", "iHeartRadio", "Napster", "Anghami"];

const EMPTY_FORM: Omit<ReleaseFormState, "release_title" | "primary_artist" | "upload_type"> = {
  label: "", c_line: "", p_line: "",
  cover_art_ai_use: "None", stereo_ai_use: "None",
  primary_genre: "", secondary_genre: "",
  metadata_language: "English", territory_rights: "worldwide",
  platforms: [], tracks: [], featured_artists: [], collaborators: [],
};


export default function MigrationsPage() {
  const [view, setView] = useState<View>("list");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto">
        {view === "list" ? (
          <MigrationList onStartNew={() => setView("new")} />
        ) : (
          <MigrationWizard onBack={() => setView("list")} onSuccess={() => setView("list")} />
        )}
      </div>
    </DashboardLayout>
  );
}


function MigrationList({ onStartNew }: { onStartNew: () => void }) {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMigrations();
        if (!res.error && res.data) {
          setMigrations(Array.isArray(res.data) ? res.data : []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-white uppercase text-xl tracking-wide">Migrations</h1>
          <p className="font-body text-white/50 text-sm mt-1">Transfer releases from another distributor — your ISRCs stay intact</p>
        </div>
        <button onClick={onStartNew}
          className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-5 py-3 transition-colors flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Start a Migration
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-[#1A0808] to-[#0E0808] rounded-2xl p-5 border border-white/[0.06]">
        <p className="font-heading text-white/40 uppercase text-[10px] tracking-[0.25em] mb-3">How it works</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { num: "1", text: "Search your artist on Spotify" },
            { num: "2", text: "Select releases to migrate" },
            { num: "3", text: "Fill details & upload audio" },
            { num: "4", text: "We distribute to all platforms" },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C30100]/20 flex items-center justify-center shrink-0">
                <span className="font-heading text-[#C30100] text-xs">{item.num}</span>
              </div>
              <p className="font-body text-white/50 text-xs leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      ) : migrations.length === 0 ? (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C30100]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="font-heading text-white uppercase text-sm tracking-widest mb-2">No migrations yet</h3>
          <p className="font-body text-white/40 text-sm max-w-sm mx-auto mb-6">
            Bring your releases from DistroKid, TuneCore, or any other distributor.
          </p>
          <button onClick={onStartNew}
            className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-6 py-3 transition-colors">
            Start your first migration
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {migrations.map((m) => (
            <div key={m.id} className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                {m.music_upload?.album_art_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.music_upload.album_art_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-white text-sm font-medium truncate">
                  {m.music_upload?.release_title ?? (m.draft?.form_data as Record<string, unknown>)?.releaseTitle as string ?? "Untitled"}
                </p>
                <p className="font-body text-white/40 text-xs truncate">
                  {m.music_upload?.primary_artist ?? (m.draft?.form_data as Record<string, unknown>)?.primaryArtist as string ?? "—"}
                </p>
              </div>
              <span className={[
                "text-xs font-heading tracking-wider px-2.5 py-1 rounded-full shrink-0 uppercase",
                m.status === "submitted"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-amber-500/20 text-amber-400",
              ].join(" ")}>
                {m.status === "submitted" ? "Submitted" : "Draft"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function MigrationWizard({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { success: toastSuccess } = useToast();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [releases, setReleases] = useState<SpotifyRelease[]>([]);
  const [releaseSearch, setReleaseSearch] = useState("");
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewCache, setPreviewCache] = useState<Record<string, ReleaseDetail>>({});
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [forms, setForms] = useState<Record<string, ReleaseFormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  /* Step 1: Search artists */
  const searchArtists = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setArtists([]);
    try {
      const res = await searchMigrationArtists(query);
      if (!res.error && res.data) {
        setArtists(Array.isArray(res.data) ? res.data : []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  };

  /* Step 2: Pick artist → fetch releases */
  const pickArtist = async (artist: SpotifyArtist) => {
    setSelectedArtist(artist);
    setLoadingReleases(true);
    setStep("releases");
    try {
      const res = await fetchArtistReleases(artist.spotify_id);
      if (!res.error && res.data) {
        setReleases(res.data.releases || []);
      }
    } catch { /* ignore */ }
    setLoadingReleases(false);
  };

  /* Toggle release selection */
  const toggleRelease = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* Step 2→3: Fetch previews for selected releases */
  const proceedToDetails = async () => {
    setLoadingPreviews(true);
    try {
      const needed = Array.from(selectedIds).filter((id) => !previewCache[id]);
      const fresh: Record<string, ReleaseDetail> = {};
      await Promise.all(
        needed.map(async (id) => {
          try {
            const res = await previewRelease(id);
            if (!res.error && res.data) fresh[id] = res.data;
          } catch { /* ignore */ }
        })
      );
      const merged = { ...previewCache, ...fresh };
      setPreviewCache(merged);
      setForms((prev) => {
        const next = { ...prev };
        for (const id of Array.from(selectedIds)) {
          if (!next[id]) {
            const detail = merged[id];
            if (detail) next[id] = { ...EMPTY_FORM, ...detail };
          }
        }
        return next;
      });
      setStep("details");
    } finally {
      setLoadingPreviews(false);
    }
  };

  /* Update a release form */
  const updateForm = (id: string, patch: Partial<ReleaseFormState>) =>
    setForms((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  /* Update a track within a release */
  const updateTrack = (id: string, ti: number, patch: Partial<ExtendedTrack>) => {
    setForms((p) => {
      const tracks = [...(p[id]?.tracks ?? [])];
      tracks[ti] = { ...tracks[ti], ...patch };
      return { ...p, [id]: { ...p[id], tracks } };
    });
  };

  /* Upload audio for a single release */
  const uploadSingleAudio = async (releaseId: string, file: File) => {
    updateForm(releaseId, { uploading: true, uploadProgress: 0 });
    try {
      const result = await uploadAudio(file, (p) => updateForm(releaseId, { uploadProgress: p.percentage }));
      updateForm(releaseId, {
        audio_file_path: result.file_url,
        s3_key: result.s3_key,
        uploading: false,
        uploaded: true,
        uploadProgress: 100,
      });
    } catch {
      updateForm(releaseId, { uploading: false, uploaded: false });
    }
  };

  /* Upload audio for an album track */
  const uploadTrackAudio = async (releaseId: string, ti: number, file: File) => {
    updateTrack(releaseId, ti, { uploading: true, uploadProgress: 0 });
    try {
      const result = await uploadAudio(file, (p) => updateTrack(releaseId, ti, { uploadProgress: p.percentage }));
      updateTrack(releaseId, ti, {
        audio_file_path: result.file_url,
        s3_key: result.s3_key,
        uploading: false,
        uploaded: true,
        uploadProgress: 100,
      });
    } catch {
      updateTrack(releaseId, ti, { uploading: false, uploaded: false });
    }
  };

  /* Check all forms valid */
  const allFormsValid = () => {
    for (const id of Array.from(selectedIds)) {
      const f = forms[id];
      if (!f || !f.label || !f.c_line || !f.p_line || !f.primary_genre) return false;
    }
    return true;
  };

  /* Submit migration */
  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        releases: Array.from(selectedIds).map((id) => {
          const f = forms[id];
          const detail = previewCache[id];
          return {
            spotify_album_id: id,
            upload_type: f.upload_type,
            release_title: f.release_title,
            primary_artist: f.primary_artist,
            release_date: f.release_date,
            upc_code: f.upc_code,
            album_art_url: f.album_art_url,
            isrc_code: f.isrc_code,
            spotify_metadata: detail?.spotify_metadata ?? null,
            metadata_source: detail?.metadata_source ?? null,
            label: f.label,
            c_line: f.c_line,
            p_line: f.p_line,
            cover_art_ai_use: f.cover_art_ai_use,
            stereo_ai_use: f.stereo_ai_use,
            primary_genre: f.primary_genre,
            secondary_genre: f.secondary_genre,
            metadata_language: f.metadata_language,
            territory_rights: "worldwide",
            platforms: ALL_PLATFORMS,
            audio_file_path: f.audio_file_path,
            s3_key: f.s3_key,
            featured_artists: f.featured_artists ?? [],
            collaborators: f.collaborators ?? [],
            tracks: f.tracks?.map((t) => ({
              track_title: t.track_title,
              isrc_code: t.isrc_code,
              audio_file_path: t.audio_file_path,
              s3_key: t.s3_key,
              explicit_content: t.explicit_content,
              duration: t.duration,
              track_number: t.track_number,
              featured_artists: t.featured_artists ?? [],
              collaborators: t.collaborators ?? [],
            })),
          };
        }),
      };
      const res = await initiateMigration(payload);
      if (res.error) {
        setSubmitError(res.error);
      } else {
        toastSuccess("Migration submitted!", "Your migration is now being processed.");
        onSuccess();
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <button onClick={onBack} className="font-body text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Migrations
      </button>
      <div>
        <h1 className="font-heading text-white uppercase text-xl tracking-wide">Start a Migration</h1>
        <p className="font-body text-white/50 text-sm mt-1">Find your artist on Spotify, pick your releases, and we handle the rest</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map(({ label }, i) => (
          <div key={i} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading transition-all",
                i < stepIndex ? "bg-green-500/20 text-green-400" : i === stepIndex ? "bg-[#C30100]/20 text-[#C30100] ring-4 ring-[#C30100]/10" : "bg-white/5 text-white/30",
              ].join(" ")}>
                {i < stepIndex ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : i + 1}
              </div>
              <span className={["text-[10px] font-heading tracking-wider hidden sm:block", i === stepIndex ? "text-[#C30100]" : "text-white/30"].join(" ")}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={["flex-1 h-px mx-2 mb-4 transition-all", i < stepIndex ? "bg-green-500/30" : "bg-white/10"].join(" ")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === "search" && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-white uppercase text-sm tracking-widest mb-1">Find your artist on Spotify</h2>
            <p className="font-body text-white/40 text-xs">Search by artist name. We will show all their releases so you can pick what to migrate.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchArtists()}
              placeholder="e.g. Burna Boy, Wizkid, Tems..."
              className="flex-1 min-h-[48px] bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
            <button onClick={searchArtists} disabled={searching || !query.trim()}
              className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-lg px-5 py-3 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 min-h-[48px]">
              {searching ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
              <span className="hidden sm:inline">{searching ? "Searching..." : "Search"}</span>
            </button>
          </div>
          {artists.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em]">Select your artist</p>
              {artists.map((a, i) => (
                <button key={`${a.spotify_id}-${i}`} onClick={() => pickArtist(a)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-[#C30100]/40 hover:bg-[#C30100]/5 transition-all text-left group">
                  {a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm font-medium group-hover:text-[#C30100] transition-colors">{a.name}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 group-hover:text-[#C30100] shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Pick Releases */}
      {step === "releases" && (
        <div className="flex flex-col gap-4">
          {selectedArtist && (
            <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4 flex items-center gap-3">
              {selectedArtist.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedArtist.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-body text-white text-sm font-medium">{selectedArtist.name}</p>
                <button onClick={() => { setStep("search"); setSelectedArtist(null); setReleases([]); setSelectedIds(new Set()); }}
                  className="font-body text-[#C30100] text-xs hover:underline">
                  Search a different artist
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-white uppercase text-sm tracking-widest mb-1">Select releases to migrate</h2>
                <p className="font-body text-white/40 text-xs">Pick one or more. You can upload audio now or save as draft.</p>
              </div>
              {releases.length > 0 && (
                <span className="font-body text-white/30 text-xs shrink-0">{releases.length} total</span>
              )}
            </div>

            {releases.length > 6 && (
              <input
                type="text"
                value={releaseSearch}
                onChange={(e) => setReleaseSearch(e.target.value)}
                placeholder="Filter releases..."
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-2.5 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
              />
            )}

            {loadingReleases ? (
              <div className="flex justify-center py-10">
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              </div>
            ) : releases.length === 0 ? (
              <p className="font-body text-white/30 text-sm text-center py-8">No releases found for this artist.</p>
            ) : (
              (() => {
                const filtered = releaseSearch.trim()
                  ? releases.filter((r) => r.name.toLowerCase().includes(releaseSearch.toLowerCase()))
                  : releases;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                    {filtered.map((r, i) => {
                      const sel = selectedIds.has(r.id);
                      return (
                        <button key={`${r.id}-${i}`} onClick={() => toggleRelease(r.id)}
                          className={[
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            sel ? "border-[#C30100] bg-[#C30100]/5" : "border-white/[0.06] hover:border-white/20",
                          ].join(" ")}>
                          {r.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-white text-sm font-medium truncate">{r.name}</p>
                            <p className="font-body text-white/30 text-xs capitalize">
                              {r.type} · {r.total_tracks} track{r.total_tracks !== 1 ? "s" : ""} · {r.release_date?.substring(0, 4)}
                            </p>
                          </div>
                          <div className={[
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            sel ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
                          ].join(" ")}>
                            {sel && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()
            )}

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <p className="font-body text-white/60 text-sm">{selectedIds.size} release{selectedIds.size > 1 ? "s" : ""} selected</p>
                <button onClick={proceedToDetails} disabled={loadingPreviews}
                  className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-5 py-2.5 transition-colors disabled:opacity-40 flex items-center gap-2">
                  {loadingPreviews && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}
                  {loadingPreviews ? "Loading..." : "Continue"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === "details" && (
        <div className="flex flex-col gap-6">
          {Array.from(selectedIds).map((id) => {
            const f = forms[id];
            if (!f) return null;
            return (
              <ReleaseDetailsForm
                key={id}
                form={f}
                onChange={(patch) => updateForm(id, patch)}
                onTrackChange={(ti, patch) => updateTrack(id, ti, patch)}
                onUploadSingleAudio={(file) => uploadSingleAudio(id, file)}
                onUploadTrackAudio={(ti, file) => uploadTrackAudio(id, ti, file)}
              />
            );
          })}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep("releases")}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3 hover:border-white/40 transition-colors">
              Back
            </button>
            <button onClick={() => setStep("confirm")} disabled={!allFormsValid()}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full bg-[#C30100] hover:bg-[#C30100]/80 py-3 transition-colors disabled:opacity-40">
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-heading text-white uppercase text-sm tracking-widest">Review before submitting</h2>
            {Array.from(selectedIds).map((id) => {
              const f = forms[id];
              if (!f) return null;
              const hasAudio = f.upload_type === "Single"
                ? !!f.audio_file_path
                : (f.tracks?.every((t) => !!t.audio_file_path) ?? false);
              return (
                <div key={id} className="border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {f.album_art_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.album_art_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-body text-white text-sm font-medium">{f.release_title}</p>
                        <p className="font-body text-white/40 text-xs">{f.primary_artist} · {f.upload_type}</p>
                      </div>
                    </div>
                    <span className={[
                      "text-xs font-heading tracking-wider px-2.5 py-1 rounded-full shrink-0 uppercase",
                      hasAudio ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400",
                    ].join(" ")}>
                      {hasAudio ? "Audio ready" : "No audio"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      ["Label", f.label],
                      ["Genre", f.primary_genre],
                      ["Platforms", "All platforms"],
                      ["Territory", "Worldwide"],
                      ["C Line", f.c_line],
                      ["Language", f.metadata_language],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white/[0.03] rounded-lg p-2">
                        <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">{k}</p>
                        <p className="font-body text-white text-xs truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="font-body text-amber-400/80 text-xs leading-relaxed">
                <strong>Reminder:</strong> Removing your song from your previous distributor too soon can cause you to lose your stream counts and playlist placements. Leave it live for at least 4-6 weeks before taking it down.
              </p>
            </div>
            {submitError && (
              <p className="font-body text-[#C30100] text-xs bg-[#C30100]/5 border border-[#C30100]/20 rounded-xl p-3">{submitError}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep("details")}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3 hover:border-white/40 transition-colors">
              Back
            </button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full bg-[#C30100] hover:bg-[#C30100]/80 py-3 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}
              {submitting ? "Submitting..." : "Submit Migration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function ReleaseDetailsForm({
  form,
  onChange,
  onTrackChange,
  onUploadSingleAudio,
  onUploadTrackAudio,
}: {
  form: ReleaseFormState;
  onChange: (p: Partial<ReleaseFormState>) => void;
  onTrackChange: (i: number, p: Partial<ExtendedTrack>) => void;
  onUploadSingleAudio: (file: File) => void;
  onUploadTrackAudio: (ti: number, file: File) => void;
}) {
  const audioRef = useRef<HTMLInputElement>(null);
  const subGenres = SUB_GENRES[form.primary_genre] ?? [];

  const addCollaborator = () =>
    onChange({ collaborators: [...(form.collaborators ?? []), { id: `c_${Date.now()}`, name: "", role: "", type: "producer" }] });
  const updateCollaborator = (id: string, patch: object) =>
    onChange({ collaborators: (form.collaborators ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeCollaborator = (id: string) =>
    onChange({ collaborators: (form.collaborators ?? []).filter((c) => c.id !== id) });

  return (
    <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-white/[0.06] bg-white/[0.02]">
        {form.album_art_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.album_art_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-body text-white text-sm font-medium truncate">{form.release_title}</p>
          <p className="font-body text-white/40 text-xs">{form.primary_artist} · {form.upload_type}</p>
          {form.upc_code && <p className="font-body text-white/30 text-xs mt-0.5">UPC: {form.upc_code}</p>}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Release info */}
        <div>
          <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] mb-3">Release Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Label *">
              <input type="text" value={form.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Your label name"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            </Field>
            <Field label="Primary genre *">
              <select value={form.primary_genre} onChange={(e) => onChange({ primary_genre: e.target.value, secondary_genre: "" })}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors appearance-none">
                <option value="">Select genre...</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Secondary genre">
              <select value={form.secondary_genre} onChange={(e) => onChange({ secondary_genre: e.target.value })}
                disabled={!form.primary_genre || subGenres.length === 0}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors appearance-none disabled:opacity-40">
                <option value="">{form.primary_genre ? "Select sub-genre..." : "Select primary genre first"}</option>
                {subGenres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="&#169; C Line *">
              <input type="text" value={form.c_line} onChange={(e) => onChange({ c_line: e.target.value })} placeholder="2024 Your Label"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            </Field>
            <Field label="&#8471; P Line *">
              <input type="text" value={form.p_line} onChange={(e) => onChange({ p_line: e.target.value })} placeholder="2024 Your Label"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            </Field>
            <Field label="Cover art AI use">
              <select value={form.cover_art_ai_use} onChange={(e) => onChange({ cover_art_ai_use: e.target.value as "None" | "All" | "Some" })}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors appearance-none">
                <option>None</option><option>All</option><option>Some</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Single: audio upload */}
        {form.upload_type === "Single" && (
          <div>
            <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] mb-2">Audio File</p>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadSingleAudio(f); }} />
            <button onClick={() => audioRef.current?.click()}
              className={[
                "w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-colors",
                form.uploaded ? "border-green-500/40 bg-green-500/5" : form.uploading ? "border-[#C30100]/40 bg-[#C30100]/5" : "border-white/10 hover:border-white/25",
              ].join(" ")}>
              {form.uploading ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <p className="font-body text-white/50 text-sm">Uploading... {form.uploadProgress ?? 0}%</p>
                  <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C30100] rounded-full transition-all" style={{ width: `${form.uploadProgress ?? 0}%` }} />
                  </div>
                </>
              ) : form.uploaded ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="font-body text-green-400 text-sm">Audio uploaded</p>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="font-body text-white/50 text-sm">Click to upload audio</p>
                  <p className="font-body text-white/25 text-xs">WAV, MP3, FLAC</p>
                </>
              )}
            </button>
          </div>
        )}

        {/* Collaborators */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em]">Collaborators</p>
            <button onClick={addCollaborator} className="font-body text-[#C30100] text-xs hover:underline flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
          {(form.collaborators ?? []).length === 0 ? (
            <p className="font-body text-white/20 text-xs">No collaborators added yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(form.collaborators ?? []).map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={c.name} placeholder="Name"
                    onChange={(e) => updateCollaborator(c.id, { name: e.target.value })}
                    className="flex-1 bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-xs placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
                  <div className="flex gap-2">
                    <select value={c.type}
                      onChange={(e) => updateCollaborator(c.id, { type: e.target.value, role: "" })}
                      className="flex-1 sm:flex-none bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors appearance-none">
                      <option value="writer">Writer</option>
                      <option value="producer">Producer</option>
                      <option value="performer">Performer</option>
                    </select>
                    <select value={c.role}
                      onChange={(e) => updateCollaborator(c.id, { role: e.target.value })}
                      className="flex-1 sm:flex-none bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors appearance-none">
                      <option value="">Role</option>
                      {(COLLAB_TYPE_ROLES[c.type] ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => removeCollaborator(c.id)} className="text-white/20 hover:text-[#C30100] transition-colors px-1 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Album tracks */}
        {form.upload_type === "Album/EP" && (form.tracks ?? []).length > 0 && (
          <div>
            <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] mb-3">Tracks</p>
            <div className="flex flex-col gap-3">
              {(form.tracks ?? []).map((track, i) => (
                <AlbumTrackRow
                  key={i}
                  track={track}
                  index={i}
                  onUpload={(file) => onUploadTrackAudio(i, file)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function AlbumTrackRow({
  track,
  index,
  onUpload,
}: {
  track: ExtendedTrack;
  index: number;
  onUpload: (file: File) => void;
}) {
  const audioRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-heading text-white/30 text-xs">#{index + 1}</span>
        <p className="font-body text-white text-sm font-medium flex-1 truncate">{track.track_title}</p>
        {track.isrc_code && (
          <span className="font-body text-white/30 text-[10px]">ISRC: {track.isrc_code}</span>
        )}
      </div>
      <input ref={audioRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      <button onClick={() => audioRef.current?.click()}
        className={[
          "w-full border border-dashed rounded-lg py-4 flex items-center justify-center gap-2 transition-colors text-xs",
          track.uploaded ? "border-green-500/30 text-green-400" : track.uploading ? "border-[#C30100]/30 text-[#C30100]" : "border-white/10 text-white/40 hover:border-white/25",
        ].join(" ")}>
        {track.uploading ? (
          <>
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            Uploading... {track.uploadProgress ?? 0}%
          </>
        ) : track.uploaded ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Audio uploaded
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload audio for this track
          </>
        )}
      </button>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-body text-white/50 text-xs block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
