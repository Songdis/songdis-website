import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Montserrat — loaded via next/font for zero-CLS, automatic subsetting,
 * self-hosted from Google Fonts infrastructure.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Songdis — The Operating System for Artists & Labels",
  description:
    "Upload your music on Spotify, Apple Music & more. Keep 100% ownership, access pro tools, and earn in any currency.",
  keywords: [
    "music distribution",
    "artists",
    "labels",
    "spotify",
    "apple music",
    "royalties",
    "songdis",
  ],
  openGraph: {
    title: "Songdis — The Operating System for Artists & Labels",
    description:
      "Upload your music on Spotify, Apple Music & more. Keep 100% ownership.",
    type: "website",
    siteName: "Songdis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Songdis — The Operating System for Artists & Labels",
    description:
      "Upload your music on Spotify, Apple Music & more. Keep 100% ownership.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#140C0C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        <link
          rel="preload"
          href="/fonts/Nulshock Bd.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[#140C0C] text-white antialiased">{children}</body>
    </html>
  );
}
