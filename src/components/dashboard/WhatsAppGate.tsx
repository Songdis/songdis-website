"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWhatsAppStatus, saveWhatsAppNumber, type WhatsAppProfile } from "@/lib/api/whatsapp";
import { removeToken } from "@/lib/api/auth";
import { clearUserCache } from "@/lib/hooks/useUser";

/**
 * Every artist profile needs a WhatsApp number (Nov 2026). Until each one has it, this
 * covers the whole dashboard on every page. There is deliberately no close or "later";
 * the only other way out is logging out.
 */
export default function WhatsAppGate() {
  const router = useRouter();
  const [missing, setMissing] = useState<WhatsAppProfile[]>([]);

  useEffect(() => {
    let alive = true;
    getWhatsAppStatus().then((res) => {
      if (!alive || res.error || !res.data) return;
      setMissing(res.data.profiles.filter((p) => !p.whatsapp_number));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (missing.length === 0) return null;

  const several = missing.length > 1;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-gate-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#25D366]/25 bg-[#0F1511] p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <WhatsAppIcon size={36} />

        <h2 id="whatsapp-gate-title" className="font-heading text-white uppercase text-lg tracking-wide mt-4">
          Add your WhatsApp
        </h2>
        <p className="font-body text-white/55 text-sm mt-1.5">
          SongDis is coming to WhatsApp: release updates in your chats, and uploads soon.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {missing.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              label={several ? p.stage_name : null}
              onSaved={() => setMissing((list) => list.filter((m) => m.id !== p.id))}
            />
          ))}
        </div>

        <p className="font-body text-white/30 text-[11px] mt-4">
          By saving you agree to WhatsApp updates from SongDis.
        </p>

        <button
          onClick={() => {
            removeToken();
            clearUserCache();
            router.push("/sign-in");
          }}
          className="mt-5 font-body text-white/35 hover:text-white/70 text-xs underline underline-offset-2"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function ProfileRow({
  profile,
  label,
  onSaved,
}: {
  profile: WhatsAppProfile;
  label: string | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(profile.suggested_number ?? "+");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await saveWhatsAppNumber(profile.id, value);
    setSaving(false);
    if (res.error) {
      setError(res.errors?.whatsapp_number?.[0] ?? res.error);
      return;
    }
    onSaved();
  };

  const isSuggestion = !!profile.suggested_number && value === profile.suggested_number;

  return (
    <div>
      {label && <p className="font-body text-white/70 text-xs mb-1.5">{label}</p>}
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        placeholder="+234 801 234 5678"
        aria-label={label ? `WhatsApp number for ${label}` : "WhatsApp number"}
        className="w-full rounded-full border border-white/[0.1] bg-black/30 px-5 py-3 font-body text-white text-base placeholder:text-white/25 focus:outline-none focus:border-[#25D366]/60"
      />
      {error && <p className="font-body text-[#ff6b6b] text-[11px] mt-1.5 pl-4">{error}</p>}
      <button
        onClick={save}
        disabled={saving || value.replace(/\D/g, "").length < 8}
        className="mt-2 w-full font-heading text-black uppercase text-xs tracking-widest rounded-full bg-[#25D366] hover:bg-[#1fb857] disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] transition-colors"
      >
        {saving ? "Saving…" : isSuggestion ? "Yes, this is my WhatsApp" : "Save"}
      </button>
    </div>
  );
}

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 000-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z" />
    </svg>
  );
}
