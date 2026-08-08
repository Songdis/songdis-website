"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request } from "@/lib/api/core";
import { useToast } from "@/components/ui/Toast";
import { useState, Suspense } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { GeneralTab } from "@/components/dashboard/settings/GeneralTab";
import ArtistProfileModal from "@/components/dashboard/settings/ArtistProfileModal";
import type { ArtistProfile } from "@/components/dashboard/settings/ArtistProfileModal";
import { useBilling } from "@/lib/hooks/useBilling";
import PlanGrid from "@/components/billing/PlanGrid";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Tab =
  | "general"
  | "artist-profile"
  | "ayo-ai"
  | "notification"
  | "security"
  | "subscription";

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
        className="w-full min-h-[48px] bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
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


function ArtistProfileTab() {
  const [profiles, setProfiles] = useState<ArtistProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ArtistProfile | null>(
    null,
  );
  const [showLimitInfo, setShowLimitInfo] = useState(false);
  const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<ArtistProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { isLocked, artists } = useBilling(0);
  const router = useRouter();


  const handleAddArtist = () => {
    if (isLocked || artists?.can_create === false) {
      setShowSubscribePrompt(true);
      return;
    }

    setEditingProfile(null);
    setShowEditModal(true);
  };

  useEffect(() => {
    setIsLoading(true);
    request<unknown>("/profile", { method: "GET" }, true).then((res) => {
      if (!res.error && res.data) {
        const raw = res.data as Record<string, unknown>;

        const list = Array.isArray(raw.profiles)
          ? raw.profiles
          : Array.isArray(res.data)
            ? res.data
            : Array.isArray(raw.data)
              ? raw.data
              : [];

        setProfiles(
          (list as Record<string, unknown>[]).map((p) => ({
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
            youtube: (p.youtube_url ?? p.youtube ?? "") as string,
            appleMusic: (p.apple_music_url ?? p.appleMusic ?? "") as string,
            spotify: (p.spotify_url ?? p.spotify ?? "") as string,
            cover: (p.cover ?? "") as string,
            avatar: (p.profile_image ??
              p.spotify_image_url ??
              p.avatar_url ??
              "/images/avatar-artiste.svg") as string,
          })),
        );
      }
      setIsLoading(false);
    });
  }, []);

  const isAtLimit = profiles.length >= 3;

  const handleEdit = (profile: ArtistProfile) => {
    setEditingProfile(profile);
    setShowEditModal(true);
  };


  const handleDelete = async (profile: ArtistProfile) => {
    setDeleteError(null);
    setDeletingId(profile.id);

    const res = await request<{ message?: string }>(
      `/profile/${profile.id}`,
      { method: "DELETE" },
      true,
    );

    setDeletingId(null);

    if (res.error) {
      setDeleteError(res.error);
      return;
    }

    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setConfirmingDelete(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center shrink-0">
              <UserGroupIcon />
            </div>
            <div>
              <p className="font-nulshock text-white text-sm uppercase tracking-wide">
                Artist Profiles
              </p>
              <p className="font-montserrat text-xs mt-0.5">
                <span className="text-white/40">
                  {profiles.length} artist profiles created
                </span>
                {isAtLimit && (
                  <span className="text-[#C30100] ml-2">
                    Limit reached — extra profiles cost ₦30,000 per artist per
                    year
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 px-5 py-2.5 hover:border-white/40 transition-colors shrink-0">
            Learn More
          </button>
        </div>

        {isLoading ? (
          <p className="font-montserrat text-white/30 text-sm text-center py-8">
            Loading profiles...
          </p>
        ) : profiles.length === 0 ? (
          <p className="font-montserrat text-white/30 text-sm text-center py-8">
            No artist profiles yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => handleEdit(profile)}
                onDelete={() => {
                  setDeleteError(null);
                  setConfirmingDelete(profile);
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleAddArtist}
          className="w-full rounded-xl border border-dashed border-[#C30100]/30 bg-transparent hover:bg-[#C30100]/5 transition-colors p-5 flex flex-col items-center gap-1.5"
        >
          <span className="text-white/40 text-2xl leading-none">+</span>
          <span className="font-montserrat text-white/50 text-sm">
            {profiles.length === 0 ? "Create Your First Artist Profile" : "Add Another Artist"}
          </span>
        </button>
      </div>

 
      <ConfirmDialog
        open={showSubscribePrompt}
        title={profiles.length === 0 ? "Choose a plan to continue" : "Upgrade to add another artist"}
        confirmLabel="View Plans"
        cancelLabel="Not now"
        onConfirm={() => {
          setShowSubscribePrompt(false);
          router.replace("/dashboard/settings?tab=subscription");
        }}
        onCancel={() => setShowSubscribePrompt(false)}
        message={
          profiles.length === 0 ? (
            <p>
              Artist profiles are part of every plan. Pick one and you can create
              your profile and start releasing straight away.
            </p>
          ) : (
            <p>
              Your current plan covers{" "}
              <span className="text-white font-medium">
                {artists?.limit ?? 1} artist{(artists?.limit ?? 1) === 1 ? "" : "s"}
              </span>
              . Move up a plan to add more.
            </p>
          )
        }
      />

      {showLimitInfo && (
        <LimitInfoModal
          onClose={() => setShowLimitInfo(false)}
          onAddArtist={() => setShowLimitInfo(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteProfileModal
          profile={confirmingDelete}
          isDeleting={deletingId === confirmingDelete.id}
          error={deleteError}
          onCancel={() => {
            setConfirmingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => handleDelete(confirmingDelete)}
        />
      )}

      {showEditModal && (
        <ArtistProfileModal
          profile={editingProfile}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            if (editingProfile) {
              setProfiles((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p)),
              );
            } else {
              setProfiles((prev) => [
                ...prev,
                { ...updated, id: String(Date.now()) },
              ]);
            }
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}


function ProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: ArtistProfile;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0E0808] overflow-hidden">
      {/* Red header */}
      <div className="h-20 bg-[#C30100]" />

      <div className="flex flex-col items-center px-4 pb-4 -mt-8 relative z-10">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-[#0E0808] shrink-0 mb-3">
          <Image
            src={profile.avatar}
            alt={profile.stageName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <p className="font-nulshock text-white uppercase text-sm tracking-wide text-center">
          {profile.stageName}
        </p>
        <p className="font-montserrat text-white/40 text-xs mt-0.5 text-center">
          {profile.fullName}
        </p>

        <div className="flex flex-col gap-1.5 mt-3 w-full">
          <div className="flex items-center gap-2 text-white/40">
            <MailIcon />
            <span className="font-montserrat text-[11px] truncate">
              {profile.email}
            </span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 text-white/40">
              <PhoneIcon />
              <span className="font-montserrat text-[11px]">
                {profile.phone}
              </span>
            </div>
          )}
          {profile.dob && (
            <div className="flex items-center gap-2 text-white/40">
              <CalendarIcon />
              <span className="font-montserrat text-[11px]">{profile.dob}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 text-white/40">
              <PinIcon />
              <span className="font-montserrat text-[11px]">
                {profile.location}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <InstagramIcon />
          <SpotifyIcon />
          <XIcon />
        </div>

        <button
          onClick={onEdit}
          className="mt-4 w-full flex items-center justify-center gap-2 font-montserrat text-white text-xs border border-white/20 rounded-full py-2.5 hover:border-white/40 transition-colors min-h-[44px]"
        >
          <EditIcon />
          Edit Profile
        </button>

       
        {onDelete && (
          <button
            onClick={onDelete}
            className="mt-2 w-full font-montserrat text-white/35 text-[11px] hover:text-[#C30100] transition-colors py-2 min-h-[36px]"
          >
            Delete profile
          </button>
        )}
      </div>
    </div>
  );
}


function DeleteProfileModal({
  profile,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: {
  profile: ArtistProfile;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === profile.stageName.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-6">
        <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-2">
          Delete {profile.stageName}?
        </p>

        <p className="font-montserrat text-white/50 text-xs leading-relaxed mb-4">
          This permanently removes the artist profile and its picture. It cannot
          be undone. Any music already released under this name stays on the
          streaming platforms.
        </p>

        <label className="block font-montserrat text-white/40 text-[11px] mb-1.5">
          Type <span className="text-white/70">{profile.stageName}</span> to confirm
        </label>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          className="w-full rounded-lg bg-[#0E0808] border border-white/10 px-3 py-2.5 font-montserrat text-white text-sm outline-none focus:border-[#C30100]/50 transition-colors"
        />

        {error && (
          <p className="font-montserrat text-[#ff6b6b] text-xs mt-3 leading-relaxed">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 font-montserrat text-white text-xs border border-white/20 rounded-full py-2.5 hover:border-white/40 transition-colors min-h-[44px] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || isDeleting}
            className="flex-1 font-montserrat text-white text-xs bg-[#C30100] rounded-full py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LimitInfoModal({
  onClose,
  onAddArtist,
}: {
  onClose: () => void;
  onAddArtist: () => void;
}) {
  const steps = [
    {
      title: "Go to Settings + Artist Profile",
      desc: "Navigate to your Label dashboard. Open Settings and click the Artist Profile tab to see all current profiles.",
    },
    {
      title: 'Click "+ Create New Profile"',
      desc: "The button is in the top-right of the screen. This opens the setup form for the artist's name, email, date of birth, and location.",
    },
    {
      title: "Review the seat fee",
      desc: "Since your 3-profile limit is reached, a payment prompt appears. You'll see a clear summary showing the ₦30,000 / month charge before confirming.",
    },
    {
      title: "Complete payment",
      desc: "Pay with your saved card or add a new method. The new artist slot activates immediately after payment is confirmed.",
    },
    {
      title: "Start distributing",
      desc: "The new profile appears in your label dashboard with full access to distribution, analytics, earnings, Ayo AI, Splitr, and Amplify.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[620px] rounded-2xl bg-[#140C0C] border border-white/[0.07] p-6 sm:p-8 max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="text-center mb-7">
          <h2 className="font-nulshock text-white uppercase text-lg tracking-wide">
            Adding Artists to Your Label Plan
          </h2>
          <p className="font-montserrat text-white/50 text-sm mt-2">
            Create your professional artist profile
          </p>
        </div>
        <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 mb-5">
        </div>
        <p className="font-nulshock text-white/50 uppercase text-xs tracking-widest mb-4">
          How to Add a New Artist
        </p>
        <div className="flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#C30100] flex items-center justify-center shrink-0">
                  <span className="font-nulshock text-white text-[10px]">
                    {i + 1}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-[#C30100]/20 my-1" />
                )}
              </div>
              <div className="pb-5">
                <p className="font-montserrat text-white text-sm font-semibold">
                  {step.title}
                </p>
                <p className="font-montserrat text-white/40 text-xs mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4 mb-6">
          <p className="font-montserrat text-white/50 text-xs leading-relaxed">
            All prices in Nigerian Naira (₦). For billing support contact{" "}
            <span className="text-[#C30100]">billing@songdis.com</span>. Extra
            seat fees are non-refundable once payment is processed.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={onAddArtist}
            className="flex-1 font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all min-h-[48px]"
          >
            Add Artist
          </button>
        </div>
      </div>
    </div>
  );
}


function AyoAITab() {
  const [proactive, setProactive] = useState(true);
  const [autoDraft, setAutoDraft] = useState(true);
  const [trendAlerts, setTrendAlerts] = useState(true);
  const [artworkSuggestions, setArtworkSuggestions] = useState(true);
  const items = [
    {
      label: "Proactive Insights",
      desc: "Show Ayo tips across all pages",
      checked: proactive,
      toggle: () => setProactive(!proactive),
    },
    {
      label: "Pitch Auto-Draft",
      desc: "Auto-generate pitches for new releases",
      checked: autoDraft,
      toggle: () => setAutoDraft(!autoDraft),
    },
    {
      label: "Trend Alerts",
      desc: "Notify when genre trends match your style",
      checked: trendAlerts,
      toggle: () => setTrendAlerts(!trendAlerts),
    },
    {
      label: "Artwork Suggestions",
      desc: "Suggest themes when you upload",
      checked: artworkSuggestions,
      toggle: () => setArtworkSuggestions(!artworkSuggestions),
    },
  ];
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-5">
        Ayo AI Preferences
      </p>
      <div className="flex flex-col gap-0 divide-y divide-white/[0.04]">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-4 gap-3"
          >
            <div className="min-w-0">
              <p className="font-montserrat text-white text-sm">{item.label}</p>
              <p className="font-montserrat text-white/40 text-xs mt-0.5">
                {item.desc}
              </p>
            </div>
            <Toggle checked={item.checked} onChange={item.toggle} />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationTab() {
  const [streamMilestones, setStreamMilestones] = useState(true);
  const [earningsUpdates, setEarningsUpdates] = useState(true);
  const [playlistApprovals, setPlaylistApprovals] = useState(true);
  const items = [
    {
      label: "Stream Milestones",
      desc: "At 100, 1K, 10K streams",
      checked: streamMilestones,
      toggle: () => setStreamMilestones(!streamMilestones),
    },
    {
      label: "Earnings Updates",
      desc: "Weekly summary email",
      checked: earningsUpdates,
      toggle: () => setEarningsUpdates(!earningsUpdates),
    },
    {
      label: "Playlist Approvals",
      desc: "When your track gets added",
      checked: playlistApprovals,
      toggle: () => setPlaylistApprovals(!playlistApprovals),
    },
  ];
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-5">
        Notifications
      </p>
      <div className="flex flex-col gap-0 divide-y divide-white/[0.04]">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-4 gap-3"
          >
            <div className="min-w-0">
              <p className="font-montserrat text-white text-sm">{item.label}</p>
              <p className="font-montserrat text-white/40 text-xs mt-0.5">
                {item.desc}
              </p>
            </div>
            <Toggle checked={item.checked} onChange={item.toggle} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-1">
        Password & Security
      </p>
      <p className="font-montserrat text-white/40 text-xs mb-6">
        Manage your account security settings
      </p>
      <div className="flex flex-col gap-4">
        <Field label="Current Password">
          <Input
            value={current}
            onChange={setCurrent}
            placeholder="Enter password"
            type={showCurrent ? "text" : "password"}
            icon={
              <EyeToggle
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
              />
            }
          />
        </Field>
        <Field label="New Password">
          <Input
            value={newPass}
            onChange={setNewPass}
            placeholder="Enter password"
            type={showNew ? "text" : "password"}
            icon={
              <EyeToggle show={showNew} onToggle={() => setShowNew(!showNew)} />
            }
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            value={confirm}
            onChange={setConfirm}
            placeholder="Enter password"
            type={showConfirm ? "text" : "password"}
            icon={
              <EyeToggle
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
              />
            }
          />
        </Field>
        <div className="flex justify-end mt-2">
          <button className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-8 py-3.5 transition-all w-full min-h-[48px]">
            Update Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="text-white/30 hover:text-white/60 transition-colors"
    >
      <EyeOffIcon />
    </button>
  );
}

function SubscriptionTab() {
  const {
    isLoading,
    status,
    planName,
    isActive,
    isExpired,
    isTrialing,
    endDate,
    daysUntilExpiry,
    autoRenew,
    renewsManually,
    refresh: refreshBilling,
  } = useBilling();

  const [cancelling, setCancelling] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const handleCancel = async () => {
    setConfirmCancelOpen(false);
    setCancelling(true);
    try {
      const { cancelBilling } = await import("@/lib/api/billing");
      const res = await cancelBilling();

      if (res.error) {
        toastError("Cancellation failed", res.error);
      } else {
        success(
          "Subscription cancelled",
          res.message ?? "You will keep access until your period ends."
        );
        refreshBilling();
      }
    } catch {
      toastError("Cancellation failed", "Something went wrong.");
    } finally {
      setCancelling(false);
    }
  };


  const handleResume = async () => {
    setResuming(true);
    try {
      const { resumeBilling } = await import("@/lib/api/billing");
      const res = await resumeBilling();

      if (res.error) {
        toastError("Could not resume", res.error);
        return;
      }

      if (res.data?.requires_portal && res.data.portal_url) {
        window.location.href = res.data.portal_url;
        return;
      }

      success("Subscription resumed", res.message ?? "Your plan will continue.");
      refreshBilling();
    } catch {
      toastError("Could not resume", "Something went wrong.");
    } finally {
      setResuming(false);
    }
  };


  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const { createPortalSession } = await import("@/lib/api/billing");
      const res = await createPortalSession();

      if (res.data?.portal_url) {
        window.location.href = res.data.portal_url;
      } else {
        toastError("Unavailable", res.error ?? "Billing portal could not be opened.");
      }
    } catch {
      toastError("Unavailable", "Billing portal could not be opened.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const dateStr = endDate
    ? new Date(endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      <p className="font-nulshock text-white uppercase text-sm tracking-wide mb-1">
        Subscription
      </p>
      <p className="font-montserrat text-white/40 text-xs mb-6">
        Manage your plan and billing
      </p>

      {/* Current plan summary */}
      {!isLoading && isActive && (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-[#0E0808] px-4 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-nulshock text-white uppercase text-xs tracking-wide">
                  {planName ?? "Active plan"}
                </p>
                {isTrialing && (
                  <span className="font-montserrat text-[10px] rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2 py-0.5">
                    Free trial
                  </span>
                )}
                {status?.source === "legacy" && (
                  <span className="font-montserrat text-[10px] rounded-full bg-white/[0.06] text-white/50 border border-white/10 px-2 py-0.5">
                    Existing plan
                  </span>
                )}
                {status?.cancel_at_period_end && (
                  <span className="font-montserrat text-[10px] rounded-full bg-[#C30100]/15 text-[#C30100] border border-[#C30100]/30 px-2 py-0.5">
                    Cancels at period end
                  </span>
                )}
              </div>

              <p className="font-montserrat text-white/40 text-[11px] mt-1.5">
                {dateStr
                  ? autoRenew && !status?.cancel_at_period_end
                    ? `Renews automatically on ${dateStr}`
                    : `Access until ${dateStr}`
                  : "Active"}
                {daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry >= 0
                  ? ` · ${
                      daysUntilExpiry === 0
                        ? "expires today"
                        : `${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} left`
                    }`
                  : ""}
              </p>


              {renewsManually && !status?.cancel_at_period_end && (
                <p className="font-montserrat text-white/30 text-[11px] mt-1">
                  This plan does not renew automatically — pay again before it ends to stay active.
                </p>
              )}
            </div>

            {status?.artists && (
              <div className="text-right shrink-0">
                <p className="font-nulshock text-white text-lg">
                  {status.artists.used}
                  <span className="text-white/30 text-sm">/{status.artists.limit}</span>
                </p>
                <p className="font-montserrat text-white/30 text-[10px]">
                  artist profile{status.artists.limit === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && isExpired && (
        <div className="mb-6 rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] px-4 py-3">
          <p className="font-montserrat text-white text-xs">
            Your subscription {dateStr ? `expired on ${dateStr}` : "has expired"}. Choose a plan
            below to restore access.
          </p>
        </div>
      )}


      <PlanGrid onChanged={refreshBilling} />


      {isActive && status?.source !== "legacy" && (
        <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-center gap-3">
          {status?.track === "usd_card" && (
            <button
              onClick={handlePortal}
              disabled={openingPortal}
              className="font-nulshock uppercase text-[10px] tracking-widest rounded-full border border-white/20 px-5 py-2.5 text-white/70 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40 min-h-[44px]"
            >
              {openingPortal ? "Opening..." : "Manage Payment Method"}
            </button>
          )}

          {status?.cancel_at_period_end ? (
            <button
              onClick={handleResume}
              disabled={resuming}
              className="font-nulshock uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-5 py-2.5 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {resuming && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {resuming ? "Resuming..." : "Keep My Subscription"}
            </button>
          ) : (
            <button
              onClick={() => setConfirmCancelOpen(true)}
              disabled={cancelling}
              className="font-nulshock uppercase text-[10px] tracking-widest rounded-full border border-white/20 px-5 py-2.5 text-white/50 hover:text-[#C30100] hover:border-[#C30100]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {cancelling && (
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {cancelling ? "Cancelling..." : "Cancel Subscription"}
            </button>
          )}
        </div>
      )}

      {status?.cancel_at_period_end && (
        <p className="font-montserrat text-white/35 text-[11px] text-center mt-3">
          {status.end_date
            ? `Your plan ends on ${new Date(status.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Change your mind any time before then.`
            : "Change your mind any time before your plan ends."}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 mt-5">
        <span className="w-2 h-2 rounded-full bg-[#C30100]" />
        <p className="font-montserrat text-white/40 text-xs">
          Need a custom solution? Contact our sales team for enterprise options.
        </p>
      </div>

      <ConfirmDialog
        open={confirmCancelOpen}
        destructive
        busy={cancelling}
        title="Cancel your subscription?"
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep my plan"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancelOpen(false)}
        message={
          <>
            <p>
              You keep everything until{" "}
              <span className="text-white font-medium">
                {status?.end_date
                  ? new Date(status.end_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "the end of your current billing period"}
              </span>
              . Nothing is charged after that.
            </p>
            <p className="mt-2 text-white/40">
              {autoRenew
                ? "You can change your mind any time before then."
                : "Your releases stay live until then, and you can resubscribe whenever you like."}
            </p>
          </>
        }
      />
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "artist-profile", label: "Artist Profile" },
  { id: "ayo-ai", label: "Ayo AI Preferences" },
  { id: "notification", label: "Notification" },
  { id: "security", label: "Security" },
  { id: "subscription", label: "Subscription" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();


  const requestedTab = searchParams.get("tab");
  const initialTab: Tab = TABS.some((t) => t.id === requestedTab)
    ? (requestedTab as Tab)
    : "general";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const isArtistProfile = activeTab === "artist-profile";

  useEffect(() => {
    if (requestedTab && TABS.some((t) => t.id === requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab as Tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTab]);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/dashboard/settings?tab=${tab}`, { scroll: false });
  };

  return (
    <DashboardLayout
      pageTitle="Settings"
      customCta={
        isArtistProfile
          ? {
              label: "+ Create New Profile",
              onClick: () => setShowNewProfileModal(true),
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="font-montserrat text-white/50 text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>
        <div className="flex gap-1 border border-dashed border-[#C30100]/30 rounded-2xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={[
                "font-nulshock uppercase text-xs tracking-widest px-4 py-2.5 rounded-xl whitespace-nowrap transition-all min-h-[40px]",
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
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

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckSmallIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.17-1.17a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.92 15z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function UserGroupIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C30100"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white/30"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout pageTitle="Settings">
          <div className="flex justify-center py-20">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        </DashboardLayout>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SpotifyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white/30"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white/30"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
