"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

/* ─── Types ───────────────────────────────────────────────────── */
type Tab = "general" | "artist-profile" | "ayo-ai" | "notification" | "security" | "subscription";
type BillingCycle = "monthly" | "yearly";
type ProfileModalStep = "info" | "social";

interface ArtistProfile {
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

/* ─── Mock data ───────────────────────────────────────────────── */
const MOCK_PROFILES: ArtistProfile[] = [
  {
    id: "1",
    stageName: "KDIV COCO",
    fullName: "Gbejewoh Okivie Divine",
    email: "kdvicoco@gmail.com",
    phone: "+234 803 222 1184",
    dob: "Jul 15, 2002",
    location: "Ikeja, Lagos",
    bio: "",
    instagram: "",
    twitter: "",
    facebook: "",
    tiktok: "",
    appleMusic: "",
    spotify: "",
    cover: "",
    avatar: "/images/avatar-artiste.svg",
  },
  {
    id: "2",
    stageName: "KDIV COCO",
    fullName: "Gbejewoh Okivie Divine",
    email: "kdvicoco@gmail.com",
    phone: "+234 803 222 1184",
    dob: "Jul 15, 2002",
    location: "Ikeja, Lagos",
    bio: "",
    instagram: "",
    twitter: "",
    facebook: "",
    tiktok: "",
    appleMusic: "",
    spotify: "",
    cover: "",
    avatar: "/images/avatar-artiste.svg",
  },
  {
    id: "3",
    stageName: "KDIV COCO",
    fullName: "Gbejewoh Okivie Divine",
    email: "kdvicoco@gmail.com",
    phone: "+234 803 222 1184",
    dob: "Jul 15, 2002",
    location: "Ikeja, Lagos",
    bio: "",
    instagram: "",
    twitter: "",
    facebook: "",
    tiktok: "",
    appleMusic: "",
    spotify: "",
    cover: "",
    avatar: "/images/avatar-artiste.svg",
  },
];

const PLAN_FEATURES = {
  starter: [
    "1 Artist Account",
    "Unlimited Releases",
    "Analytics",
    "Lyrics Distribution",
    "Keep 95% of Your Royalties",
    "Fast Payments & Easy Withdrawals",
    "Stream Links for Each Release",
  ],
  growth: [
    "All Basic Plan Features",
    "3 Artist Accounts",
    "100% of Your Royalties",
    "Customize Label Name",
    "Editorial Playlist Pitch Portal",
    "24/7 Support",
  ],
  label: [
    "All Growth Plan Features",
    "Up to 5 Artist Accounts",
    "Central label dashboard",
    "Multi-artist analytics & earnings view",
    "Bulk release management",
    "Faster release review & processing",
    "Priority support",
    "Customize Label Name",
    "Invite team members",
  ],
};

/* ─── Shared UI Primitives ────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  icon,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={[
        "relative w-10 h-5 rounded-full transition-colors shrink-0 focus-visible:outline-none",
        checked ? "bg-[#C30100]" : "bg-white/10",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[20px]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

/* ─── Tab: General ────────────────────────────────────────────── */
function GeneralTab() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      {/* Photo */}
      <div className="flex items-center gap-5 mb-7">
        <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10">
          <Image src="/images/avatar-artiste.svg" alt="avatar" fill className="object-cover" unoptimized />
        </div>
        <div>
          <button className="flex items-center gap-2 font-montserrat text-white text-sm border border-white/20 rounded-full px-4 py-2 hover:border-white/40 transition-colors">
            <CameraIcon />
            Change Photo
          </button>
          <p className="font-montserrat text-white/30 text-xs mt-2">JPG or PNG. 5MB max.</p>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name">
            <Input value={firstName} onChange={setFirstName} placeholder="Enter first name" />
          </Field>
          <Field label="Last Name">
            <Input value={lastName} onChange={setLastName} placeholder="Enter last name" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input value={email} onChange={setEmail} placeholder="your@email.com" type="email" />
          </Field>
          <Field label="Account Type">
            <div className="relative">
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
              >
                <option value="">Select type</option>
                <option value="artist">Artist</option>
                <option value="label">Label</option>
                <option value="manager">Manager</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </Field>
        </div>

        <Field label="Address">
          <Input value={address} onChange={setAddress} placeholder="Enter your address" />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="City">
            <Input value={city} onChange={setCity} placeholder="City" />
          </Field>
          <Field label="State">
            <Input value={state} onChange={setState} placeholder="State" />
          </Field>
          <Field label="Zip Code">
            <Input value={zip} onChange={setZip} placeholder="Zip" />
          </Field>
        </div>

        <div className="flex justify-end mt-2">
          <button className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-8 py-3.5 transition-all">
            Update Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Artist Profile ─────────────────────────────────────── */
function ArtistProfileTab() {
  const [profiles, setProfiles] = useState<ArtistProfile[]>(MOCK_PROFILES);
  const [showAddInfo, setShowAddInfo] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ArtistProfile | null>(null);
  const [showLimitInfo, setShowLimitInfo] = useState(false);

  const isAtLimit = profiles.length >= 3;

  const handleCreateNew = () => {
    if (isAtLimit) {
      setShowLimitInfo(true);
    } else {
      setEditingProfile(null);
      setShowEditModal(true);
    }
  };

  const handleEdit = (profile: ArtistProfile) => {
    setEditingProfile(profile);
    setShowEditModal(true);
  };

  return (
    <>
      {/* Plan info banner */}
      <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center">
              <UserGroupIcon />
            </div>
            <div>
              <p className="font-nulshock text-white text-sm uppercase tracking-wide">
                Growth Plan — Artist Profiles
              </p>
              <p className="font-montserrat text-xs mt-0.5">
                <span className="text-white/40">{profiles.length} of 3 profiles used</span>
                {isAtLimit && (
                  <span className="text-[#C30100] ml-2">
                    Limit reached — extra profiles cost ₦30,000 per artist per year
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 px-5 py-2.5 hover:border-white/40 transition-colors">
            Learn More
          </button>
        </div>

        {/* Profile cards grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onEdit={() => handleEdit(profile)} />
          ))}
        </div>

        {/* Add another artist */}
        <button
          onClick={() => { setEditingProfile(null); setShowEditModal(true); }}
          className="w-full rounded-xl border border-dashed border-[#C30100]/30 bg-transparent hover:bg-[#C30100]/5 transition-colors p-5 flex flex-col items-center gap-1.5"
        >
          <span className="text-white/40 text-2xl leading-none">+</span>
          <span className="font-montserrat text-white/50 text-sm">Add Another Artist</span>
          <span className="font-montserrat text-white/30 text-xs">₦30,000 per artist · billed annually · activates immediately after payment</span>
        </button>
      </div>

      {/* Create New CTA in header area handled via customCta */}
      {showLimitInfo && (
        <LimitInfoModal
          onClose={() => setShowLimitInfo(false)}
          onAddArtist={() => { setShowLimitInfo(false); /* trigger payment flow */ }}
        />
      )}

      {showEditModal && (
        <ArtistProfileModal
          profile={editingProfile}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            if (editingProfile) {
              setProfiles((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            } else {
              setProfiles((prev) => [...prev, { ...updated, id: String(Date.now()) }]);
            }
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

function ProfileCard({ profile, onEdit }: { profile: ArtistProfile; onEdit: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0E0808]">
      {/* Red header */}
      <div className="h-20 bg-[#C30100] relative" />

      {/* Avatar overlapping */}
      <div className="flex flex-col items-center px-4 pb-4 -mt-8">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-[#0E0808] shrink-0 mb-3">
          <Image src={profile.avatar} alt={profile.stageName} fill className="object-cover" unoptimized />
        </div>
        <p className="font-nulshock text-white uppercase text-sm tracking-wide text-center">{profile.stageName}</p>
        <p className="font-montserrat text-white/40 text-xs mt-0.5 text-center">{profile.fullName}</p>

        <div className="flex flex-col gap-1.5 mt-3 w-full">
          <div className="flex items-center gap-2 text-white/40">
            <MailIcon />
            <span className="font-montserrat text-[11px] truncate">{profile.email}</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <PhoneIcon />
            <span className="font-montserrat text-[11px]">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <CalendarIcon />
            <span className="font-montserrat text-[11px]">{profile.dob}</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <PinIcon />
            <span className="font-montserrat text-[11px]">{profile.location}</span>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3 mt-3">
          <InstagramIcon />
          <SpotifyIcon />
          <XIcon />
        </div>

        <button
          onClick={onEdit}
          className="mt-4 w-full flex items-center justify-center gap-2 font-montserrat text-white text-xs border border-white/20 rounded-full py-2.5 hover:border-white/40 transition-colors"
        >
          <EditIcon />
          Edit Profile
        </button>
      </div>
    </div>
  );
}

/* ─── Limit Info Modal ────────────────────────────────────────── */
function LimitInfoModal({ onClose, onAddArtist }: { onClose: () => void; onAddArtist: () => void }) {
  const steps = [
    { title: "Go to Settings + Artist Profile", desc: "Navigate to your Label dashboard. Open Settings and click the Artist Profile tab to see all current profiles." },
    { title: "Click \"+ Create New Profile\"", desc: "The button is in the top-right of the screen. This opens the setup form for the artist's name, email, date of birth, and location." },
    { title: "Review the seat fee", desc: "Since your 3-profile limit is reached, a payment prompt appears. You'll see a clear summary showing the ₦30,000 / month charge before confirming." },
    { title: "Complete payment", desc: "Pay with your saved card or add a new method. The new artist slot activates immediately after payment is confirmed." },
    { title: "Start distributing", desc: "The new profile appears in your label dashboard with full access to distribution, analytics, earnings, Ayo AI, Splitr, and Amplify." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[620px] rounded-2xl bg-[#140C0C] border border-white/[0.07] p-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <div className="text-center mb-7">
          <h2 className="font-nulshock text-white uppercase text-lg tracking-wide">Adding Artists to Your Label Plan</h2>
          <p className="font-montserrat text-white/50 text-sm mt-2">Create your professional artist profile</p>
        </div>

        <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 mb-5">
          <p className="font-montserrat text-white text-sm font-semibold">Your Label Plan includes 3 artist profiles</p>
          <p className="font-montserrat text-white/40 text-xs mt-1">
            Each additional seat costs <span className="text-[#C30100]">₦30,000</span> per artist, per year — charged immediately and billed with your renewal.
          </p>
        </div>

        <p className="font-nulshock text-white/50 uppercase text-xs tracking-widest mb-4">How to Add a New Artist</p>

        <div className="flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#C30100] flex items-center justify-center shrink-0">
                  <span className="font-nulshock text-white text-[10px]">{i + 1}</span>
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-[#C30100]/20 my-1" />}
              </div>
              <div className="pb-5">
                <p className="font-montserrat text-white text-sm font-semibold">{step.title}</p>
                <p className="font-montserrat text-white/40 text-xs mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4 mb-6">
          <p className="font-montserrat text-white/50 text-xs leading-relaxed">
            All prices in Nigerian Naira (₦). For billing support contact{" "}
            <span className="text-[#C30100]">billing@songdis.com</span>. Extra seat fees are non-refundable once payment is processed.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
            Cancel
          </button>
          <button onClick={onAddArtist} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all">
            Add Artist
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Artist Profile Modal (2-step) ──────────────────────────── */
function ArtistProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ArtistProfile | null;
  onClose: () => void;
  onSave: (p: ArtistProfile) => void;
}) {
  const [step, setStep] = useState<ProfileModalStep>("info");
  const [spotifySearch, setSpotifySearch] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState(profile?.spotify ?? "");
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [stageName, setStageName] = useState(profile?.stageName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [twitter, setTwitter] = useState(profile?.twitter ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram ?? "");
  const [facebook, setFacebook] = useState(profile?.facebook ?? "");
  const [tiktok, setTiktok] = useState(profile?.tiktok ?? "");
  const [appleMusic, setAppleMusic] = useState(profile?.appleMusic ?? "");
  const [noTwitter, setNoTwitter] = useState(false);
  const [noInstagram, setNoInstagram] = useState(false);
  const [noFacebook, setNoFacebook] = useState(false);
  const [noTiktok, setNoTiktok] = useState(false);
  const [noAppleMusic, setNoAppleMusic] = useState(false);

  const isEdit = !!profile;

  const handleSave = () => {
    onSave({
      id: profile?.id ?? "",
      stageName,
      fullName,
      email,
      phone,
      dob,
      location,
      bio,
      instagram,
      twitter,
      facebook,
      tiktok,
      appleMusic,
      spotify: spotifyUrl,
      cover: profile?.cover ?? "",
      avatar: profile?.avatar ?? "/images/avatar-artiste.svg",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[660px] rounded-2xl bg-[#140C0C] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10">
          <CloseIcon />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-nulshock text-white uppercase text-lg tracking-wide">Artist Profile Setup</h2>
            <p className="font-montserrat text-white/50 text-sm mt-1">Create your professional artist profile</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-7">
            <div className="flex items-center gap-0 bg-[#0E0808] border border-white/[0.06] rounded-2xl px-8 py-4 w-full max-w-xs">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={["w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-nulshock transition-colors", step === "info" ? "bg-[#C30100] text-white" : "bg-white/10 text-white/40"].join(" ")}>1</div>
                <span className="font-montserrat text-white/40 text-[10px]">Personal Info</span>
              </div>
              <div className="flex-1 h-px bg-white/10 mb-4" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={["w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-nulshock transition-colors", step === "social" ? "bg-[#C30100] text-white" : "bg-white/10 text-white/40"].join(" ")}>2</div>
                <span className="font-montserrat text-white/40 text-[10px]">Social Links</span>
              </div>
            </div>
          </div>

          {step === "info" && (
            <div className="flex flex-col gap-5">
              {/* Spotify search */}
              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
                <p className="font-montserrat text-white text-xs font-semibold mb-0.5">Find Your Spotify Profile (Optional)</p>
                <p className="font-montserrat text-white/50 text-[11px] mb-3">Search For Your Artist Name On Spotify To Auto-Fill Your Profile And Get A Verified Badge.</p>
                <Input value={spotifySearch} onChange={setSpotifySearch} placeholder="E.g Burna boy, Wizkid, your artist name" />
              </div>

              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
                <p className="font-montserrat text-white text-xs font-semibold mb-0.5">OR paste your Spotify artist URL</p>
                <p className="font-montserrat text-white/50 text-[11px] mb-3">Can't find yourself in the search above? Paste your Spotify artist page URL directly</p>
                <div className="flex gap-2">
                  <Input value={spotifyUrl} onChange={setSpotifyUrl} placeholder="https://open.spotify.com/artist/" />
                  <button className="shrink-0 font-nulshock text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-4 py-2.5 transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <CheckSmallIcon />
                    Verify
                  </button>
                </div>
              </div>

              <p className="font-montserrat text-white text-sm font-semibold">Personal Information</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input value={fullName} onChange={setFullName} placeholder="Your full legal name" /></Field>
                <Field label="Stage Name"><Input value={stageName} onChange={setStageName} placeholder="Your artist name" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email"><Input value={email} onChange={setEmail} placeholder="Email" type="email" /></Field>
                <Field label="Phone number"><Input value={phone} onChange={setPhone} placeholder="Phone number" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of birth">
                  <Input value={dob} onChange={setDob} placeholder="mm/dd/yyyy" type="date" icon={<CalendarIcon />} />
                </Field>
                <Field label="Location"><Input value={location} onChange={setLocation} placeholder="City, Country" /></Field>
              </div>
              <Field label="Bio">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 1000))}
                  placeholder="Tell us about yourself and your music"
                  rows={3}
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
                />
                <p className="font-montserrat text-white/30 text-[11px]">{bio.length}/1000 Characters</p>
              </Field>

              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">Cancel</button>
                <button onClick={() => setStep("social")} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all">Continue</button>
              </div>
            </div>
          )}

          {step === "social" && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-dashed border-[#C30100]/30 p-3">
                <p className="font-montserrat text-white/50 text-xs">
                  All social links are optional. You can add them now or update your profile later. Just tick the checkbox next to any platform you don't use.
                </p>
              </div>

              <p className="font-montserrat text-white text-sm font-semibold">Social Media</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field label="Twitter">
                    <Input value={twitter} onChange={noTwitter ? undefined : setTwitter} placeholder="Twitter handle" />
                  </Field>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={noTwitter} onChange={() => setNoTwitter(!noTwitter)} className="accent-[#C30100]" />
                    <span className="font-montserrat text-white/40 text-xs">I don't have twitter</span>
                  </label>
                </div>
                <div>
                  <Field label="Instagram">
                    <Input value={instagram} onChange={noInstagram ? undefined : setInstagram} placeholder="Instagram handle" />
                  </Field>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={noInstagram} onChange={() => setNoInstagram(!noInstagram)} className="accent-[#C30100]" />
                    <span className="font-montserrat text-white/40 text-xs">I don't have Instagram</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field label="Facebook">
                    <Input value={facebook} onChange={noFacebook ? undefined : setFacebook} placeholder="Facebook handle" />
                  </Field>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={noFacebook} onChange={() => setNoFacebook(!noFacebook)} className="accent-[#C30100]" />
                    <span className="font-montserrat text-white/40 text-xs">I don't have Facebook</span>
                  </label>
                </div>
                <div>
                  <Field label="TikTok">
                    <Input value={tiktok} onChange={noTiktok ? undefined : setTiktok} placeholder="TikTok handle" />
                  </Field>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={noTiktok} onChange={() => setNoTiktok(!noTiktok)} className="accent-[#C30100]" />
                    <span className="font-montserrat text-white/40 text-xs">I don't have TikTok</span>
                  </label>
                </div>
              </div>

              <div>
                <Field label="Apple Music (Go to your Apple Music artist page and copy the full URL from your browser's address bar).">
                  <Input value={appleMusic} onChange={noAppleMusic ? undefined : setAppleMusic} placeholder="Apple Music artist URL" />
                </Field>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={noAppleMusic} onChange={() => setNoAppleMusic(!noAppleMusic)} className="accent-[#C30100]" />
                  <span className="font-montserrat text-white/40 text-xs">I don't have Apple Music</span>
                </label>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep("info")} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">Cancel</button>
                <button onClick={handleSave} className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all">
                  {isEdit ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Ayo AI Preferences ─────────────────────────────────── */
function AyoAITab() {
  const [proactive, setProactive] = useState(true);
  const [autoDraft, setAutoDraft] = useState(true);
  const [trendAlerts, setTrendAlerts] = useState(true);
  const [artworkSuggestions, setArtworkSuggestions] = useState(true);

  const items = [
    { label: "Proactive Insights", desc: "Show Ayo tips across all pages", checked: proactive, toggle: () => setProactive(!proactive) },
    { label: "Pitch Auto-Draft", desc: "Auto-generate pitches for new releases", checked: autoDraft, toggle: () => setAutoDraft(!autoDraft) },
    { label: "Trend Alerts", desc: "Notify when genre trends match your style", checked: trendAlerts, toggle: () => setTrendAlerts(!trendAlerts) },
    { label: "Artwork Suggestions", desc: "Suggest themes when you upload", checked: artworkSuggestions, toggle: () => setArtworkSuggestions(!artworkSuggestions) },
  ];

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-5">Ayo AI Preferences</p>
      <div className="flex flex-col gap-0 divide-y divide-white/[0.04]">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-4">
            <div>
              <p className="font-montserrat text-white text-sm">{item.label}</p>
              <p className="font-montserrat text-white/40 text-xs mt-0.5">{item.desc}</p>
            </div>
            <Toggle checked={item.checked} onChange={item.toggle} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Notification ───────────────────────────────────────── */
function NotificationTab() {
  const [streamMilestones, setStreamMilestones] = useState(true);
  const [earningsUpdates, setEarningsUpdates] = useState(true);
  const [playlistApprovals, setPlaylistApprovals] = useState(true);

  const items = [
    { label: "Stream Milestones", desc: "At 100, 1K, 10K streams", checked: streamMilestones, toggle: () => setStreamMilestones(!streamMilestones) },
    { label: "Earnings Updates", desc: "Weekly summary email", checked: earningsUpdates, toggle: () => setEarningsUpdates(!earningsUpdates) },
    { label: "Playlist Approvals", desc: "When your track gets added", checked: playlistApprovals, toggle: () => setPlaylistApprovals(!playlistApprovals) },
  ];

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-5">Notifications</p>
      <div className="flex flex-col gap-0 divide-y divide-white/[0.04]">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-4">
            <div>
              <p className="font-montserrat text-white text-sm">{item.label}</p>
              <p className="font-montserrat text-white/40 text-xs mt-0.5">{item.desc}</p>
            </div>
            <Toggle checked={item.checked} onChange={item.toggle} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Security ───────────────────────────────────────────── */
function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-1">Password & Security</p>
      <p className="font-montserrat text-white/40 text-xs mb-6">Manage your account security settings</p>

      <div className="flex flex-col gap-4">
        <Field label="Current Password">
          <Input
            value={current}
            onChange={setCurrent}
            placeholder="Enter password"
            type={showCurrent ? "text" : "password"}
            icon={<EyeToggle show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />}
          />
        </Field>
        <Field label="New Password">
          <Input
            value={newPass}
            onChange={setNewPass}
            placeholder="Enter password"
            type={showNew ? "text" : "password"}
            icon={<EyeToggle show={showNew} onToggle={() => setShowNew(!showNew)} />}
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            value={confirm}
            onChange={setConfirm}
            placeholder="Enter password"
            type={showConfirm ? "text" : "password"}
            icon={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />}
          />
        </Field>

        <div className="flex justify-end mt-2">
          <button className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-8 py-3.5 transition-all w-full">
            Update Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="text-white/30 hover:text-white/60 transition-colors">
      {show ? <EyeOffIcon /> : <EyeOffIcon />}
    </button>
  );
}

/* ─── Tab: Subscription ───────────────────────────────────────── */
function SubscriptionTab() {
  const [billing, setBilling] = useState<BillingCycle>("yearly");

  const plans = [
    {
      id: "starter",
      name: "Starter",
      tagline: "Best for: New & independent artists starting out",
      priceMonthly: "₦4,000.00",
      priceYearly: "₦44,000.00",
      features: PLAN_FEATURES.starter,
      current: false,
      cta: "Get Help & Support",
      ctaVariant: "outline" as const,
    },
    {
      id: "growth",
      name: "Growth Plan",
      tagline: "Best for: Serious independent artists & growing teams",
      priceMonthly: "₦14,000.00",
      priceYearly: "₦140,000.00",
      features: PLAN_FEATURES.growth,
      current: true,
      cta: "Upgrade to Growth",
      ctaVariant: "red" as const,
    },
    {
      id: "label",
      name: "Label Plan",
      tagline: "Best for: Small labels, managers & collectives",
      priceMonthly: "₦16,000.00",
      priceYearly: "₦150,000.00",
      features: PLAN_FEATURES.label,
      current: false,
      cta: "Start a Label",
      ctaVariant: "outline" as const,
      addons: ["Add extra artist: ₦30,000 Per artist / year"],
    },
  ];

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-1">Subscription</p>
      <p className="font-montserrat text-white/40 text-xs mb-6">Manage your account security settings</p>

      {/* Billing toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-[#0E0808] border border-white/[0.06] rounded-full p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={["font-nulshock uppercase text-xs tracking-widest px-5 py-2 rounded-full transition-all", billing === "monthly" ? "bg-white/10 text-white" : "text-white/40"].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={["font-nulshock uppercase text-xs tracking-widest px-5 py-2 rounded-full transition-all", billing === "yearly" ? "bg-[#C30100] text-white" : "text-white/40"].join(" ")}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={[
              "rounded-2xl p-5 flex flex-col border transition-colors",
              plan.current
                ? "bg-[#1A0808] border-[#C30100]"
                : "bg-[#0E0808] border-white/[0.06]",
            ].join(" ")}
          >
            {plan.current && (
              <div className="flex justify-center mb-3">
                <span className="font-montserrat text-white text-[10px] border border-white/20 rounded-full px-3 py-1">Current Plan</span>
              </div>
            )}
            <p className="font-nulshock text-white uppercase text-sm tracking-wide">{plan.name}</p>
            <p className="font-montserrat text-white/40 text-[11px] mt-1 mb-3 leading-relaxed">{plan.tagline}</p>
            <p className="font-nulshock text-white text-xl mb-1">
              {billing === "yearly" ? plan.priceYearly : plan.priceMonthly}
              <span className="font-montserrat text-white/30 text-xs">/{billing === "yearly" ? "year" : "month"}</span>
            </p>

            <div className="flex flex-col gap-2 mt-4 flex-1">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckSmallIcon />
                  </span>
                  <span className="font-montserrat text-white/60 text-xs">{f}</span>
                </div>
              ))}
            </div>

            {plan.addons && (
              <div className="mt-4">
                <p className="font-nulshock text-white/50 uppercase text-[10px] tracking-widest mb-2">Add-Ons</p>
                {plan.addons.map((a) => (
                  <div key={a} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckSmallIcon />
                    </span>
                    <span className="font-montserrat text-white/60 text-xs">{a}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className={[
                "mt-5 w-full font-nulshock uppercase text-[10px] tracking-widest rounded-full py-3 transition-all",
                plan.ctaVariant === "red"
                  ? "border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] text-white"
                  : "border border-white/20 text-white hover:border-white/40",
              ].join(" ")}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        <span className="w-2 h-2 rounded-full bg-[#C30100]" />
        <p className="font-montserrat text-white/40 text-xs">Need a custom solution? Contact our sales team for enterprise options.</p>
      </div>
    </div>
  );
}

/* ─── Tab config ──────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "artist-profile", label: "Artist Profile" },
  { id: "ayo-ai", label: "Ayo AI Preferences" },
  { id: "notification", label: "Notification" },
  { id: "security", label: "Security" },
  { id: "subscription", label: "Subscription" },
];

/* ─── Page ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);

  const isArtistProfile = activeTab === "artist-profile";

  return (
    <DashboardLayout
      userName="VJazzy"
      customCta={
        isArtistProfile
          ? { label: "+ Create New Profile", onClick: () => setShowNewProfileModal(true) }
          : undefined
      }
    >
      <div className="flex flex-col gap-5">
        {/* Page header */}
        <div>
          <h2 className="font-nulshock text-white uppercase text-2xl tracking-wide">Settings</h2>
          <p className="font-montserrat text-white/50 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border border-dashed border-[#C30100]/30 rounded-2xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "font-nulshock uppercase text-xs tracking-widest px-4 py-2.5 rounded-xl whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "artist-profile" && <ArtistProfileTab />}
        {activeTab === "ayo-ai" && <AyoAITab />}
        {activeTab === "notification" && <NotificationTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "subscription" && <SubscriptionTab />}
      </div>

      {showNewProfileModal && (
        <ArtistProfileModal
          profile={null}
          onClose={() => setShowNewProfileModal(false)}
          onSave={() => setShowNewProfileModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CameraIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>; }
function ChevronDownIcon({ className }: { className?: string }) { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function CheckSmallIcon() { return <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function EyeOffIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function MailIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function PhoneIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.17-1.17a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.92 15z"/></svg>; }
function PinIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function EditIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function UserGroupIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function InstagramIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>; }
function SpotifyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/30"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>; }
function XIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/30"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }