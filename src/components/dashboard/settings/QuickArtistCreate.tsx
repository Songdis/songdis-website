"use client";

import { useEffect, useRef, useState } from "react";
import {
  createProfile,
  lookupArtist,
  searchSpotifyArtists,
  verifySpotifyUrl,
  type ArtistLookupResult,
  type SpotifyArtist,
} from "@/lib/api/auth";
import type { ArtistProfile } from "./ArtistProfileModal";

/*
 * New artist, the quick way:
 *   1. find yourself on Spotify (or "not on Spotify yet")
 *   2. legal name + WhatsApp number, create
 *
 * Photo, Spotify link, location and social links come from the search without being shown
 * as a form. Date of birth and anything we could not find are asked for later, from the
 * dashboard ("finish your profile"), so creating an artist takes under a minute.
 */

const ARTIST_LINK = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?artist\/[A-Za-z0-9]+/i;

const FOUND_LABELS: Record<string, string> = {
  instagram_url: "Instagram",
  twitter_url: "X",
  facebook_url: "Facebook",
  youtube_url: "YouTube",
  apple_music_url: "Apple Music",
};

function toWhatsApp(phone: string): string {
  const n = phone.replace(/[\s\-().]/g, "");
  if (n.startsWith("+")) return n;
  if (n.startsWith("00")) return "+" + n.slice(2);
  if (n.startsWith("234") && n.length > 10) return "+" + n;
  return "+234" + n.replace(/^0+/, "");
}

const inputCls =
  "w-full min-h-[48px] bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors";

export default function QuickArtistCreate({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: ArtistProfile) => void;
}) {
  const [step, setStep] = useState<"find" | "details">("find");

  // Find
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  // Picked + what we found
  const [picked, setPicked] = useState<SpotifyArtist | null>(null);
  const [found, setFound] = useState<ArtistLookupResult | null>(null);
  const [looking, setLooking] = useState(false);

  // Details
  const [stageName, setStageName] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const search = (q: string) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    const text = q.trim();
    const link = text.match(ARTIST_LINK)?.[0];
    timer.current = setTimeout(async () => {
      const mine = ++seq.current;
      if (!link && text.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      setSearchError("");
      if (link) {
        const res = await verifySpotifyUrl(`https://${link}`);
        if (mine !== seq.current) return;
        setSearching(false);
        if (res.data?.artist) choose(res.data.artist);
        else setSearchError(res.error ?? "We couldn't find that Spotify artist link.");
        return;
      }
      const res = await searchSpotifyArtists(text);
      if (mine !== seq.current) return;
      setSearching(false);
      setResults((res.data?.artists ?? []).slice(0, 6));
      if (res.error) setSearchError("Spotify search isn't answering right now. You can continue without it.");
    }, link ? 0 : 400);
  };

  const choose = (artist: SpotifyArtist) => {
    setPicked(artist);
    setStageName(artist.name);
    setStep("details");
    setLooking(true);
    void lookupArtist(artist.spotify_url).then((res) => {
      setFound(res.data ?? null);
      setLooking(false);
    });
  };

  const withoutSpotify = () => {
    setPicked(null);
    setFound(null);
    if (!stageName && query.trim() && !ARTIST_LINK.test(query)) setStageName(query.trim());
    setStep("details");
  };

  const create = async () => {
    const e: Record<string, string> = {};
    if (stageName.trim().length < 2) e.stage_name = "Add the artist name.";
    if (fullName.trim().split(/\s+/).length < 2) e.full_name = "Your full legal name, first and last, as on your ID.";
    if (whatsapp.replace(/\D/g, "").length < 7) e.whatsapp_number = "Add your WhatsApp number.";
    if (!consent) e.whatsapp_consent = "Tick the box so we can reach you on WhatsApp.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setApiError("");
    const links = found?.links ?? {};
    const res = await createProfile({
      full_name: fullName.trim(),
      stage_name: stageName.trim(),
      whatsapp_number: toWhatsApp(whatsapp),
      whatsapp_consent: true,
      spotify_url: picked?.spotify_url ?? "",
      location: found?.location ?? "",
      instagram_url: links.instagram_url ?? "",
      twitter_url: links.twitter_url ?? "",
      facebook_url: links.facebook_url ?? "",
      youtube_url: links.youtube_url ?? "",
      apple_music_url: links.apple_music_url ?? "",
    } as unknown as Parameters<typeof createProfile>[0]);
    setSaving(false);

    if (res.error) {
      if (res.errors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.errors)) flat[k] = Array.isArray(v) ? v[0] : String(v);
        setErrors(flat);
        if (!["full_name", "stage_name", "whatsapp_number", "whatsapp_consent"].some((k) => flat[k])) {
          setApiError(Object.values(flat)[0] ?? res.error);
        }
      } else {
        setApiError(res.error);
      }
      return;
    }

    const created = res.data as unknown as Record<string, unknown> | undefined;
    onSave({
      id: String(created?.id ?? ""),
      stageName: stageName.trim(),
      fullName: fullName.trim(),
      email: "",
      phone: toWhatsApp(whatsapp),
      dob: "",
      location: found?.location ?? "",
      bio: "",
      instagram: links.instagram_url ?? "",
      twitter: links.twitter_url ?? "",
      facebook: links.facebook_url ?? "",
      tiktok: "",
      youtube: links.youtube_url ?? "",
      appleMusic: links.apple_music_url ?? "",
      spotify: picked?.spotify_url ?? "",
      cover: "",
      avatar: picked?.image_url ?? "",
    });
  };

  const foundList = found
    ? [
        ...(found.location ? ["Location"] : []),
        ...Object.keys(found.links ?? {}).map((k) => FOUND_LABELS[k] ?? k),
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] rounded-2xl bg-[#140C0C] border border-white/[0.07] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="p-6 sm:p-8">
          <p className="font-montserrat text-white/40 text-[11px] uppercase tracking-widest">
            Step {step === "find" ? "1" : "2"} of 2
          </p>

          {step === "find" ? (
            <>
              <h2 className="font-nulshock text-white uppercase text-lg tracking-wide mt-2">Find your artist</h2>
              <p className="font-montserrat text-white/55 text-sm mt-1.5">
                Search your artist name or paste your Spotify artist link. We&apos;ll bring in your photo and links.
              </p>

              <div className="relative mt-5">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  placeholder="Artist name or Spotify artist link"
                  aria-label="Search Spotify for your artist name, or paste your Spotify artist link"
                  className={inputCls + " pr-10"}
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" aria-label="Searching" />
                )}
              </div>

              {searchError && <p className="font-montserrat text-[12px] text-red-400 mt-2">{searchError}</p>}

              {results.length > 0 && (
                <ul className="mt-3 flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/10 overflow-hidden">
                  {results.map((a) => (
                    <li key={a.spotify_id}>
                      <button
                        type="button"
                        onClick={() => choose(a)}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.04] transition-colors min-h-[56px]"
                      >
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                          {a.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="flex-1 min-w-0 font-montserrat text-white text-sm truncate">{a.name}</span>
                        <span className="font-montserrat text-[11px] text-white/50 border border-white/15 rounded-full px-3 py-1">That&apos;s me</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!searching && query.trim().length >= 2 && !ARTIST_LINK.test(query) && results.length === 0 && !searchError && (
                <p className="font-montserrat text-[12px] text-white/45 mt-3">No one by that name on Spotify.</p>
              )}

              <button
                type="button"
                onClick={withoutSpotify}
                className="mt-6 font-montserrat text-white/60 text-[13px] underline underline-offset-4 hover:text-white"
              >
                Not on Spotify yet? Continue without it
              </button>
            </>
          ) : (
            <>
              <h2 className="font-nulshock text-white uppercase text-lg tracking-wide mt-2">Almost done</h2>
              <p className="font-montserrat text-white/55 text-sm mt-1.5">Two details we need for payments and contracts.</p>

              {picked && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/5 p-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
                    {picked.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={picked.image_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-montserrat text-white text-sm font-semibold truncate">{picked.name}</p>
                    <p className="font-montserrat text-[11.5px] text-white/50">
                      {looking
                        ? "Bringing in your details…"
                        : foundList.length
                          ? `Found on Spotify, plus ${foundList.join(", ")}`
                          : "Found on Spotify. Photo and link added."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("find")}
                    className="font-montserrat text-[12px] text-white/45 hover:text-white min-h-[44px] px-2"
                  >
                    Change
                  </button>
                </div>
              )}

              <form
                className="mt-5 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void create();
                }}
              >
                {apiError && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 font-montserrat text-sm text-red-400">{apiError}</p>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="font-montserrat text-white/60 text-xs">Artist name</span>
                  <input value={stageName} onChange={(e) => setStageName(e.target.value)} maxLength={50} className={inputCls} placeholder="The name fans know you by" />
                  {errors.stage_name && <span className="font-montserrat text-[12px] text-red-400">{errors.stage_name}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-montserrat text-white/60 text-xs">Your full legal name</span>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className={inputCls} placeholder="As on your ID, for payments" />
                  {errors.full_name && <span className="font-montserrat text-[12px] text-red-400">{errors.full_name}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-montserrat text-white/60 text-xs">WhatsApp number</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" autoComplete="tel" className={inputCls} placeholder="e.g. +234 803 123 4567" />
                  {errors.whatsapp_number && <span className="font-montserrat text-[12px] text-red-400">{errors.whatsapp_number}</span>}
                </label>

                <label className="flex items-start gap-2.5 font-montserrat text-white/55 text-[12px] leading-relaxed">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#C30100]" />
                  SongDis can send me updates about my music on WhatsApp.
                </label>
                {errors.whatsapp_consent && <span className="font-montserrat text-[12px] text-red-400 -mt-2">{errors.whatsapp_consent}</span>}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100] hover:brightness-110 py-3.5 transition-all min-h-[48px] disabled:opacity-60"
                >
                  {saving ? "Creating…" : "Create artist"}
                </button>
                <p className="font-montserrat text-white/35 text-[11.5px] text-center">
                  You can add your date of birth and other details later from your dashboard.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
