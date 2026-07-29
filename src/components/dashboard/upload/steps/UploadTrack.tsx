"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { UploadState, Contributor, AdditionalArtist, StepFieldErrors } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";
import { uploadAudio } from "@/lib/api/music";
import { getProfile } from "@/lib/api/auth";
import type { UploadProgress } from "@/lib/api/music";
import type { ArtistProfile } from "@/components/dashboard/settings/ArtistProfileModal";

/* --- Genre / Sub-genre data (matches old app) --------------- */

const GENRE_DATA: Record<string, string[]> = {
  Afrobeats: ["Afropop", "Afro-fusion", "Alté (Alternative)", "Afro-swing / Afro-bashment", "Afro-house", "Amapiano-infused Afrobeats"],
  "Hip Hop/Rap": ["Alternative Rap", "East Coast Rap", "West Coast Rap", "Gangsta Rap", "Trap", "Drill"],
  Pop: ["Dance Pop", "Electropop", "Teen Pop", "K-Pop", "J-Pop", "Indie Pop"],
  "R&B/Soul": ["Contemporary R&B", "Neo-Soul", "Soul", "Funk"],
  Rock: ["Alternative Rock", "Hard Rock", "Indie Rock", "Pop Rock"],
  Electronic: ["House", "Techno", "Trance", "Dubstep", "EDM"],
  Jazz: ["Smooth Jazz", "Contemporary Jazz", "Fusion"],
  Classical: ["Orchestral", "Chamber Music", "Opera"],
  Country: ["Contemporary Country", "Country Pop"],
  Reggae: ["Dancehall", "Roots Reggae", "Dub"],
  World: ["Afro-Beat", "Latin", "Reggaeton", "Highlife", "Fuji"],
  Gospel: ["Contemporary Gospel", "Traditional Gospel", "Gospel Rap"],
};

const GENRE_OPTIONS = Object.keys(GENRE_DATA);

/* --- Role constants ----------------------------------------- */

const WRITER_ROLES = ["Adapter", "Arranger", "Composer", "Librettist", "Lyricist", "Songwriter", "Transcriber", "Vocal Adaptation"];

const PRODUCTION_ROLES = ["Assistant Engineer", "Co-Producer", "Graphic Design", "Guitar Technician", "Mastering Engineer", "Mixing Engineer", "Producer", "Production Assistant", "Recording Engineer", "Sound Engineer", "Vocal Engineer"];

const PERFORMER_ROLES = [
  "12-String Guitar", "Accordion", "Acoustic Guitar", "Actor", "Alto Saxophone", "Alto Solo",
  "Background Vocals", "Banjo", "Baritone Saxophone", "Baritone Solo", "Bass Clarinet",
  "Bass Guitar", "Bass Trombone", "Bassoon", "Bells", "Bongos", "Cajon", "Cello", "Choir",
  "Choir Master", "Chorus", "Clarinet", "Classical Guitar", "Clavier", "Conductor", "Congas",
  "Cornet", "Countertenor Solo", "DJ", "Djembe", "Double Bass", "Drums", "Electric Guitar",
  "Ensemble", "Fiddle", "First Violin", "Flugelhorn", "Flute", "Guitar", "Hammond Organ",
  "Harmonica", "Harmony Vocals", "Harp", "Harpsichord", "Horn", "Keyboards", "Kora",
  "Lead Guitar", "Lead Vocals", "Lute", "Mandolin", "Metallophone", "Mezzo-Soprano Solo",
  "Mixed Artist", "Music Director", "Oboe", "Orchestra", "Organ", "Pedal Steel Guitar",
  "Percussion", "Piano", "Piccolo", "Programming", "Rap", "Recorder", "Rhodes Piano",
  "Rhythm Guitar", "Sampled Artist", "Saxophone", "Second Violin", "Sitar",
  "Soprano Saxophone", "Soprano Solo", "Steel Guitar", "Synthesizer", "Tabla", "Tambourine",
  "Tenor Saxophone", "Tenor Solo", "Timbales", "Timpani", "Trombone", "Trumpet", "Tuba",
  "Ukulele", "Upright Bass", "Viola", "Viola de Gamba", "Violin", "Vocal Ensemble",
  "Vocal Solo", "Vocals", "Whistle", "Xylophone",
];

/* --- Helpers ------------------------------------------------ */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px] leading-relaxed">{hint}</p>}
    </div>
  );
}

function DashSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

function SearchableRoleSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-sm outline-none focus:border-[#C30100] transition-colors pr-8 truncate"
      >
        {value || <span className="text-white/25">{placeholder}</span>}
      </button>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-[#1A0808] border border-white/10 shadow-xl">
          <div className="sticky top-0 p-2 bg-[#1A0808]">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#0E0808] border border-white/10 rounded px-3 py-1.5 font-body text-white text-xs outline-none"
            />
          </div>
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
              className="w-full text-left px-4 py-2 font-body text-white/70 text-xs hover:bg-white/5 hover:text-white transition-colors"
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-2 font-body text-white/30 text-xs">No matches</p>}
        </div>
      )}
    </div>
  );
}

/* --- Contributor Row ---------------------------------------- */

function ContributorRow({ contributor, roleOptions, onChange, onRemove, canRemove }: {
  contributor: Contributor;
  roleOptions: string[];
  onChange: (patch: Partial<Contributor>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <input
        value={contributor.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Name"
        className="flex-1 min-w-0 bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
      />
      <div className="w-full sm:w-44 shrink-0">
        <SearchableRoleSelect value={contributor.role} onChange={(v) => onChange({ role: v })} options={roleOptions} placeholder="Select role" />
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors shrink-0 p-1 self-end sm:self-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

/* --- Contributor Section ------------------------------------ */

function ContributorSection({ label, type, contributors, roleOptions, updateContributors }: {
  label: string;
  type: "writers" | "producers" | "performers";
  contributors: Contributor[];
  roleOptions: string[];
  updateContributors: (type: "writers" | "producers" | "performers", list: Contributor[]) => void;
}) {
  const add = () => {
    const newC: Contributor = { id: `${type}_${Date.now()}`, name: "", role: "", type: type.slice(0, -1) as Contributor["type"] };
    updateContributors(type, [...contributors, newC]);
  };

  const update = (idx: number, patch: Partial<Contributor>) => {
    const list = contributors.map((c, i) => i === idx ? { ...c, ...patch } : c);
    updateContributors(type, list);
  };

  const remove = (idx: number) => {
    updateContributors(type, contributors.filter((_, i) => i !== idx));
  };

  return (
    <SectionBox
      label={label}
      actionLabel="+ Add"
      onAction={add}
    >
      {contributors.length === 0 ? (
        <p className="font-body text-white/30 text-xs">No {label.toLowerCase()} added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contributors.map((c, i) => (
            <ContributorRow
              key={c.id}
              contributor={c}
              roleOptions={roleOptions}
              onChange={(patch) => update(i, patch)}
              onRemove={() => remove(i)}
              canRemove={true}
            />
          ))}
        </div>
      )}
    </SectionBox>
  );
}

/* --- Artist Name Input (type or select from profiles) ------- */
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

/* --- Shared UI primitives ------------------------------------ */

function SectionBox({ label, actionLabel, onAction, noAction, rightLabel, children }: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  noAction?: boolean;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#C30100]/25 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-white/70 text-xs font-semibold">{label}</p>
        {!noAction && actionLabel && (
          <button onClick={onAction} className="font-body text-[#C30100] text-xs hover:text-red-400 transition-colors">{actionLabel}</button>
        )}
        {rightLabel}
      </div>
      {children}
    </div>
  );
}

/* --- Mini Audio Player (per track) ---------------------------- */
function MiniAudioPlayer({ audioUrl, trackId }: { audioUrl: string; trackId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.play().catch(() => setPlaying(false)); } else { el.pause(); }
  }, [playing]);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button onClick={() => setPlaying(!playing)}
          className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="font-body text-white/40 text-[11px] shrink-0 tabular-nums w-16">{fmt(currentTime)} / {fmt(duration)}</span>
        <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative" onClick={handleSeek}>
          <div className="h-full bg-[#C30100] rounded-full pointer-events-none transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

/* -- Track completeness check ----------------------------------- */
function getTrackMissingFields(track: UploadState["tracks"][number]): string[] {
  const missing: string[] = [];
  if (!track.trackTitle?.trim()) missing.push("Title");
  if (!track.genre) missing.push("Genre");
  if (!track.subGenre) missing.push("Sub-genre");
  if (!track.explicitContent) missing.push("Explicit");
  return missing;
}

/* --- Track Entry (for album/EP track list) -------------------- */
function TrackEntry({ track, index, totalTracks, onEdit, onRemove, onMoveUp, onMoveDown }: {
  track: UploadState["tracks"][number];
  index: number;
  totalTracks: number;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const missingFields = getTrackMissingFields(track);
  const isComplete = missingFields.length === 0;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {/* Track Number */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0}
            className="text-white/20 hover:text-white/50 disabled:text-white/10 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <span className="font-heading text-white/60 text-sm w-6 h-6 flex items-center justify-center rounded bg-white/5">{index + 1}</span>
          <button onClick={onMoveDown} disabled={index === totalTracks - 1}
            className="text-white/20 hover:text-white/50 disabled:text-white/10 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-body text-white text-sm truncate">{track.trackTitle || "Untitled Track"}</p>
            {isComplete ? (
              <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" title="Complete" />
            ) : (
              <span className="shrink-0 w-2 h-2 rounded-full bg-[#C30100] animate-pulse" title={`Missing: ${missingFields.join(", ")}`} />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-body text-white/40 text-xs">{track.audioDuration || "0:00"}</span>
            {track.genre && <span className="font-body text-white/30 text-xs">{track.genre}</span>}
            {track.explicitContent === "Yes" && (
              <span className="font-body text-[#C30100] text-[10px] font-semibold bg-[#C30100]/10 px-1.5 py-0.5 rounded">E</span>
            )}
            {!isComplete && (
              <button onClick={onEdit} className="font-body text-[#C30100] text-[10px] font-semibold hover:text-red-400 transition-colors">
                {missingFields.length === 1 ? `Missing: ${missingFields[0]}` : `Missing: ${missingFields.length} fields`} — Click to edit
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} title="Edit track"
            className="p-2 text-white/30 hover:text-[#C30100] transition-colors rounded-lg hover:bg-white/5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={onRemove} title="Remove track"
            className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>

      {/* Mini Audio Player */}
      {track.audioUrl && <div className="px-4 pb-4"><MiniAudioPlayer audioUrl={track.audioUrl} trackId={track.id} /></div>}
    </div>
  );
}

/* -- Track Edit Modal ------------------------------------------- */
function TrackEditModal({ track, profiles, onSave, onClose }: {
  track: UploadState["tracks"][number];
  profiles: ArtistProfile[];
  onSave: (patch: Partial<UploadState["tracks"][number]>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(track.trackTitle);
  const [lyrics, setLyrics] = useState(track.lyrics);
  const [isrc, setIsrc] = useState(track.isrc);
  const [genre, setGenre] = useState(track.genre);
  const [subGenre, setSubGenre] = useState(track.subGenre);
  const [explicit, setExplicit] = useState(track.explicitContent);
  const [mixedVersion, setMixedVersion] = useState(track.mixedVersion);
  const [contributors, setContributors] = useState(track.contributors);
  const [additionalArtists, setAdditionalArtists] = useState(track.additionalArtists);

  const subGenres = genre ? (GENRE_DATA[genre] ?? []) : [];

  const updateContributors = (type: "writers" | "producers" | "performers", list: Contributor[]) => {
    setContributors((prev) => ({ ...prev, [type]: list }));
  };

  const handleSave = () => {
    onSave({
      trackTitle: title,
      lyrics,
      isrc,
      genre,
      subGenre,
      explicitContent: explicit,
      mixedVersion,
      contributors,
      additionalArtists,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-4 sm:py-6 px-3 sm:px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#1A0808] border border-white/[0.07] my-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-white uppercase text-lg tracking-wide">Edit Track {track.trackTitle ? `"${track.trackTitle}"` : ""}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Track Title */}
          <Field label="Track Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter track title"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          {/* Mixed Version */}
          <Field label="Mixed Version">
            <input value={mixedVersion} onChange={(e) => setMixedVersion(e.target.value)} placeholder="e.g. radio edit"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          {/* Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Explicit Content">
              <DashSelect value={explicit} onChange={setExplicit} options={["Yes", "No", "Clean"]} />
            </Field>
            <Field label="Genre">
              <DashSelect value={genre} onChange={(v) => { setGenre(v); setSubGenre(""); }} placeholder="Select genre" options={GENRE_OPTIONS} />
            </Field>
            <Field label="Sub-genre">
              <DashSelect value={subGenre} onChange={setSubGenre} placeholder={subGenres.length ? "Select sub-genre" : "Select genre first"} options={subGenres} />
            </Field>
          </div>

          {/* ISRC */}
          <Field label="ISRC">
            <input value={isrc} onChange={(e) => setIsrc(e.target.value)} placeholder="Auto-generated if blank"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          {/* Additional Artists */}
          <SectionBox
            label="Additional Artists"
            actionLabel="+ Add"
            onAction={() => {
              const newArtist: AdditionalArtist = {
                id: `artist_${Date.now()}_${Math.random()}`,
                name: "",
                artistId: "",
                role: "featuring",
              };
              setAdditionalArtists((prev) => [...prev, newArtist]);
            }}
          >
            {additionalArtists.length === 0 ? (
              <p className="font-body text-white/30 text-xs">No additional artists added yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {additionalArtists.map((artist) => (
                  <div key={artist.id} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <ArtistNameInput
                        profiles={profiles}
                        value={artist.name}
                        onChange={(name, artistId) => {
                          setAdditionalArtists((prev) =>
                            prev.map((a) => a.id === artist.id ? { ...a, name, artistId: artistId || a.artistId } : a)
                          );
                        }}
                      />
                    </div>
                    <select
                      value={artist.role}
                      onChange={(e) => {
                        setAdditionalArtists((prev) =>
                          prev.map((a) => a.id === artist.id ? { ...a, role: e.target.value as AdditionalArtist["role"] } : a)
                        );
                      }}
                      className="w-full sm:w-36 appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
                    >
                      <option value="primary">Primary Artist</option>
                      <option value="featuring">Featuring</option>
                      <option value="remixer">Remixer</option>
                    </select>
                    <button type="button" onClick={() => setAdditionalArtists((prev) => prev.filter((a) => a.id !== artist.id))}
                      className="text-white/30 hover:text-[#C30100] transition-colors self-center shrink-0 p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionBox>

          {/* Writers */}
          <ContributorSection label="Writers" type="writers" contributors={contributors.writers} roleOptions={WRITER_ROLES} updateContributors={updateContributors} />

          {/* Production */}
          <ContributorSection label="Production" type="producers" contributors={contributors.producers} roleOptions={PRODUCTION_ROLES} updateContributors={updateContributors} />

          {/* Performers */}
          <ContributorSection label="Performers" type="performers" contributors={contributors.performers} roleOptions={PERFORMER_ROLES} updateContributors={updateContributors} />

          {/* Lyrics */}
          <SectionBox label="Lyrics" noAction>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={4}
              className="w-full bg-transparent font-body text-white/50 text-sm outline-none resize-none placeholder:text-white/20"
              placeholder="Enter lyrics..." />
          </SectionBox>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-3.5 transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Main Component ----------------------------------------- */

interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  updateTrack: (trackId: string, patch: Partial<UploadState["tracks"][number]>) => void;
  removeTrack: (trackId: string) => void;
  reorderTrack: (fromIndex: number, toIndex: number) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  fieldErrors?: StepFieldErrors;
  clearFieldError?: (key: string) => void;
}

export default function UploadTrack({ state, update, updateTrack, removeTrack, reorderTrack, onBack, onContinue, onSaveDraft, fieldErrors = {}, clearFieldError }: Props) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const isSingle = state.releaseType === "single";
  const isMixtape = state.releaseType === "mixtape";
  const releaseLabel = isSingle ? "Single" : isMixtape ? "Mixtape" : "Album/EP";

  /* -- Local state for single mode audio preview ---------------- */
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tiktokStamp, setTiktokStamp] = useState("");
  const audioElRef = useRef<HTMLAudioElement>(null);

  /* -- Local state for upload progress (album/EP) --------------- */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>("");
  const tracksRef = useRef(state.tracks);
  tracksRef.current = state.tracks;

  /* -- Profiles for artist name input --------------------------- */
  const [profiles, setProfiles] = useState<ArtistProfile[]>([]);

  /* -- Track edit modal ----------------------------------------- */
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const editingTrack = state.tracks.find((t) => t.id === editingTrackId) ?? null;

  useEffect(() => {
    getProfile().then((res) => {
      if (res.error || !res.data) return;
      const raw = res.data as unknown as Record<string, unknown>;
      const list = Array.isArray(raw.profiles) ? raw.profiles : Array.isArray(res.data) ? res.data : Array.isArray(raw.data) ? raw.data : [];
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
    });
  }, []);

  /* -- Single mode: sync audioUrl with state --------------------
     When a release is reopened for editing there is no local File, only the
     URL of the audio already on S3. Without this the player never appeared
     and the form looked like it was demanding a fresh upload. */
  useEffect(() => {
    if (!audioFile) {
      setAudioUrl(state.audioUrl || null);
      return;
    }

    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    return () => URL.revokeObjectURL(url);
  }, [audioFile, state.audioUrl]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) { el.play().catch(() => setPlaying(false)); } else { el.pause(); }
  }, [playing]);

  /* -- Helpers -------------------------------------------------- */
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatDuration = (dur: number) => {
    const m = Math.floor(dur / 60);
    const s = Math.floor(dur % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const subGenres = state.genre ? (GENRE_DATA[state.genre] ?? []) : [];

  const updateContributors = (type: "writers" | "producers" | "performers", list: Contributor[]) => {
    update({ contributors: { ...state.contributors, [type]: list } });
  };

  /* -- Single mode: handle audio upload ------------------------- */
  const handleAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setUploading(true);
    setUploadProgress(null);

    try {
      const result = await uploadAudio(file, (p) => setUploadProgress(p));
      update({
        audioUrl: result.file_url,
        audioKey: result.s3_key,
        audioBucket: result.s3_bucket,
        audioFile: null,
      });

      const metadata = result.metadata as Record<string, unknown> | undefined;
      if (metadata?.duration) {
        const dur = metadata.duration as number;
        update({ audioDuration: formatDuration(dur) });
      }
    } catch (err) {
      console.error("Audio upload failed:", err);
      setAudioFile(null);
      update({ audioFile: null });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  /* -- Album/EP mode: handle multiple file uploads -------------- */
  const handleAlbumFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    const oversized = Array.from(files).filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      alert(`Files too large: ${oversized.map((f) => f.name).join(", ")}. Max size: 500MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadingFileName(file.name);
      setUploadProgress(null);

      const trackId = `track_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;

      try {
        const result = await uploadAudio(file, (p) => setUploadProgress(p));

        const metadata = result.metadata as Record<string, unknown> | undefined;
        const dur = metadata?.duration ? formatDuration(metadata.duration as number) : "0:00";

        const newTrack: UploadState["tracks"][number] = {
          id: trackId,
          trackTitle: file.name.replace(/\.[^/.]+$/, ""),
          audioUrl: result.file_url,
          audioKey: result.s3_key,
          audioBucket: result.s3_bucket,
          audioDuration: dur,
          isrc: "",
          lyrics: "",
          genre: state.genre || "",
          subGenre: state.subGenre || "",
          explicitContent: state.explicitContent || "Yes",
          contributors: {
            writers: state.primaryArtist ? [{ id: `writer_auto_${trackId}`, name: state.primaryArtist, role: "Songwriter", type: "writer" as const }] : [],
            producers: [],
            performers: state.primaryArtist ? [{ id: `performer_auto_${trackId}`, name: state.primaryArtist, role: "Lead Vocals", type: "performer" as const }] : [],
          },
          additionalArtists: [],
          tiktokTimestamp: 0,
          mixedVersion: "",
        };

        update({ tracks: [...tracksRef.current, newTrack] });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setUploading(false);
    setUploadingFileName("");
    setUploadProgress(null);

    // Reset the file input
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  /* -- Handle seek for single mode player ----------------------- */
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioElRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  };

  const setTikTokStampFromCurrent = () => {
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    setTiktokStamp(`${mins}:${String(secs).padStart(2, "0")}`);
    update({ tiktokTimestamp: Math.floor(currentTime) });
  };

  /* -- File input accept attribute ------------------------------ */
  const audioAccept = ".mp3,.wav,.flac,.aac,.ogg,.m4a,audio/mpeg,audio/wav,audio/flac,audio/aac,audio/ogg,audio/mp4";

  return (
    <div className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto">
      <StepHeader title="Upload Track" subtitle="Upload your audio files and complete all track information" />
      <StepProgress current={2} />

      <div className="flex flex-col gap-5">
        {/* Info notice */}
        <div className="border border-dashed border-[#C30100]/30 rounded-xl p-4">
          <p className="font-body text-white/60 text-xs font-semibold mb-2">Track Information:</p>
          <ul className="space-y-1">
            {(isSingle
              ? [
                  "Each track requires complete metadata including writers and performers",
                  "ISRC codes will be auto-generated if not provided",
                  "Singles can only have one track",
                ]
              : [
                  `Upload multiple audio files for your ${releaseLabel}`,
                  "Each track requires complete metadata including writers and performers",
                  "ISRC codes will be auto-generated if not provided",
                  `Minimum 2 tracks required for ${releaseLabel}`,
                  "Use the edit button on each track to set individual metadata",
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2 font-body text-white/40 text-xs">
                <span className="text-[#C30100] shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* -- Audio Drop Zone ------------------------------------ */}
        {isSingle ? (
          /* Single mode: existing behavior */
          <>
            <button
              onClick={() => !uploading && audioInputRef.current?.click()}
              disabled={uploading}
              className={[
                "w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 transition-colors",
                fieldErrors.audio ? "border-[#C30100] bg-[#C30100]/5" : (audioFile || state.audioKey || state.audioUrl) ? "border-[#C30100]/60 bg-[#C30100]/5" : "border-white/10 hover:border-white/25",
              ].join(" ")}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <p className="font-body text-white/70 text-sm">Uploading {audioFile?.name}...</p>
                  {uploadProgress && (
                    <div className="w-48 mt-1">
                      <p className="font-body text-white/50 text-xs text-center mb-1">{uploadProgress.percentage}%</p>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C30100] rounded-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AudioIcon />
                  {/* An existing release already has audio on S3 but no local
                      File, so without this the box read "drop your audio file"
                      and looked like it was demanding a re-upload. */}
                  {audioFile ? (
                    <>
                      <p className="font-body text-white/50 text-sm">{audioFile.name}</p>
                      <p className="font-body text-white/25 text-xs">WAV, MP3, FLAC · Max 500MB · 24-bit recommended</p>
                    </>
                  ) : (state.audioKey || state.audioUrl) ? (
                    <>
                      <p className="font-body text-white/70 text-sm">Your audio is already uploaded</p>
                      <p className="font-body text-white/25 text-xs">Click only if you want to replace it</p>
                    </>
                  ) : (
                    <>
                      <p className="font-body text-white/50 text-sm">Drop your audio file or click to browse</p>
                      <p className="font-body text-white/25 text-xs">WAV, MP3, FLAC · Max 500MB · 24-bit recommended</p>
                    </>
                  )}
                </>
              )}
            </button>
            {fieldErrors.audio && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.audio}</p>}
            <input ref={audioInputRef} type="file" accept={audioAccept} className="hidden" onChange={handleAudio} />

            {/* A playable file is the only proof people actually trust. The
                text above says the audio is there; this lets them hear it.
                Same player the album track list uses. */}
            {audioUrl && (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#140C0C] p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-body text-white/70 text-xs font-medium truncate">
                    {audioFile ? audioFile.name : state.trackTitle || "Current audio"}
                  </p>
                  <button
                    onClick={() => !uploading && audioInputRef.current?.click()}
                    className="shrink-0 font-body text-[#C30100] text-xs hover:text-white transition-colors"
                  >
                    Replace
                  </button>
                </div>
                <MiniAudioPlayer audioUrl={audioUrl} trackId="single" />
              </div>
            )}
          </>
        ) : (
          /* Album/EP / Mixtape mode: track list with Add Track button */
          <>
            {/* Hidden file input */}
            <input ref={audioInputRef} type="file" accept={audioAccept} multiple className="hidden" onChange={(e) => handleAlbumFiles(e.target.files)} />

            {/* Uploading indicator */}
            {uploading && (
              <div className="border border-[#C30100]/30 rounded-xl p-4 flex flex-col items-center gap-2">
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                <p className="font-body text-white/70 text-sm">Uploading {uploadingFileName}...</p>
                {uploadProgress && (
                  <div className="w-48 mt-1">
                    <p className="font-body text-white/50 text-xs text-center mb-1">{uploadProgress.percentage}%</p>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C30100] rounded-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Track list */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-body text-white/70 text-xs font-semibold">Tracks ({state.tracks.length}) · {releaseLabel}</p>
              </div>

              {state.tracks.length === 0 && !uploading ? (
                <div className="border border-dashed border-white/10 rounded-xl py-8 flex flex-col items-center gap-3">
                  <AudioIcon />
                  <p className="font-body text-white/40 text-sm">No tracks added yet</p>
                  <p className="font-body text-white/25 text-xs">Click the button below to add your first track</p>
                </div>
              ) : (
                state.tracks.map((track, idx) => (
                  <TrackEntry
                    key={track.id}
                    track={track}
                    index={idx}
                    totalTracks={state.tracks.length}
                    onEdit={() => setEditingTrackId(track.id)}
                    onRemove={() => removeTrack(track.id)}
                    onMoveUp={() => idx > 0 && reorderTrack(idx, idx - 1)}
                    onMoveDown={() => idx < state.tracks.length - 1 && reorderTrack(idx, idx + 1)}
                  />
                ))
              )}

              {/* Add Track button */}
              <button
                onClick={() => !uploading && audioInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 font-heading text-white/50 uppercase text-xs tracking-widest rounded-full border border-white/10 py-3.5 hover:border-[#C30100] hover:text-[#C30100] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">+</span> Add Track
              </button>
            </div>
          </>
        )}

        {/* -- Single mode: hidden audio element + preview -------- */}
        {isSingle && audioUrl && (
          <>
            <audio
              ref={audioElRef}
              src={audioUrl}
              onTimeUpdate={() => setCurrentTime(audioElRef.current?.currentTime ?? 0)}
              onLoadedMetadata={() => {
                const dur = audioElRef.current?.duration ?? 0;
                setDuration(dur);
                update({ audioDuration: formatDuration(dur) });
              }}
              onEnded={() => setPlaying(false)}
              preload="metadata"
            />
          </>
        )}

        {fieldErrors.tracks && <p className="font-body text-[#C30100] text-xs">{fieldErrors.tracks}</p>}

        {/* -- Track Details (single mode) / First track details �-- */}
        {isSingle ? (
          <>
            {/* Single mode: existing track details */}
            <p className="font-body text-white text-sm font-medium mt-2">Track Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Track Title">
                <input value={state.trackTitle} readOnly
                  className="w-full bg-[#0E0808]/50 border border-white/5 rounded-lg px-4 py-3 font-body text-white/50 text-sm cursor-not-allowed" />
              </Field>
              <Field label="Mixed Version">
                <input value={state.mixedVersion} onChange={(e) => update({ mixedVersion: e.target.value })} placeholder="eg radio edit"
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
              </Field>
            </div>

            {/* Artist Details */}
            <SectionBox
              label="Artist Details"
              actionLabel="+ Add"
              onAction={() => {
                const newArtist: AdditionalArtist = {
                  id: `artist_${Date.now()}_${Math.random()}`,
                  name: "",
                  artistId: "",
                  role: "featuring",
                };
                update({ additionalArtists: [...state.additionalArtists, newArtist] });
              }}
            >
              {state.additionalArtists.length === 0 ? (
                <p className="font-body text-white/30 text-xs">
                  Add other primary artists, featured artists, or remixers.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
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
            </SectionBox>

            {/* Classification */}
            <SectionBox label="Classification" noAction>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <Field label="Explicit Content">
                  <DashSelect value={state.explicitContent} onChange={(v) => { update({ explicitContent: v }); clearFieldError?.("explicit"); }} options={["Yes", "No", "Clean"]} />
                  {fieldErrors.explicit && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.explicit}</p>}
                </Field>
                <Field label="Genre">
                  <DashSelect value={state.genre} onChange={(v) => { update({ genre: v, subGenre: "" }); clearFieldError?.("genre"); }} placeholder="Select genre" options={GENRE_OPTIONS} />
                  {fieldErrors.genre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.genre}</p>}
                </Field>
                <Field label="Sub-genre">
                  <DashSelect value={state.subGenre} onChange={(v) => { update({ subGenre: v }); clearFieldError?.("subGenre"); }} placeholder={subGenres.length ? "Select sub-genre" : "Select genre first"} options={subGenres} />
                  {fieldErrors.subGenre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.subGenre}</p>}
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Recorded Year">
                  <DashSelect value={state.recordedYear} onChange={(v) => update({ recordedYear: v })} options={["2026", "2025", "2024", "2023"]} />
                </Field>
                <Field label="ISRC">
                  <input value={state.isrc} onChange={(e) => update({ isrc: e.target.value })} placeholder="Auto-generated if blank"
                    className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
                </Field>
                <Field label="Stereo AI Use">
                  <DashSelect value="None" onChange={() => {}} options={["None", "Partial", "Full"]} />
                </Field>
              </div>
            </SectionBox>

            {/* Writers */}
            <ContributorSection label="Writers" type="writers" contributors={state.contributors.writers} roleOptions={WRITER_ROLES} updateContributors={updateContributors} />
            {fieldErrors.writers && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.writers}</p>}

            {/* Production */}
            <ContributorSection label="Production" type="producers" contributors={state.contributors.producers} roleOptions={PRODUCTION_ROLES} updateContributors={updateContributors} />

            {/* Performers */}
            <ContributorSection label="Performers" type="performers" contributors={state.contributors.performers} roleOptions={PERFORMER_ROLES} updateContributors={updateContributors} />
            {fieldErrors.performers && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.performers}</p>}

            {/* Lyrics */}
            <SectionBox label="Lyrics" noAction rightLabel={<DashSelect value="English" onChange={() => {}} options={["English", "Yoruba", "French"]} />}>
              <textarea value={state.lyrics} onChange={(e) => update({ lyrics: e.target.value })} rows={4}
                className="w-full bg-transparent font-body text-white/50 text-sm outline-none resize-none placeholder:text-white/20"
                placeholder="Enter lyrics..." />
            </SectionBox>

            {/* Audio Preview */}
            <SectionBox label="Audio Preview" noAction>
              {!audioFile ? (
                <p className="font-body text-white/30 text-xs">Upload an audio file above to preview it here.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPlaying(!playing)}
                      className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0">
                      {playing ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-body text-white/40 text-xs shrink-0 tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative" onClick={handleSeek}>
                        <div className="h-full bg-[#C30100] rounded-full pointer-events-none transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <button className="text-white/30 hover:text-white/50 transition-colors"><VolumeIcon /></button>
                  </div>
                  <button onClick={setTikTokStampFromCurrent}
                    className="w-full mt-4 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] py-3 hover:bg-[#C30100] transition-colors">
                    Set Current Time as TikTok Stamp
                  </button>
                </>
              )}
            </SectionBox>

            {/* TikTok Timestamp */}
            <SectionBox label="TikTok Preview Timestamp (Optional)" noAction>
              <p className="font-body text-white/30 text-xs mb-2">
                Specify the start time for TikTok preview (format: mm:ss) · Use the audio player above to preview and select the best timestamp
              </p>
              <input value={tiktokStamp} onChange={(e) => setTiktokStamp(e.target.value)} placeholder="0:00"
                className="w-24 bg-transparent border-b border-white/20 font-body text-white text-sm outline-none pb-1 placeholder:text-white/25" />
            </SectionBox>
          </>
        ) : (
          /* Album/EP mode: shared classification (optional, can be overridden per track) */
          <>
            <SectionBox label="Shared Classification" noAction>
              <p className="font-body text-white/30 text-xs mb-3">
                These settings apply as defaults to all tracks in this {releaseLabel}. You can override them per track using the edit button.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <Field label="Explicit Content">
                  <DashSelect value={state.explicitContent} onChange={(v) => { update({ explicitContent: v }); clearFieldError?.("explicit"); }} options={["Yes", "No", "Clean"]} />
                  {fieldErrors.explicit && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.explicit}</p>}
                </Field>
                <Field label="Genre">
                  <DashSelect value={state.genre} onChange={(v) => { update({ genre: v, subGenre: "" }); clearFieldError?.("genre"); }} placeholder="Select genre" options={GENRE_OPTIONS} />
                  {fieldErrors.genre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.genre}</p>}
                </Field>
                <Field label="Sub-genre">
                  <DashSelect value={state.subGenre} onChange={(v) => { update({ subGenre: v }); clearFieldError?.("subGenre"); }} placeholder={subGenres.length ? "Select sub-genre" : "Select genre first"} options={subGenres} />
                  {fieldErrors.subGenre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.subGenre}</p>}
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Recorded Year">
                  <DashSelect value={state.recordedYear} onChange={(v) => update({ recordedYear: v })} options={["2026", "2025", "2024", "2023"]} />
                </Field>
                <Field label="Stereo AI Use">
                  <DashSelect value="None" onChange={() => {}} options={["None", "Partial", "Full"]} />
                </Field>
              </div>
            </SectionBox>

            <p className="font-body text-white/40 text-xs text-center py-2">
              Click the edit button on each track above to set track-specific metadata (title, lyrics, genre, ISRC, contributors).
            </p>
          </>
        )}
      </div>

      <div className="mt-8">
        <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
      </div>

      {/* -- Track Edit Modal ------------------------------------ */}
      {editingTrack && (
        <TrackEditModal
          track={editingTrack}
          profiles={profiles}
          onSave={(patch) => updateTrack(editingTrack.id, patch)}
          onClose={() => setEditingTrackId(null)}
        />
      )}
    </div>
  );
}

/* --- Icon helpers -------------------------------------------- */

function AudioIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function PlayIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function PauseIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function VolumeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>; }
