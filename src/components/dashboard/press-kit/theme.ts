/**
 * components/dashboard/press-kit/theme.ts
 *
 * The six page themes, the three headline styles, and the section catalogue.
 *
 * ── Two colour rules this file exists to keep straight ──────────────────────
 *
 * 1. The THEME palettes below belong to the ARTIST'S PUBLIC PAGE. They are applied as
 *    CSS custom properties on the preview wrapper and nowhere else, so picking
 *    "Emerald" repaints the preview and leaves the dashboard chrome alone.
 *
 * 2. The EDITOR chrome is Songdis. Brand red `#C30100` measures 2.98:1 on the dark
 *    dashboard surface and fails contrast for text and thin marks, so it is used for
 *    large fills, borders and glows only — `ACCENT_TEXT` (#E5342F) is what text, icons
 *    and small marks use. Do not swap one for the other to "match the brand".
 */

import type { HeadlineFont, PressKitTheme, SectionKey } from "@/lib/api/press-kit";

/* ─── Editor chrome ───────────────────────────────────────────── */

/** Large fills, borders, glows. Never text, never a thin mark. */
export const BRAND_FILL = "#C30100";
/** Text, icons, small marks — the stepped red that clears 3:1 on the dark surface. */
export const ACCENT_TEXT = "#E5342F";

export const EDITOR_SURFACE = "#180F0F";
export const EDITOR_PAGE = "#0E0808";

/* ─── Page themes ─────────────────────────────────────────────── */

export interface PageTheme {
  key: PressKitTheme;
  name: string;
  description: string;
  /** Primary accent — buttons, active marks. */
  accent: string;
  /** The darker half of the accent gradient. */
  accentDeep: string;
  bg: string;
  bgDeep: string;
  tint: string;
  /** The warm secondary the mock uses for the spotlight ring and the address line. */
  gold: string;
}

/** Exactly the mock's THEMES array, in the mock's order. */
export const PAGE_THEMES: PageTheme[] = [
  {
    key: "blaze",
    name: "Blaze",
    description: "Songdis default",
    accent: "#e0263a",
    accentDeep: "#a4121f",
    bg: "#170d0e",
    bgDeep: "#0e0708",
    tint: "#2a1517",
    gold: "#f5a623",
  },
  {
    key: "midnight",
    name: "Midnight",
    description: "Cool & clean",
    accent: "#3b82f6",
    accentDeep: "#1d4ed8",
    bg: "#0b1020",
    bgDeep: "#060a14",
    tint: "#141f3d",
    gold: "#7dd3fc",
  },
  {
    key: "violet",
    name: "Violet",
    description: "Moody club",
    accent: "#8b5cf6",
    accentDeep: "#6023d4",
    bg: "#130d1e",
    bgDeep: "#0a0714",
    tint: "#241640",
    gold: "#f0abfc",
  },
  {
    key: "emerald",
    name: "Emerald",
    description: "Fresh & natural",
    accent: "#10b981",
    accentDeep: "#047857",
    bg: "#08150f",
    bgDeep: "#040d09",
    tint: "#0f2b1f",
    gold: "#fcd34d",
  },
  {
    key: "gold",
    name: "Gold",
    description: "Luxe & warm",
    accent: "#f5a623",
    accentDeep: "#c07708",
    bg: "#161008",
    bgDeep: "#0d0904",
    tint: "#2c1f0b",
    gold: "#ffe08a",
  },
  {
    key: "mono",
    name: "Mono",
    description: "Minimal black",
    accent: "#e8e6e6",
    accentDeep: "#a3a0a0",
    bg: "#0e0e0e",
    bgDeep: "#060606",
    tint: "#1c1c1c",
    gold: "#bdbdbd",
  },
];

export function pageTheme(key: PressKitTheme): PageTheme {
  return PAGE_THEMES.find((t) => t.key === key) ?? PAGE_THEMES[0];
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The custom properties the preview wrapper carries. Same variable names as the mock,
 * so the public page and this preview can be reasoned about together.
 */
export function themeVars(key: PressKitTheme): React.CSSProperties {
  const t = pageTheme(key);
  return {
    "--pk-bg": t.bg,
    "--pk-bg-deep": t.bgDeep,
    "--pk-tint": t.tint,
    "--pk-accent": t.accent,
    "--pk-accent-deep": t.accentDeep,
    "--pk-gold": t.gold,
    "--pk-glow": rgba(t.accent, 0.35),
    "--pk-surface": "rgba(255,255,255,0.028)",
    "--pk-line": "rgba(255,255,255,0.09)",
    "--pk-text": "#f6f1f1",
    "--pk-muted": "#9c8e8f",
    "--pk-muted-2": "#6d6264",
  } as React.CSSProperties;
}

/* ─── Headline style ──────────────────────────────────────────── */

export interface HeadlineOption {
  key: HeadlineFont;
  label: string;
  /** How the swatch renders itself in the picker. */
  preview: React.CSSProperties;
}

/**
 * Three options, mapped onto Songdis tokens rather than the mock's Google fonts.
 *
 * `heading` is the `font-heading` utility (Nulshock). `body` is `font-body`
 * (Montserrat). `serif` has no Songdis token, so it names a system serif stack —
 * there is no web font to load and no `font-display` utility to reach for (writing
 * `className="font-display"` does nothing at all in this repo).
 */
export const HEADLINE_OPTIONS: HeadlineOption[] = [
  {
    key: "heading",
    label: "Bold",
    preview: { fontFamily: "Nulshock, sans-serif", textTransform: "uppercase" },
  },
  {
    key: "serif",
    label: "Serif",
    preview: { fontFamily: "Georgia, 'Times New Roman', serif" },
  },
  {
    key: "body",
    label: "Clean",
    preview: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
  },
];

export function headlineStyle(font: HeadlineFont): React.CSSProperties {
  const option = HEADLINE_OPTIONS.find((o) => o.key === font) ?? HEADLINE_OPTIONS[0];
  return option.preview;
}

/* ─── Sections ────────────────────────────────────────────────── */

export interface SectionMeta {
  key: SectionKey;
  label: string;
  /** What the artist will see in that block on the public page. */
  hint: string;
  /**
   * False for the sections whose feature is out of scope this phase (PDF+ZIP
   * generation, email capture). They still occupy a slot in `section_order` — the
   * column enumerates them — so they are shown, reorderable, and labelled honestly
   * instead of quietly dropped, which would corrupt the order the API round-trips.
   */
  live: boolean;
}

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  glance: {
    key: "glance",
    label: "At a glance",
    hint: "Genre, where you're based, who you sound like.",
    live: true,
  },
  bio: { key: "bio", label: "Bio", hint: "The paragraph a journalist copies.", live: true },
  listen: {
    key: "listen",
    label: "Listen",
    hint: "Your live releases. Pulled automatically — nothing to edit here.",
    live: true,
  },
  press: {
    key: "press",
    label: "Press & accolades",
    hint: "Quotes and playlist placements.",
    live: true,
  },
  photos: {
    key: "photos",
    label: "Press photos",
    hint: "Hi-res shots a blog can use.",
    live: true,
  },
  live: {
    key: "live",
    label: "Live & spotlights",
    hint: "Shows, festivals, milestones.",
    live: true,
  },
  contact: {
    key: "contact",
    label: "Contact & booking",
    hint: "Where bookings, management and press should write.",
    live: true,
  },
  kit: {
    key: "kit",
    label: "Full press kit download",
    hint: "PDF + ZIP generation isn't built yet, so this won't appear on your page.",
    live: false,
  },
  join: {
    key: "join",
    label: "Stay close",
    hint: "Email capture isn't built yet, so this won't appear on your page.",
    live: false,
  },
};

export function sectionMeta(key: SectionKey): SectionMeta {
  return SECTION_META[key];
}
