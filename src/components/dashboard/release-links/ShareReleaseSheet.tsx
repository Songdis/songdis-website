"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { siFacebook, siInstagram, siTelegram, siTiktok, siWhatsapp, siX } from "simple-icons";
import { request } from "@/lib/api/core";

export interface ShareableRelease {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  isPresave: boolean;
}

type Format = "square" | "story";
type Platform = "whatsapp" | "whatsapp_status" | "instagram_story" | "tiktok" | "x" | "facebook" | "telegram";

interface Target {
  key: Platform;
  label: string;
  /** Status, Instagram and TikTok get the 9:16 story; chats and feeds get the square card. */
  format: Format;
  icon: { path: string };
  /** Circle style: brand fill, or a ring for "Status" so it reads differently from the chat. */
  bg: string;
  ring?: string;
  /** Where to go when the device can't share an image (most desktops). */
  fallback?: (url: string, caption: string, title: string) => string;
}

const enc = encodeURIComponent;

const TARGETS: Target[] = [
  {
    key: "whatsapp", label: "WhatsApp", format: "square", icon: siWhatsapp, bg: `#${siWhatsapp.hex}`,
    fallback: (_u, caption) => `https://wa.me/?text=${enc(caption)}`,
  },
  { key: "whatsapp_status", label: "WhatsApp Status", format: "story", icon: siWhatsapp, bg: "transparent", ring: `#${siWhatsapp.hex}` },
  {
    key: "instagram_story", label: "Instagram Story", format: "story", icon: siInstagram,
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
  },
  { key: "tiktok", label: "TikTok", format: "story", icon: siTiktok, bg: "#000000", ring: "rgba(255,255,255,0.18)" },
  {
    key: "x", label: "X", format: "square", icon: siX, bg: "#000000", ring: "rgba(255,255,255,0.18)",
    fallback: (url, _c, title) => `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
  },
  {
    key: "facebook", label: "Facebook", format: "square", icon: siFacebook, bg: `#${siFacebook.hex}`,
    fallback: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    key: "telegram", label: "Telegram", format: "square", icon: siTelegram, bg: `#${siTelegram.hex}`,
    fallback: (url, _c, title) => `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
  },
];

function fullUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Added behind the scenes, never shown in the sheet. Pre-save copy until release day. */
function captionFor(r: ShareableRelease) {
  const url = fullUrl(r.url);
  return r.isPresave
    ? `"${r.title}" by ${r.artist} is coming soon. Pre-save it now so it's in your library the moment it drops 👇\n${url}`
    : `"${r.title}" by ${r.artist} is out now 🔥 Listen here 👇\n${url}`;
}

function track(id: string, platform: Platform | "copy" | "native") {
  void request(`/release-links/${id}/share`, { method: "POST", body: JSON.stringify({ platform }) }, true).catch(() => undefined);
}

function haptic() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* not supported */
  }
}

/* ── The card image ─────────────────────────────────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fontFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim();
  return v || "Montserrat, Helvetica, Arial, sans-serif";
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * The Blur card: the artwork centred on a blurred, darkened copy of itself. Works with any cover.
 * The blur is a tiny downscale drawn back up, because canvas `filter` is missing on iOS Safari.
 */
async function renderCard(r: ShareableRelease, format: Format): Promise<File | null> {
  if (!r.cover) return null;
  try {
    await document.fonts?.ready;
    const art = await loadImage(r.cover);
    const W = 1080;
    const H = format === "story" ? 1920 : 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Blurred backdrop, cover-fitted.
    const tiny = document.createElement("canvas");
    tiny.width = 18;
    tiny.height = Math.round(18 * (H / W));
    const tctx = tiny.getContext("2d");
    if (tctx) {
      const s = Math.max(tiny.width / art.width, tiny.height / art.height);
      tctx.drawImage(art, (tiny.width - art.width * s) / 2, (tiny.height - art.height * s) / 2, art.width * s, art.height * s);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tiny, 0, 0, W, H);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(10,4,4,0.35)");
    shade.addColorStop(1, "rgba(10,4,4,0.72)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);

    const family = fontFamily();
    const story = format === "story";
    const size = story ? 820 : 600;
    const x = (W - size) / 2;
    const y = story ? 360 : 96;

    // Status line above the artwork on the story.
    if (story) {
      const label = r.isPresave ? "PRE-SAVE NOW" : "OUT NOW";
      ctx.font = `700 34px ${family}`;
      const w = ctx.measureText(label).width + 64;
      ctx.fillStyle = "#C30100";
      roundRect(ctx, (W - w) / 2, 236, w, 68, 34);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, W / 2, 271);
    }

    // Artwork, rounded, lifted off the backdrop.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    roundRect(ctx, x, y, size, size, 28);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, size, size, 28);
    ctx.clip();
    const s = Math.max(size / art.width, size / art.height);
    ctx.drawImage(art, x + (size - art.width * s) / 2, y + (size - art.height * s) / 2, art.width * s, art.height * s);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const below = y + size;
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${story ? 76 : 60}px ${family}`;
    ctx.fillText(fitText(ctx, r.title, W - 140), W / 2, below + (story ? 140 : 100));
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = `500 ${story ? 44 : 36}px ${family}`;
    ctx.fillText(fitText(ctx, r.artist, W - 140), W / 2, below + (story ? 212 : 156));

    if (story) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `600 36px ${family}`;
      ctx.fillText(fitText(ctx, shortUrl(r.url), W - 160), W / 2, below + 330);
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `700 ${story ? 32 : 28}px ${family}`;
    ctx.fillText("Distributed by SongDis", W / 2, H - (story ? 120 : 56));

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    if (!blob) return null;
    const name = `${r.title.replace(/[^\w\- ]+/g, "").trim() || "release"}-${format}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

function download(file: File) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ── The sheet ──────────────────────────────────────────────────────── */

export default function ShareReleaseSheet({ release, onClose }: { release: ShareableRelease; onClose: () => void }) {
  const url = fullUrl(release.url);
  const caption = useMemo(() => captionFor(release), [release]);
  const images = useRef<Partial<Record<Format, Promise<File | null>>>>({});
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Draw both images as the sheet opens, so a tap can hand them to the share sheet at once:
  // phones only allow sharing straight after a tap, not after a slow image load.
  const image = (f: Format) => (images.current[f] ??= renderCard(release, f));
  useEffect(() => {
    void image("square");
    void image("story");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [release.id]);

  // The floating Ayo button sits over the sheet's Share button on phones: hide it while open.
  useEffect(() => {
    document.body.dataset.shareSheet = "open";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset.shareSheet;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 3200);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(url).catch(() => undefined);
    haptic();
    setCopied(true);
    track(release.id, "copy");
    setTimeout(() => setCopied(false), 1800);
  };

  /** Image + caption through the phone's share sheet; returns false where that isn't possible. */
  const nativeShare = async (format: Format): Promise<boolean> => {
    const file = await image(format);
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        return true;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return true; // they closed the share sheet
    }
    return false;
  };

  const shareTo = async (t: Target) => {
    track(release.id, t.key);
    setBusy(t.key);
    const shared = await nativeShare(t.format);
    setBusy(null);
    if (shared) return;

    if (t.fallback) {
      window.open(t.fallback(url, caption, release.isPresave ? `Pre-save "${release.title}" by ${release.artist}` : `"${release.title}" by ${release.artist} is out now`), "_blank", "noopener");
      return;
    }

    // Stories can only be posted from the app itself: hand over the image and the caption.
    const file = await image(t.format);
    if (file) download(file);
    navigator.clipboard?.writeText(caption).catch(() => undefined);
    flash(`Image saved and caption copied. Open ${t.label.replace(" Story", "").replace(" Status", "")} and post it.`);
  };

  const shareNative = async () => {
    track(release.id, "native");
    setBusy("native");
    const shared = await nativeShare("square");
    if (!shared && navigator.share) {
      try {
        await navigator.share({ title: release.title, text: caption, url });
        setBusy(null);
        return;
      } catch {
        /* closed */
      }
    }
    setBusy(null);
    if (!shared && !navigator.share) {
      navigator.clipboard?.writeText(caption).catch(() => undefined);
      flash("Caption and link copied. Paste it anywhere.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={onClose} />

      <div
        role="dialog"
        aria-label="Share your release"
        className="relative z-10 w-full sm:max-w-[440px] max-h-[94dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[#170A09] border border-white/[0.07] px-5 sm:px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto h-1.5 w-11 rounded-full bg-white/15 sm:hidden" />

        <div className="flex items-start justify-between gap-3 mt-4">
          <div className="min-w-0">
            <p className="font-body text-white text-xl font-semibold">Share your release</p>
            <p className="font-body text-white/45 text-sm mt-0.5 truncate">
              {release.isPresave ? "Pre-save is live" : "Out now"} · {release.title}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 w-10 h-10 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-white/80 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* The Blur card, as fans will see it */}
        <div className="relative mt-5 mx-auto w-full max-w-[340px] rounded-[22px] overflow-hidden border border-white/[0.06]">
          {release.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={release.cover} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
          <div className="relative px-8 pt-8 pb-6 text-center">
            {release.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={release.cover} alt={release.title} className="mx-auto w-full max-w-[230px] aspect-square object-cover rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.55)]" />
            ) : (
              <div className="mx-auto w-full max-w-[230px] aspect-square rounded-xl bg-white/[0.06]" />
            )}
            <p className="font-body text-white text-2xl font-bold mt-5 truncate">{release.title}</p>
            <p className="font-body text-white/80 text-sm mt-1 truncate">{release.artist}</p>
            <p className="font-body text-white/90 text-xs font-semibold mt-4">Distributed by SongDis</p>
          </div>
        </div>

        {/* Link + copy */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] pl-4 pr-1.5 py-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/40 shrink-0">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <p className="flex-1 min-w-0 font-body text-white/75 text-sm truncate">{shortUrl(release.url)}</p>
          <button
            onClick={copyLink}
            className={`shrink-0 font-body text-sm font-semibold rounded-xl px-4 py-2.5 min-w-[88px] transition-colors ${copied ? "bg-[#1f3b26] text-[#5BE38A]" : "bg-white/[0.08] text-white hover:bg-white/[0.14]"}`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        {/* Share to */}
        <p className="font-body text-white/45 text-xs font-semibold uppercase tracking-[0.12em] mt-6">Share to</p>
        <div className="-mx-5 sm:-mx-6 mt-3 px-5 sm:px-6 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TARGETS.map((t) => (
            <button key={t.key} onClick={() => shareTo(t)} disabled={busy !== null} className="shrink-0 w-[70px] flex flex-col items-center gap-2 disabled:opacity-60">
              <span
                className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95"
                style={{ background: t.bg, boxShadow: t.ring ? `inset 0 0 0 2px ${t.ring}` : undefined }}
              >
                {busy === t.key ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={t.key === "whatsapp_status" ? `#${siWhatsapp.hex}` : "#ffffff"} aria-hidden>
                    <path d={t.icon.path} />
                  </svg>
                )}
              </span>
              <span className="font-body text-white/70 text-[11px] leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>

        <p className={`font-body text-xs text-center mt-3 min-h-[16px] transition-opacity ${note ? "text-white/70 opacity-100" : "opacity-0"}`}>{note ?? "."}</p>

        <button
          onClick={shareNative}
          disabled={busy !== null}
          className="w-full mt-2 flex items-center justify-center gap-2.5 font-body text-white text-base font-semibold bg-[#C30100] hover:bg-[#a80000] rounded-2xl py-4 min-h-[56px] transition-colors disabled:opacity-60"
        >
          {busy === "native" ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v13" />
            </svg>
          )}
          Share
        </button>
      </div>
    </div>
  );
}
