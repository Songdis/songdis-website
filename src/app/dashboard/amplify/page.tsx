"use client";

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const WIDGET_BASE = "https://widgets.songtools.io/v1/CampaignTestX";
const APP_KEY = "A33ECB34D12E470FA761E9426286EA00";
const WIXGETCONTENT_SRC = "https://songdis.songtools.io/js/wixgetcontent.js?v=1738787616";

export default function AmplifyPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(900);
  const [loaded, setLoaded] = useState(false);

  /* Build the widget src
   * TODO: Once backend provides a proper JWT (not Sanctum token),
   * re-enable: &jwt=${jwtToken}
   * JWT must contain { email, name } claims signed with the
   * secret shared with danny@songtools.io
   */
  const src = `${WIDGET_BASE}?app-key=${APP_KEY}&autodetect=1`;

  /* Load wixgetcontent.js once */
  useEffect(() => {
    if (document.querySelector(`script[src="${WIXGETCONTENT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = WIXGETCONTENT_SRC;
    script.type = "text/javascript";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  /* Listen for postMessage events from the widget iframe (height resize etc.) */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      // Songtools widget sends height updates as a number or { height: number }
      if (typeof e.data === "number" && e.data > 100) {
        setIframeHeight(e.data);
      } else if (typeof e.data === "object" && e.data.height) {
        setIframeHeight(Number(e.data.height));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <DashboardLayout pageTitle="Amplify">
      <div className="flex flex-col gap-5">

        {/* Header info */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-white uppercase text-sm tracking-wide mb-1">
                Amplify
              </h2>
              <p className="font-body text-white/50 text-sm">
                Promote your music to new audiences across streaming platforms.
              </p>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={["w-2 h-2 rounded-full", loaded ? "bg-green-500 animate-pulse" : "bg-yellow-500"].join(" ")} />
              <span className="font-body text-white/40 text-xs">
                {loaded ? "Widget loaded" : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        {/* Widget container */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] overflow-hidden relative min-h-[600px]">
          {/* Loading skeleton */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#180F0F]">
              <svg className="animate-spin text-[#C30100]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <p className="font-body text-white/40 text-sm">Loading campaign manager...</p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            id="iframeWidget"
            src={src}
            frameBorder="0"
            scrolling="no"
            width="100%"
            allow="clipboard-write"
            onLoad={() => setLoaded(true)}
            style={{
              height: `${iframeHeight}px`,
              backgroundColor: "transparent",
              border: "none",
              margin: 0,
              padding: 0,
              overflow: "hidden",
              display: "block",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* Integration note */}
        <div className="rounded-xl border border-white/[0.04] bg-transparent px-4 py-3">
          <p className="font-body text-white/25 text-xs">
            Powered by Songtools · Campaign data syncs automatically with your Songdis account
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}