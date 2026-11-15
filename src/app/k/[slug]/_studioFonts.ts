import localFont from "next/font/local";

/** The press kit look: an expressive gallery display face over a friendly body face. Bundled, not fetched. */
export const studioDisplay = localFont({
  src: "../../../fonts/syne.woff2",
  weight: "600 800",
  variable: "--font-studio-display",
  display: "swap",
});

export const studioBody = localFont({
  src: "../../../fonts/figtree.woff2",
  weight: "400 700",
  variable: "--font-studio-body",
  display: "swap",
});
