import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";


const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Operating System for Artists & Labels",
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
    title: "The Operating System for Artists & Labels",
    description:
      "Upload your music on Spotify, Apple Music & more. Keep 100% ownership.",
    type: "website",
    siteName: "Songdis",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Operating System for Artists & Labels",
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
    <html lang="en" className={montserrat.variable} data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/Nulshock Bd.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        {/*
          Meta Pixel — conversion tracking for Instagram/Facebook ads.

          In <head> with `beforeInteractive` so it loads ahead of any app code, which is
          the placement Meta's install instructions assume. This is the ONE root layout
          (no other layout renders <html>), so it covers every page — landing, sign-up,
          dashboard — not just the marketing pages.

          Worth knowing when reading the ad reports: this fires PageView once, on load.
          The App Router navigates client-side, so moving from the landing page to sign-up
          does NOT fire a second event. Conversions have to be sent explicitly at the
          moment they happen:

            fbq('track', 'CompleteRegistration')   // after sign-up succeeds
            fbq('track', 'Purchase', { value, currency })  // after a subscription

          Without those, Meta optimises against page views rather than sign-ups.
        */}
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1084026134582924');
fbq('track', 'PageView');`}
        </Script>
      </head>
      <body className="bg-[#140C0C] text-white antialiased" suppressHydrationWarning>
        {/*
          The <noscript> fallback stays in <body>: inside <head> a <noscript> may only
          contain link/style/meta, so an <img> there is invalid HTML and browsers drop it.
        */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=1084026134582924&ev=PageView&noscript=1"
          />
        </noscript>

        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}