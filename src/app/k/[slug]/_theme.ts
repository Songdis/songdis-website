import type { CSSProperties } from "react";
import type {
  PressKitHeadlineFont,
  PressKitTheme,
} from "@/lib/api/press-kit-public";

export interface PressKitPalette {
  name: string;
  description: string;
  accent: string;
  accentDeep: string;
  bg: string;
  bgDeep: string;
  tint: string;
  gold: string;
  text: string;
  textSoft: string;
  muted: string;
  muted2: string;
  surface: string;
  line: string;
}

export const PRESS_KIT_THEMES: Record<PressKitTheme, PressKitPalette> = {
  blaze: {
    name: "Blaze",
    description: "Songdis default",
    accent: "#E5342F",
    accentDeep: "#C30100",
    bg: "#170F0F",
    bgDeep: "#0E0708",
    tint: "#2A1517",
    gold: "#F5A623",
    text: "#F6F1F1",
    textSoft: "#D6CBCC",
    muted: "#A6989A",
    muted2: "#7C7072",
    surface: "rgba(255,255,255,0.032)",
    line: "rgba(255,255,255,0.10)",
  },
  midnight: {
    name: "Midnight",
    description: "Cool & clean",
    accent: "#5C9DFF",
    accentDeep: "#1D4ED8",
    bg: "#0B1020",
    bgDeep: "#060A14",
    tint: "#141F3D",
    gold: "#7DD3FC",
    text: "#F2F5FB",
    textSoft: "#C7D0E2",
    muted: "#94A0BC",
    muted2: "#6C7794",
    surface: "rgba(255,255,255,0.035)",
    line: "rgba(255,255,255,0.11)",
  },
  violet: {
    name: "Violet",
    description: "Moody club",
    accent: "#A98BFA",
    accentDeep: "#6023D4",
    bg: "#130D1E",
    bgDeep: "#0A0714",
    tint: "#241640",
    gold: "#F0ABFC",
    text: "#F4F0FA",
    textSoft: "#CFC6E0",
    muted: "#A197B8",
    muted2: "#786E8E",
    surface: "rgba(255,255,255,0.035)",
    line: "rgba(255,255,255,0.11)",
  },
  emerald: {
    name: "Emerald",
    description: "Fresh & natural",
    accent: "#2FD69B",
    accentDeep: "#047857",
    bg: "#08150F",
    bgDeep: "#040D09",
    tint: "#0F2B1F",
    gold: "#FCD34D",
    text: "#EFF7F2",
    textSoft: "#C3D3CA",
    muted: "#92A89C",
    muted2: "#6B8076",
    surface: "rgba(255,255,255,0.032)",
    line: "rgba(255,255,255,0.10)",
  },
  gold: {
    name: "Gold",
    description: "Luxe & warm",
    accent: "#F5A623",
    accentDeep: "#8A5405",
    bg: "#161008",
    bgDeep: "#0D0904",
    tint: "#2C1F0B",
    gold: "#FFE08A",
    text: "#F8F2E6",
    textSoft: "#DCD0B8",
    muted: "#B0A183",
    muted2: "#7E7154",
    surface: "rgba(255,255,255,0.034)",
    line: "rgba(255,255,255,0.11)",
  },
  mono: {
    name: "Mono",
    description: "Minimal black",
    accent: "#E8E6E6",
    accentDeep: "#4A4A4A",
    bg: "#0E0E0E",
    bgDeep: "#060606",
    tint: "#1C1C1C",
    gold: "#BDBDBD",
    text: "#F4F4F4",
    textSoft: "#CFCFCF",
    muted: "#9E9E9E",
    muted2: "#767676",
    surface: "rgba(255,255,255,0.04)",
    line: "rgba(255,255,255,0.12)",
  },
};


const HEADLINE_STACKS: Record<PressKitHeadlineFont, string> = {
  heading: '"Nulshock", "Montserrat", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  body: '"Montserrat", sans-serif',
};

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}


export function pressKitThemeVars(
  themeKey: PressKitTheme,
  headline: PressKitHeadlineFont
): CSSProperties {
  const t = PRESS_KIT_THEMES[themeKey] ?? PRESS_KIT_THEMES.blaze;
  const vars: Record<string, string> = {
    "--pk-bg": t.bg,
    "--pk-bg-deep": t.bgDeep,
    "--pk-tint": t.tint,
    "--pk-accent": t.accent,
    "--pk-accent-deep": t.accentDeep,
    "--pk-glow": hexToRgba(t.accent, 0.3),
    "--pk-gold": t.gold,
    "--pk-text": t.text,
    "--pk-text-soft": t.textSoft,
    "--pk-muted": t.muted,
    "--pk-muted-2": t.muted2,
    "--pk-surface": t.surface,
    "--pk-line": t.line,
    "--pk-headline": HEADLINE_STACKS[headline] ?? HEADLINE_STACKS.heading,
  };
  return vars as CSSProperties;
}

export const headlineStyle: CSSProperties = {
  fontFamily: "var(--pk-headline)",
};
