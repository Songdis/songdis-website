"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createProfile, updateProfile, searchSpotifyArtists, verifySpotifyUrl, lookupArtist } from "@/lib/api/auth";
import QuickArtistCreate from "./QuickArtistCreate";
import type { SpotifyArtist } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";

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
  youtube: string;
  appleMusic: string;
  spotify: string;
  cover: string;
  avatar: string;
}

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

/*
 * New artist: the quick create (find on Spotify → legal name + WhatsApp). Existing artist:
 * the full two-step editor below, which is also where the rest gets completed later.
 */
export default function ArtistProfileModal(props: {
  profile: ArtistProfile | null;
  onClose: () => void;
  onSave: (p: ArtistProfile) => void;
}) {
  return props.profile ? (
    <ArtistProfileEditor {...props} />
  ) : (
    <QuickArtistCreate onClose={props.onClose} onSave={props.onSave} />
  );
}

/* ─── Artist Profile Editor (2-step) ─────────────────────────── */
function ArtistProfileEditor({
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
  // New profiles must have a WhatsApp number; usually it is the phone above.
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [twitter, setTwitter] = useState(profile?.twitter ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram ?? "");
  const [facebook, setFacebook] = useState(profile?.facebook ?? "");
  const [appleMusic, setAppleMusic] = useState(profile?.appleMusic ?? "");
  const [tiktok, setTiktok] = useState(profile?.tiktok ?? "");
  const [youtube, setYoutube] = useState(profile?.youtube ?? "");
  const [noTwitter, setNoTwitter] = useState(false);
  const [noInstagram, setNoInstagram] = useState(false);
  const [noFacebook, setNoFacebook] = useState(false);
  const [noAppleMusic, setNoAppleMusic] = useState(false);
  const [noTiktok, setNoTiktok] = useState(false);
  const [noYoutube, setNoYoutube] = useState(false);
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
  /* What the Spotify pick filled in for them, and a bio we found (they can drop it). */
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [foundBio, setFoundBio] = useState("");
  const fieldsRef = useRef({ location, instagram, twitter, facebook, youtube, appleMusic });
  // The search box handler is memoised above where verifyLink is defined; it calls through this.
  const verifyLinkRef = useRef<((url: string) => Promise<void>) | null>(null);
  useEffect(() => {
    fieldsRef.current = { location, instagram, twitter, facebook, youtube, appleMusic };
  }, [location, instagram, twitter, facebook, youtube, appleMusic]);

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
    // A pasted Spotify artist link goes straight to that artist.
    if (/open\.spotify\.com\/(?:intl-[a-z-]+\/)?artist\/[A-Za-z0-9]+/i.test(query)) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setSearchQuery(query);
      setShowSearchResults(false);
      void verifyLinkRef.current?.(query.trim());
      return;
    }
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

  /*
   * Fill every EMPTY field we can from the internet: location and socials from MusicBrainz
   * (matched by this exact Spotify link), a bio from Last.fm. Never overwrites what they typed.
   */
  const prefillFromSpotify = async (url: string) => {
    if (isEdit || !url) return;
    setIsPrefilling(true);
    const res = await lookupArtist(url);
    setIsPrefilling(false);
    const d = res.data;
    if (!d) return;
    // Read the LATEST field values (this can run from a memoised handler), fill only empties.
    const latest = fieldsRef.current;
    const filled: string[] = [];
    const take = (current: string, value: string | null | undefined, set: (v: string) => void, label: string) => {
      if (!current && value) {
        set(value);
        filled.push(label);
      }
    };
    take(latest.location, d.location, setLocation, "Location");
    take(latest.instagram, d.links.instagram_url, setInstagram, "Instagram");
    take(latest.twitter, d.links.twitter_url, setTwitter, "X");
    take(latest.facebook, d.links.facebook_url, setFacebook, "Facebook");
    take(latest.youtube, d.links.youtube_url, setYoutube, "YouTube");
    take(latest.appleMusic, d.links.apple_music_url, setAppleMusic, "Apple Music");
    if (d.bio) {
      setFoundBio(d.bio);
      filled.push("Bio");
    }
    setAutoFilled(filled);
  };

  /* ── Select artist from search results ── */
  const handleSelectArtist = (artist: SpotifyArtist) => {
    void prefillFromSpotify(artist.spotify_url);
    setShowSearchResults(false);
    setSelectedArtist(artist);
    setSearchQuery(artist.name);
    setSpotifyUrlInput(artist.spotify_url);
    if (!stageName) setStageName(artist.name);
  };

  const clearArtistSelection = () => {
    setAutoFilled([]);
    setFoundBio("");
    setSelectedArtist(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSpotifyUrlInput("");
  };

  const verifyLink = async (url: string) => {
    setIsSearching(true);
    const res = await verifySpotifyUrl(url);
    setIsSearching(false);
    if (res.data?.artist) {
      handleSelectArtist(res.data.artist);
    } else {
      toastError("Not found", res.error ?? "We couldn't find that Spotify artist link.");
    }
  };

  useEffect(() => {
    verifyLinkRef.current = verifyLink;
  });

  /* ── Save ── */
  const handleSave = async () => {
    setIsSaving(true);
    setFieldErrors({});
    setApiError("");
    const payload = {
      full_name: fullName,
      stage_name: stageName,
      dob,
      location,
      phone,
      country_code: "+234",
      ...(!isEdit && foundBio ? { bio: foundBio.slice(0, 500) } : {}),
      twitter_url: twitter,
      instagram_url: instagram,
      facebook_url: facebook,
      spotify_url: spotifyUrlInput,
      apple_music_url: appleMusic,
      tiktok_url: tiktok,
      youtube_url: youtube,
      ...(isEdit
        ? {}
        : {
            whatsapp_number: whatsappSameAsPhone ? toWhatsApp(phone) : whatsapp,
            whatsapp_consent: true,
          }),
    };

    /*
     * Editing UPDATES; it does not create.
     *
     * This used to call createProfile() unconditionally, so pressing "Save Changes" on an
     * existing artist POSTed a brand-new profile. Before artist limits existed that meant
     * silent duplicates; afterwards it meant the edit was refused outright with an upgrade
     * prompt — told to an artist who was only fixing a typo. `PUT /profile/{id}` had been
     * there the whole time with no client calling it.
     */
    // Number(): this file declares its OWN local ArtistProfile whose `id` is a string,
    // while the API client's is a number. Same mismatch that broke draft deletion before.
    const editingId = profile ? Number(profile.id) : NaN;

    const res = isEdit && Number.isFinite(editingId)
      ? await updateProfile(editingId, payload)
      : await createProfile(payload);
    setIsSaving(false);

    if (res.error) {
      if (res.errors) {
        const flattened: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(res.errors)) {
          flattened[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setFieldErrors(flattened);
        const step1Fields = ["full_name", "stage_name", "dob", "location", "phone", "whatsapp_number", "whatsapp_consent"];
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
      tiktok,
      youtube,
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
              {isEdit && !profile?.dob && (
                <div className="rounded-xl border border-[#C30100]/40 bg-[#C30100]/10 p-3">
                  <p className="font-montserrat text-white text-sm font-semibold">Still needed: date of birth</p>
                  <p className="font-montserrat text-white/60 text-xs mt-0.5">
                    We need it before payouts and publishing. Add it below, then save.
                  </p>
                </div>
              )}
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
                    <SpotifyIcon /> Start with Spotify
                  </p>
                </div>
                <p className="font-montserrat text-white/60 text-[11px] mb-1">
                  Search your artist name or paste your Spotify artist link. We&apos;ll fill in your photo,
                  location and social links, and you get a verified badge.
                </p>
                <p className="font-montserrat text-white/35 text-[11px] mb-3">
                  Not on Spotify yet? Skip this and fill in the details below.
                </p>

                {!selectedArtist ? (
                  <div className="relative" ref={searchContainerRef}>
                    <Input
                      value={searchQuery}
                      onChange={handleArtistSearch}
                      placeholder="Your artist name, or a Spotify artist link"
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
                    {isPrefilling ? (
                      <p className="mt-3 flex items-center gap-2 font-montserrat text-[11px] text-white/50">
                        <SpinIcon /> Filling in your details…
                      </p>
                    ) : autoFilled.length > 0 ? (
                      <div className="mt-3">
                        <p className="font-montserrat text-[11px] text-green-400">
                          Filled in for you: {autoFilled.join(", ")}. Check them before saving.
                        </p>
                        {foundBio && (
                          <div className="mt-2 rounded-lg bg-white/[0.04] p-2.5">
                            <p className="font-montserrat text-[11px] text-white/60 line-clamp-3">{foundBio}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setFoundBio("");
                                setAutoFilled((f) => f.filter((x) => x !== "Bio"));
                              }}
                              className="mt-1 font-montserrat text-[11px] text-white/40 underline hover:text-white"
                            >
                              Don&apos;t use this bio
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
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
                  {!isEdit && (
                    <div className="mt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={whatsappSameAsPhone}
                          onChange={(e) => { setWhatsappSameAsPhone(e.target.checked); clearFieldError("whatsapp_number"); }}
                          className="accent-[#25D366] w-4 h-4"
                        />
                        <span className="font-body text-white/60 text-xs">This is also my WhatsApp number</span>
                      </label>
                      {!whatsappSameAsPhone && (
                        <div className="mt-2">
                          <Input
                            value={whatsapp}
                            onChange={(v) => { setWhatsapp(v); clearFieldError("whatsapp_number"); }}
                            placeholder="WhatsApp number, e.g. +2348012345678"
                          />
                        </div>
                      )}
                      {(fieldErrors.whatsapp_number || fieldErrors.whatsapp_consent) && (
                        <FieldError message={fieldErrors.whatsapp_number ?? fieldErrors.whatsapp_consent} />
                      )}
                      <p className="font-body text-white/30 text-[10px] mt-1">We&apos;ll send you updates from SongDis on WhatsApp.</p>
                    </div>
                  )}
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
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="self-center font-montserrat text-white/50 text-xs underline underline-offset-4 hover:text-white disabled:opacity-50"
                >
                  {isSaving ? "Creating…" : "Skip social links and create the profile now"}
                </button>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Field label="TikTok">
                    <Input
                      value={tiktok}
                      onChange={(v) => { setTiktok(v); clearFieldError("tiktok_url"); }}
                      placeholder="TikTok profile URL"
                    />
                  </Field>
                  {fieldErrors.tiktok_url && <FieldError message={fieldErrors.tiktok_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noTiktok}
                      onChange={() => setNoTiktok(!noTiktok)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have TikTok
                    </span>
                  </label>
                </div>
                <div>
                  <Field label="YouTube">
                    <Input
                      value={youtube}
                      onChange={(v) => { setYoutube(v); clearFieldError("youtube_url"); }}
                      placeholder="YouTube channel URL"
                    />
                  </Field>
                  {fieldErrors.youtube_url && <FieldError message={fieldErrors.youtube_url} />}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noYoutube}
                      onChange={() => setNoYoutube(!noYoutube)}
                      className="accent-[#C30100]"
                    />
                    <span className="font-montserrat text-white/40 text-xs">
                      I don&apos;t have YouTube
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

/** The profile phone in WhatsApp form. The form's country code is fixed at +234. */
function toWhatsApp(phone: string): string {
  const n = phone.replace(/[\s\-().]/g, "");
  if (n.startsWith("+")) return n;
  if (n.startsWith("00")) return "+" + n.slice(2);
  if (n.startsWith("234") && n.length > 10) return "+" + n;
  return "+234" + n.replace(/^0+/, "");
}
