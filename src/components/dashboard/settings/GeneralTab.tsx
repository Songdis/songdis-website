"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { request } from "@/lib/api/core";
import { useToast } from "@/components/ui/Toast";

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
        className={[
          "w-full bg-[#0E0808] border rounded-lg px-4 py-3 font-montserrat text-white text-sm placeholder:text-white/25 outline-none transition-colors",
          disabled
            ? "border-white/[0.06] text-white/50 cursor-not-allowed"
            : "border-white/10 focus:border-[#C30100]",
        ].join(" ")}
        style={icon ? { paddingRight: "2.5rem" } : {}}
      />
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</div>
      )}
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

export function GeneralTab() {
  // Read-only fields (from API — user can't change these directly here)
  const [firstName, setFirstName]   = useState("");
  const [lastName,  setLastName]    = useState("");
  const [email,     setEmail]       = useState("");
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);

  // Editable fields
  const [accountType, setAccountType] = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("");
  const [state,       setState]       = useState("");
  const [zip,         setZip]         = useState("");

  // Avatar
  const [avatarUrl,      setAvatarUrl]      = useState("");
  const [avatarPreview,  setAvatarPreview]  = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();


  console.log(avatarUrl, 'avatarPreview');

  // Load user on mount
  useEffect(() => {
    request<Record<string, unknown>>("/user", { method: "GET" }, true).then((res) => {
      if (!res.error && res.data) {
        const raw = res.data as Record<string, unknown>;
        const user = (raw.user ?? raw) as Record<string, unknown>;
        setFirstName((user.first_name   ?? "") as string);
        setLastName( (user.last_name    ?? "") as string);
        setEmail(    (user.email        ?? "") as string);
        setAccountType((user.account_type ?? "") as string);
        setAddress(  (user.address      ?? "") as string);
        setCity(     (user.city         ?? "") as string);
        setState(    (user.state        ?? "") as string);
        setZip(      (user.zip_code     ?? "") as string);
        setAvatarUrl((user.avatar_url   ?? "") as string);
      }
    });
  }, []);

  // Handle photo selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    // Upload to S3 via /upload/artwork
    setIsUploadingAvatar(true);
    const toastId = toastLoading("Uploading photo...");
    try {
      const formData = new FormData();
      formData.append("artwork", file);
      formData.append("generate_sizes", "false");

      const token = typeof window !== "undefined" ? localStorage.getItem("songdis_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "https://api.songdis.com"}/upload/artwork`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const json = await res.json();
      dismiss(toastId);

      if (!res.ok) {
        toastError("Photo upload failed", json?.message ?? "Please try again.");
        setAvatarPreview(""); // revert preview
      } else {
        const d = json?.data ?? json;
        const url = (d?.file_url ?? d?.url ?? "") as string;
        setAvatarUrl(url);
        success("Photo uploaded!", "Save changes to apply it.");
      }
    } catch {
      dismiss(toastId);
      toastError("Photo upload failed", "Network error.");
      setAvatarPreview("");
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await request<Record<string, unknown>>(
      "/update-profile",
      {
        method: "PUT",
        body: JSON.stringify({
          first_name: firstName,
          last_name:  lastName,
          address,
          city,
          state,
          zip_code:   zip,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        }),
      },
      true
    );
    if (res.error) {
      toastError("Update failed", res.error);
    } else {
      success("Profile updated!", "Your changes have been saved.");
      setIsEditingIdentity(false);
      // Sync avatar_url from response if returned
      const updated = (res.data as Record<string, unknown>)?.user as Record<string, unknown> | undefined;
      if (updated?.avatar_url) {
        setAvatarUrl(updated.avatar_url as string);
        setAvatarPreview(""); // clear local preview — now using real URL
      }
    }
    setIsSaving(false);
  };

  const displayAvatar = avatarPreview || avatarUrl || "/images/avatar-artiste.svg";

  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-6">
      {/* Photo */}
      <div className="flex items-center gap-5 mb-7">
        <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10">
          <Image src={displayAvatar} alt="avatar" fill className="object-cover object-top" unoptimized />
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <svg className="animate-spin text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="flex items-center gap-2 font-montserrat text-white text-sm border border-white/20 rounded-full px-4 py-2 hover:border-white/40 transition-colors disabled:opacity-40"
          >
            <CameraIcon />
            {isUploadingAvatar ? "Uploading..." : "Change Photo"}
          </button>
          <p className="font-montserrat text-white/30 text-xs mt-2">JPG or PNG. 5MB max.</p>
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Name + email — read-only by default, unlock with edit */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-montserrat text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Account Identity</p>
            <p className="font-montserrat text-white text-sm">{[firstName, lastName].filter(Boolean).join(" ") || "—"}</p>
            <p className="font-montserrat text-white/40 text-xs mt-0.5">{email || "—"}</p>
          </div>
          <button
            onClick={() => setIsEditingIdentity(!isEditingIdentity)}
            className="flex items-center gap-1.5 font-montserrat text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white shrink-0"
          >
            <PencilIcon />
            {isEditingIdentity ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Show name fields only when editing — email is never editable */}
        {isEditingIdentity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <Input value={firstName} onChange={setFirstName} placeholder="Enter first name" />
            </Field>
            <Field label="Last Name">
              <Input value={lastName} onChange={setLastName} placeholder="Enter last name" />
            </Field>
          </div>
        )}

        {/* Account type */}
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

        <Field label="Address">
          <Input value={address} onChange={setAddress} placeholder="Enter your address" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="font-nulshock text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-8 py-3.5 transition-all disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Update Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}