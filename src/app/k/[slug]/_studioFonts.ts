import { Figtree, Syne } from "next/font/google";

/** The "Studio" look: an expressive gallery display face over a friendly, legible body face. */
export const studioDisplay = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-studio-display",
  display: "swap",
});

export const studioBody = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-studio-body",
  display: "swap",
});
