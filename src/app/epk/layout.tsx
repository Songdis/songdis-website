import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
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

const description =
  "Your bio, music, photos, press and a booking button on one link. Make your electronic press kit in minutes. Free.";

export const metadata: Metadata = {
  metadataBase: new URL(EPK_ORIGIN),
  title: { default: "getepk — the press kit that gets opened", template: "%s · getepk" },
  description,
  openGraph: {
    type: "website",
    siteName: "getepk",
    title: "getepk — the press kit that gets opened",
    description,
    url: EPK_ORIGIN,
  },
  twitter: { card: "summary_large_image", title: "getepk", description },
};

/** getepk's own look: ink and paper, a serif for headlines. Applies to /epk/* only. */
export default function EpkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable} epk min-h-screen`} style={{ fontFamily: "var(--font-epk-sans)" }}>
      {children}
    </div>
  );
}
