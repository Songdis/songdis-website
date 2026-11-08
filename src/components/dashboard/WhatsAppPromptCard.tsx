"use client";

import { useEffect, useState } from "react";
import { getWhatsAppStatus, saveWhatsAppNumber, type WhatsAppProfile } from "@/lib/api/whatsapp";

/**
 * Dashboard prompt for artist profiles with no WhatsApp number. Shows only while at least
 * one profile is missing one, can be put off for a week, and disappears once every profile
 * has a number.
 */

const SNOOZE_KEY = "songdis:whatsapp-prompt-snoozed-until";
const SNOOZE_DAYS = 7;

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
  } catch {
    /* private mode — the prompt simply comes back next visit */
  }
}

export default function WhatsAppPromptCard() {
  const [missing, setMissing] = useState<WhatsAppProfile[] | null>(null);
  const [hidden, setHidden] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isSnoozed()) return;

    getWhatsAppStatus().then((res) => {
      if (res.error || !res.data) return;
      const list = res.data.profiles.filter((p) => !p.whatsapp_number);
      setMissing(list);
      setHidden(list.length === 0);
    });
  }, []);

  if (hidden && !justSaved) return null;

  if (justSaved && (missing?.length ?? 0) === 0) {
    return (
      <div className="rounded-2xl border border-[#25D366]/25 bg-[#25D366]/[0.05] px-4 py-3 flex items-center gap-3">
        <WhatsAppIcon size={20} />
        <p className="font-body text-white/80 text-sm">Done. We&apos;ll be in touch on WhatsApp.</p>
      </div>
    );
  }

  const several = (missing?.length ?? 0) > 1;

  return (
    <div className="relative rounded-2xl border border-[#25D366]/20 bg-[#0F1511] p-4 sm:p-5">
      <button
        onClick={() => {
          snooze();
          setHidden(true);
          setJustSaved(false);
        }}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70"
        aria-label="Remind me later"
        title="Later"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 pr-6">
        <div className="flex items-center gap-3 min-w-0 lg:flex-1">
          <WhatsAppIcon size={28} />
          <div className="min-w-0">
            <p className="font-heading text-white uppercase text-sm tracking-wide">
              Get SongDis on WhatsApp
              <span className="ml-2 align-middle font-heading text-[8px] tracking-widest text-black bg-[#25D366] rounded-full px-1.5 py-0.5">NEW</span>
            </p>
            <p className="font-body text-white/50 text-xs mt-0.5">Release updates in your chats. Uploads coming soon.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-[420px] shrink-0">
          {missing?.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              label={several ? p.stage_name : null}
              onSaved={() => {
                const rest = (missing ?? []).filter((m) => m.id !== p.id);
                setMissing(rest);
                setJustSaved(true);
                if (rest.length === 0) setHidden(true);
              }}
            />
          ))}
          <p className="font-body text-white/25 text-[10px]">By saving you agree to WhatsApp updates from SongDis.</p>
        </div>
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
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 flex items-center rounded-full border border-white/[0.1] bg-black/30 focus-within:border-[#25D366]/60">
          {label && (
            <span className="pl-4 pr-1 font-body text-white/40 text-xs truncate max-w-[40%]">{label}</span>
          )}
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
            className={`flex-1 min-w-0 bg-transparent ${label ? "pl-2" : "pl-4"} pr-4 py-2.5 font-body text-white text-sm placeholder:text-white/25 focus:outline-none`}
          />
        </div>
        <button
          onClick={save}
          disabled={saving || value.replace(/\D/g, "").length < 8}
          className="shrink-0 font-heading text-black uppercase text-[10px] tracking-widest rounded-full bg-[#25D366] hover:bg-[#1fb857] disabled:opacity-40 disabled:cursor-not-allowed px-5 min-h-[44px] transition-colors"
        >
          {saving ? "Saving…" : isSuggestion ? "Use this" : "Save"}
        </button>
      </div>
      {error && <p className="font-body text-[#ff6b6b] text-[11px] mt-1.5 pl-4">{error}</p>}
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
