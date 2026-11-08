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
      <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/[0.06] p-5 sm:p-6 flex items-center gap-4">
        <WhatsAppIcon size={36} />
        <div className="min-w-0">
          <p className="font-heading text-white uppercase text-sm tracking-wide">You&apos;re on the list</p>
          <p className="font-body text-white/50 text-xs sm:text-sm mt-1">
            We&apos;ll be in touch on WhatsApp. You&apos;ll be among the first to try it.
          </p>
        </div>
      </div>
    );
  }

  const several = (missing?.length ?? 0) > 1;

  return (
    <div className="relative rounded-2xl border border-[#25D366]/25 bg-gradient-to-br from-[#0B1A10] via-[#141110] to-[#180F0F] p-5 sm:p-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#25D366]/10 blur-3xl" />

      <button
        onClick={() => {
          snooze();
          setHidden(true);
          setJustSaved(false);
        }}
        className="absolute top-3 right-3 text-white/30 hover:text-white/70 text-[10px] font-heading uppercase tracking-widest px-2 py-1"
        aria-label="Remind me later"
      >
        Later
      </button>

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0">
          <WhatsAppIcon size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-[9px] uppercase tracking-widest text-black bg-[#25D366] rounded-full px-2 py-0.5">
              New
            </span>
            <p className="font-heading text-white uppercase text-sm tracking-wide">SongDis is coming to WhatsApp</p>
          </div>
          <p className="font-body text-white/60 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Get your release updates right in your chats, and soon, drop a new release just by sending it
            to us on WhatsApp. Add your number to be one of the first in.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {missing?.map((p) => (
              <ProfileRow
                key={p.id}
                profile={p}
                showName={several}
                onSaved={() => {
                  const rest = (missing ?? []).filter((m) => m.id !== p.id);
                  setMissing(rest);
                  setJustSaved(true);
                  if (rest.length === 0) setHidden(true);
                }}
              />
            ))}
          </div>

          <p className="font-body text-white/30 text-[11px] mt-3">
            By saving, you agree to get updates from SongDis on WhatsApp. You can opt out any time.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  profile,
  showName,
  onSaved,
}: {
  profile: WhatsAppProfile;
  showName: boolean;
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

  return (
    <div>
      {showName && (
        <p className="font-body text-white/70 text-xs mb-1.5">{profile.stage_name}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
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
          className="flex-1 min-w-0 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 font-body text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#25D366]/60"
        />
        <button
          onClick={save}
          disabled={saving || value.replace(/\D/g, "").length < 8}
          className="shrink-0 font-heading text-black uppercase text-[10px] tracking-widest rounded-full bg-[#25D366] hover:bg-[#1fb857] disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 min-h-[44px] transition-colors"
        >
          {saving ? "Saving…" : profile.suggested_number && value === profile.suggested_number ? "Yes, use this" : "Save"}
        </button>
      </div>
      {profile.suggested_number && value === profile.suggested_number && !error && (
        <p className="font-body text-white/35 text-[11px] mt-1.5">Is this your WhatsApp number? It&apos;s the phone on your profile.</p>
      )}
      {error && <p className="font-body text-[#ff6b6b] text-[11px] mt-1.5">{error}</p>}
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
