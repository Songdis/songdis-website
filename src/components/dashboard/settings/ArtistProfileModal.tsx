"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createProfile, searchSpotifyArtists, verifySpotifyUrl } from "@/lib/api/auth";
import type { SpotifyArtist } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";

/* ─── Types ───────────────────────────────────────────────────── */
export type ProfileModalStep = "info" | "social";

export interface ArtistProfile {
  id: string;
  stageName: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  location: string;
  bio: string;
  instagram: string;
  twitter: string;
  facebook: string;
  tiktok: string;
  appleMusic: string;
  spotify: string;
  cover: string;
  avatar: string;
}

/* ─── Shared UI Primitives ────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-montserrat text-white/60 text-xs">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  icon,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[48px] bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={icon ? { paddingRight: "2.5rem" } : {}}
      />
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </div>
      )}
    </div>
  );
}

/* ─── Artist Profile Modal (2-step) ──────────────────────────── */
export default function ArtistProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ArtistProfile | null;
  onClose: () => void;
  onSave: (p: ArtistProfile) => void;
}) {
  const [step, setStep] = useState<ProfileModalStep>("info");
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [stageName, setStageName] = useState(profile?.stageName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [twitter, setTwitter] = useState(profile?.twitter ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram ?? "");
  const [facebook, setFacebook] = useState(profile?.facebook ?? "");
  const [appleMusic, setAppleMusic] = useState(profile?.appleMusic ?? "");
  const [noTwitter, setNoTwitter] = useState(false);
  const [noInstagram, setNoInstagram] = useState(false);
  const [noFacebook, setNoFacebook] = useState(false);
  const [noAppleMusic, setNoAppleMusic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const { error: toastError } = useToast();

  /* ── Spotify search state ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  /* ── Spotify URL verification state ── */
  const [spotifyUrlInput, setSpotifyUrlInput] = useState("");
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const [spotifyVerified, setSpotifyVerified] = useState(false);
  const [verifiedArtistData, setVerifiedArtistData] = useState<SpotifyArtist | null>(null);

  const isEdit = !!profile;

  /* Clear field error when user types */
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (apiError) setApiError("");
  };

  /* Close search dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Cleanup debounce on unmount */
  useEffect(() => () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); }, []);

  /* ── Spotify artist search (debounced) ── */
  const handleArtistSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchResults(true);
      const res = await searchSpotifyArtists(query);
      if (!res.error && res.data) {
        setSearchResults(res.data.artists ?? []);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);
  }, []);

  /* ── Select artist from search results ── */
  const handleSelectArtist = (artist: SpotifyArtist) => {
    setShowSearchResults(false);
    setSelectedArtist(artist);
    setSearchQuery(artist.name);
    setSpotifyVerified(true);
    setVerifiedArtistData(artist);
    setSpotifyUrlInput(artist.spotify_url);
    if (!stageName) setStageName(artist.name);
  };

  const clearArtistSelection = () => {
    setSelectedArtist(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSpotifyVerified(false);
    setVerifiedArtistData(null);
    setSpotifyUrlInput("");
  };

  /* ── Spotify URL verification ── */
  const handleVerifyUrl = async () => {
    if (!spotifyUrlInput) return;
    if (!spotifyUrlInput.includes("spotify.com/artist/")) {
      toastError("Invalid URL", "That doesn't look like a Spotify artist URL. It should look like: https://open.spotify.com/artist/...");
      return;
    }
    setIsVerifyingUrl(true);
    const res = await verifySpotifyUrl(spotifyUrlInput);
    setIsVerifyingUrl(false);
    if (res.error) {
      toastError("Verification failed", res.error);
      setSpotifyVerified(false);
      setVerifiedArtistData(null);
    } else if (res.data?.artist) {
      setSpotifyVerified(true);
      setVerifiedArtistData(res.data.artist);
      setSelectedArtist(res.data.artist);
      setSearchQuery(res.data.artist.name);
      if (!stageName) setStageName(res.data.artist.name);
    }
  };

  const clearSpotifyVerification = () => {
    setSpotifyVerified(false);
    setVerifiedArtistData(null);
    setSpotifyUrlInput("");
    setSelectedArtist(null);
    setSearchQuery("");
  };

  /* ── Save ── */
  const handleSave = async () => {
    setIsSaving(true);
    setFieldErrors({});
    setApiError("");
    const res = await createProfile({
      full_name: fullName,
      stage_name: stageName,
      dob,
      location,
      phone,
      country_code: "+234",
      twitter_url: twitter,
      instagram_url: instagram,
      facebook_url: facebook,
      spotify_url: spotifyUrlInput,
      apple_music_url: appleMusic,
    });
    setIsSaving(false);

    if (res.error) {
      if (res.errors) {
        const flattened: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(res.errors)) {
          flattened[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setFieldErrors(flattened);
        const step1Fields = ["full_name", "stage_name", "dob", "location", "phone"];
        if (Object.keys(res.errors).some((k) => step1Fields.includes(k)) && step === "social") {
          setStep("info");
        }
      } else {
        setApiError(res.error);
      }
      return;
    }

    const created = res.data as unknown as Record<string, unknown> | undefined;
    onSave({
      id: String(created?.id ?? profile?.id ?? ""),
      stageName,
      fullName,
      email: profile?.email ?? "",
      phone,
      dob,
      location,
      bio: profile?.bio ?? "",
      instagram,
      twitter,
      facebook,
      tiktok: profile?.tiktok ?? "",
      appleMusic,
      spotify: spotifyUrlInput,
      cover: profile?.cover ?? "",
      avatar: (created?.profile_image ?? created?.avatar_url ?? profile?.avatar ?? "/images/avatar-artiste.svg") as string,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[660px] rounded-2xl bg-[#140C0C] border border-white/[0.07] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10"
        >
          <CloseIcon />
        </button>
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="font-nulshock text-white uppercase text-lg tracking-wide">
              Artist Profile Setup
            </h2>
            <p className="font-montserrat text-white/50 text-sm mt-1">
              Create your professional artist profile
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-7">
            <div className="flex items-center bg-[#0E0808] border border-white/[0.06] rounded-2xl px-6 sm:px-8 py-4 w-full max-w-xs">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-nulshock transition-colors",
                    step === "info"
                      ? "bg-[#C30100] text-white"
                      : "bg-white/10 text-white/40",
                  ].join(" ")}
                >
                  1
                </div>
                <span className="font-montserrat text-white/40 text-[10px]">
                  Personal Info
                </span>
              </div>
              <div className="flex-1 h-px bg-white/10 mb-4" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-nulshock transition-colors",
                    step === "social"
                      ? "bg-[#C30100] text-white"
                      : "bg-white/10 text-white/40",
                  ].join(" ")}
                >
                  2
                </div>
                <span className="font-montserrat text-white/40 text-[10px]">
                  Social Links
                </span>
              </div>
            </div>
          </div>

          {step === "info" && (
            <div className="flex flex-col gap-5">
              {/* ── API Error Banner ── */}
              {apiError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
                  <AlertIcon />
                  <p className="font-montserrat text-red-400 text-sm">{apiError}</p>
                </div>
              )}
              {/* ── Spotify Artist Search ── */}
              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-montserrat text-white text-xs font-semibold flex items-center gap-2">
                    <SpotifyIcon /> Find Your Spotify Profile
                  </p>
                  <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <p className="font-montserrat text-white/50 text-[11px] mb-1">
                  Search for your artist name on Spotify to auto-fill your profile and get a verified badge.
                </p>
                <p className="font-montserrat text-white/30 text-[11px] mb-3">
                  Don&apos;t have Spotify or can&apos;t find yourself? You can skip this section entirely.
                </p>

                {!selectedArtist ? (
                  <div className="relative" ref={searchContainerRef}>
                    <Input
                      value={searchQuery}
                      onChange={handleArtistSearch}
                      placeholder="e.g Burna Boy, Wizkid, your artist name..."
                      icon={isSearching ? <SpinIcon /> : <SearchIcon />}
                    />
                    {showSearchResults && (
                      <div className="absolute z-40 w-full mt-1 bg-[#0E0808] border border-white/10 rounded-xl shadow-lg overflow-hidden">
                        {isSearching ? (
                          <div className="flex items-center gap-3 px-4 py-4 text-sm text-white/50 font-montserrat">
                            <SpinIcon /> Searching Spotify...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <ul className="max-h-72 overflow-y-auto divide-y divide-white/[0.06]">
                            {searchResults.map((artist) => (
                              <li key={artist.spotify_id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectArtist(artist)}
                                  className="w-full px-4 py-3 hover:bg-white/[0.04] text-left flex items-center gap-3 transition-colors"
                                >
                                  {artist.image_url ? (
                                    <img
                                      src={artist.image_url}
                                      alt={artist.name}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white/10"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                      <MusicIcon />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-montserrat text-white text-sm truncate">{artist.name}</div>
                                    <div className="flex items-center gap-3 text-[11px] text-white/40 mt-0.5">
                                      {artist.followers > 0 && (
                                        <span>{artist.followers.toLocaleString()} followers</span>
                                      )}
                                      {artist.popularity > 0 && (
                                        <span>{artist.popularity}% popularity</span>
                                      )}
                                    </div>
                                    {artist.genres?.length > 0 && (
                                      <div className="text-[11px] text-white/30 mt-0.5 truncate">
                                        {artist.genres.slice(0, 2).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-4 font-montserrat">
                            <p className="text-sm text-white/50 mb-1">
                              No artists found for &ldquo;{searchQuery}&rdquo;.
                            </p>
                            <p className="text-[11px] text-white/30">
                              Try a different spelling, or paste your Spotify artist URL below.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                    <div className="flex items-start gap-3">
                      {selectedArtist.image_url ? (
                        <img
                          src={selectedArtist.image_url}
                          alt={selectedArtist.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <MusicIcon />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircleIcon />
                          <span className="font-montserrat text-white font-semibold text-sm truncate">{selectedArtist.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-[11px] text-white/50">
                          {selectedArtist.followers > 0 && (
                            <span>{selectedArtist.followers.toLocaleString()} followers</span>
                          )}
                          {selectedArtist.popularity > 0 && (
                            <span>{selectedArtist.popularity}% popularity</span>
                          )}
                        </div>
                        {selectedArtist.genres?.length > 0 && (
                          <div className="text-[11px] text-white/40 mt-1">
                            {selectedArtist.genres.slice(0, 3).join(", ")}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearArtistSelection}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                        title="Remove selection"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── OR Divider ── */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#140C0C] text-white/40 text-[11px] font-montserrat">OR paste your Spotify artist URL</span>
                </div>
              </div>

              {/* ── Spotify URL Verification ── */}
              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-montserrat text-white text-xs font-semibold">Verify by Spotify URL</p>
                  <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <p className="font-montserrat text-white/50 text-[11px] mb-3">
                  Can&apos;t find yourself in the search above? Paste your Spotify artist page URL directly.
                </p>

                {spotifyVerified && verifiedArtistData ? (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon />
                      <div>
                        <p className="font-montserrat text-white text-sm font-medium">{verifiedArtistData.name} verified</p>
                        <p className="font-montserrat text-green-400 text-[11px]">Spotify artist URL confirmed</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSpotifyVerification}
                      className="text-[11px] text-white/50 hover:text-white transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={spotifyUrlInput}
                      onChange={setSpotifyUrlInput}
                      placeholder="https://open.spotify.com/artist/..."
                      disabled={isVerifyingUrl || !!selectedArtist}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyUrl}
                      disabled={isVerifyingUrl || !spotifyUrlInput || !!selectedArtist}
                      className="shrink-0 font-nulshock text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-4 py-2.5 transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isVerifyingUrl ? (
                        <><SpinIcon /> Verifying...</>
                      ) : (
                        <><CheckSmallIcon /> Verify</>
                      )}
                    </button>
                  </div>
                )}

                {selectedArtist && !spotifyVerified && (
                  <p className="text-[11px] text-white/30 mt-2">
                    You already selected an artist above. Remove that selection first to use URL verification instead.
                  </p>
                )}
              </div>

              {/* ── Personal Info ── */}
              <p className="font-montserrat text-white text-sm font-semibold">
                Personal Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Field label="Full Name">
                    <Input
                      value={fullName}
                      onChange={(v) => { setFullName(v); clearFieldError("full_name"); }}
                      placeholder="Your full legal name"
                    />
                  </Field>
                  {fieldErrors.full_name && <FieldError message={fieldErrors.full_name} />}
                </div>
                <div>
                  <Field label="Stage Name">
                    <Input
                      value={stageName}
                      onChange={(v) => { setStageName(v); clearFieldError("stage_name"); }}
                      placeholder="Your artist name"
                    />
                  </Field>
                  {fieldErrors.stage_name && <FieldError message={fieldErrors.stage_name} />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Field label="Phone number">
                    <Input
                      value={phone}
                      onChange={(v) => { setPhone(v); clearFieldError("phone"); }}
                      placeholder="Phone number"
                    />
                  </Field>
                  {fieldErrors.phone && <FieldError message={fieldErrors.phone} />}
                </div>
                <div>
                  <Field label="Date of birth">
                    <Input
                      value={dob}
                      onChange={(v) => { setDob(v); clearFieldError("dob"); }}
                      placeholder="mm/dd/yyyy"
                      type="date"
                      icon={<CalendarIcon />}
                    />
                  </Field>
                  {fieldErrors.dob && <FieldError message={fieldErrors.dob} />}
                </div>
              </div>
              <div>
                <Field label="Location">
                  <Input
                    value={location}
                    onChange={(v) => { setLocation(v); clearFieldError("location"); }}
                    placeholder="City, Country"
                  />
                </Field>
                {fieldErrors.location && <FieldError message={fieldErrors.location} />}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("social")}
                  className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all min-h-[48px]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === "social" && (
            <div className="flex flex-col gap-5">
              {/* ── API Error Banner ── */}
              {apiError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
                  <AlertIcon />
                  <p className="font-montserrat text-red-400 text-sm">{apiError}</p>
                </div>
              )}

              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-3">
                <p className="font-montserrat text-white/50 text-xs">
                  All social links are optional. You can add them now or update
                  your profile later.
                </p>
              </div>
              <p className="font-montserrat text-white text-sm font-semibold">
                Social Media
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Field label="Twitter">
                    <Input
                      value={twitter}
                      onChange={(v) => { setTwitter(v); clearFieldError("twitter_url"); }}
                      placeholder="Twitter handle"
                    />
                  </Field>
                  {fieldErrors.twitter_url && <FieldError message={fieldErrors.twitter_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noTwitter}
                      onChange={() => setNoTwitter(!noTwitter)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have Twitter
                    </span>
                  </label>
                </div>
                <div>
                  <Field label="Instagram">
                    <Input
                      value={instagram}
                      onChange={(v) => { setInstagram(v); clearFieldError("instagram_url"); }}
                      placeholder="Instagram handle"
                    />
                  </Field>
                  {fieldErrors.instagram_url && <FieldError message={fieldErrors.instagram_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noInstagram}
                      onChange={() => setNoInstagram(!noInstagram)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have Instagram
                    </span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Field label="Facebook">
                    <Input
                      value={facebook}
                      onChange={(v) => { setFacebook(v); clearFieldError("facebook_url"); }}
                      placeholder="Facebook handle"
                    />
                  </Field>
                  {fieldErrors.facebook_url && <FieldError message={fieldErrors.facebook_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noFacebook}
                      onChange={() => setNoFacebook(!noFacebook)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have Facebook
                    </span>
                  </label>
                </div>
                <div>
                  <Field label="Apple Music">
                    <Input
                      value={appleMusic}
                      onChange={(v) => { setAppleMusic(v); clearFieldError("apple_music_url"); }}
                      placeholder="Apple Music artist URL"
                    />
                  </Field>
                  {fieldErrors.apple_music_url && <FieldError message={fieldErrors.apple_music_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noAppleMusic}
                      onChange={() => setNoAppleMusic(!noAppleMusic)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have Apple Music
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors min-h-[48px]"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all min-h-[48px] disabled:opacity-40"
                >
                  {isSaving ? "Creating..." : isEdit ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Field Error ─────────────────────────────────────────────── */
function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1 font-montserrat">
      <AlertIcon /> {message}
    </p>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckSmallIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function SpinIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function MusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function SpotifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
