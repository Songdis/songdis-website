import type { Metadata } from "next";
import { Big_Shoulders, Hanken_Grotesk, Instrument_Serif, Inter_Tight } from "next/font/google";
import { EPK_ORIGIN } from "@/lib/epk";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-epk-serif",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-epk-sans",
  display: "swap",
});

// The redesign: a gig-poster display face over a plain, sturdy grotesk.
const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-epk-display",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-epk-body",
  display: "swap",
});

const title = "Free EPK Maker for Musicians | Electronic Press Kit – getepk";
const description =
  "Make a free electronic press kit (EPK) in 60 seconds. Search your artist name and get your music, photos, bio and booking button on one link.";

export const metadata: Metadata = {
  metadataBase: new URL(EPK_ORIGIN),
  title: { default: title, template: "%s · getepk" },
  description,
  // The SongDis keywords were inherited from the root layout; search engines ignore the tag.
  keywords: null,
  openGraph: {
    type: "website",
    siteName: "getepk",
    title,
    description,
    url: EPK_ORIGIN,
    images: [{ url: "/epk/og.jpg", width: 1200, height: 630, alt: "getepk: your EPK in 60 seconds. Free electronic press kits for musicians." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/epk/og.jpg"],
  },
};

/** getepk's own look: ink and paper, a serif for headlines. Applies to /epk/* only. */
export default function EpkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable} ${display.variable} ${body.variable} epk min-h-screen`} style={{ fontFamily: "var(--font-epk-body)" }}>
      {children}
    </div>
  );
}
