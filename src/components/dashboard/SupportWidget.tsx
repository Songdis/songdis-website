"use client";

/**
 * In-app support (Zoho Desk ASAP).
 *
 * Loads the help-desk widget and hands it a signed identity so the artist is recognised
 * without logging in twice, and so an agent opens the ticket already knowing their plan,
 * their release counts and what their latest release is doing.
 *
 * Everything here is defensive on purpose. This mounts on every dashboard page, and support
 * being unavailable — not configured, script blocked, Zoho down, API shape changed — must
 * look like "no support button", never like a broken dashboard. There is no error state
 * shown to the artist and nothing thrown upward.
 */

import { useEffect, useRef } from "react";
import { getSupportIdentity } from "@/lib/api/support";
import { markSupportReady } from "@/lib/support/controller";

/**
 * The widget is a third-party global. Typed loosely and only where used, because the exact
 * ASAP surface varies by widget version and pinning a wrong shape here would turn a cosmetic
 * mismatch into a compile error.
 */
declare global {
  interface Window {
    ZohoDeskAsap?: unknown;
    ZohoDeskAsapReady?: (cb: () => void) => void;
    ZohoDeskAsap__asyncCalls?: unknown[];
    ZohoHCAsap?: unknown;
    ZohoHCAsapReady?: (cb: () => void) => void;
  }
}

const SCRIPT_ID = "zoho-desk-asap";

export default function SupportWidget() {
  // Guards React 18 double-invoking effects in development, which would otherwise append
  // the script twice and start two widgets.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    (async () => {
      try {
        const res = await getSupportIdentity();

        if (cancelled) return;

        const data = res.data;

        // Not configured on this environment, or the call failed. Either way: no widget.
        if (!data?.configured || !data.script_url) return;

        if (document.getElementById(SCRIPT_ID)) return;

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = data.script_url;
        script.defer = true;

        /*
         * Hand the widget a token when it asks, and again when the one it holds expires —
         * ours are deliberately short-lived. So each call refetches rather than replaying
         * the token from the first load.
         *
         * Two ASAP generations exist and the embed snippet decides which you get. The one
         * Songdis was issued defines `ZohoDeskAsap` / `ZohoDeskAsapReady`; older portals
         * define `ZohoHCAsap` / `ZohoHCAsapReady` with a different login call. Rather than
         * bet on one, both are attempted and each is wrapped: an API that is not there is
         * not an error, it just means the widget stays anonymous, and someone can still
         * raise a ticket that way.
         */
        const provideToken = async (accept: (token: string) => void) => {
          try {
            const fresh = await getSupportIdentity();
            if (fresh.data?.token) accept(fresh.data.token);
          } catch {
            // Never call accept() with nothing — the widget falls back to anonymous.
          }
        };

        script.onload = () => {
          const ready = window.ZohoDeskAsapReady ?? window.ZohoHCAsapReady;

          if (typeof ready !== "function") return;

          try {
            ready(() => {
              /*
               * Hide the widget's own floating bubble.
               *
               * Support is a sidebar item next to everything else, not a button hovering
               * over the page — it was overlapping Ayo, and two competing bubbles in one
               * corner is how both get ignored. Several hide shapes are attempted because
               * the accepted one varies by widget version; a CSS rule backs them up, since
               * a launcher that will not hide is worse than one that never loaded.
               */
              try {
                const desk = window.ZohoDeskAsap as
                  | { invoke?: (action: string, ...args: unknown[]) => void }
                  | undefined;

                desk?.invoke?.("hide", "app.launcher");
                desk?.invoke?.("hide", "launcher");
              } catch {
                /* fall through to the CSS rule */
              }

              markSupportReady();

              // Current ASAP.
              try {
                const desk = window.ZohoDeskAsap as
                  | { invoke?: (action: string, cb: unknown) => void }
                  | undefined;

                desk?.invoke?.("login", (accept: (token: string) => void) => {
                  void provideToken(accept);
                });
              } catch {
                /* not this generation */
              }

              // Legacy ASAP.
              try {
                const hc = window.ZohoHCAsap as
                  | { Action?: (name: string, cb: unknown) => void }
                  | undefined;

                hc?.Action?.("onGetUserToken", (accept: (token: string) => void) => {
                  void provideToken(accept);
                });
              } catch {
                /* not this generation either */
              }
            });
          } catch {
            /* ignore */
          }
        };

        document.body.appendChild(script);
      } catch {
        // Support is a convenience. It never takes the dashboard with it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
