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
    ZohoDeskAsapReady?: (cb?: () => void) => void;
    /** Zoho's own spelling. Callbacks queued here until the remote script drains them. */
    ZohoDeskAsap__asyncalls?: (undefined | (() => void))[] | null;
    ZohoDeskAsapReadyStatus?: boolean;
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

        /*
         * Install the ready queue BEFORE loading the remote script.
         *
         * Zoho's embed snippet is two halves: an inline block that defines
         * ZohoDeskAsapReady and its pending-callback queue, and the remote script that
         * eventually sets ZohoDeskAsapReadyStatus and drains it. We deliberately do not
         * paste their snippet - the src comes from the API so it can change without a
         * frontend rebuild - which meant only the remote half ever ran. window
         * .ZohoDeskAsapReady was therefore undefined, the guard below bailed, and neither
         * the launcher hide nor markSupportReady() ever fired: widget visible, no Support
         * item in the sidebar.
         *
         * This reproduces the inline half. Guarded so that if a future snippet ships it
         * itself, theirs wins.
         */
        if (typeof window.ZohoDeskAsapReady !== "function") {
          window.ZohoDeskAsapReady = (cb?: () => void) => {
            const queue = (window.ZohoDeskAsap__asyncalls =
              window.ZohoDeskAsap__asyncalls || []);

            if (window.ZohoDeskAsapReadyStatus) {
              if (cb) queue.push(cb);
              queue.forEach((fn) => fn && fn());
              window.ZohoDeskAsap__asyncalls = null;
            } else if (cb) {
              queue.push(cb);
            }
          };
        }

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

        /*
         * Runs the moment the widget object exists, from whichever path gets there first.
         * Idempotent: markSupportReady() ignores repeat calls and the hide calls are
         * harmless to repeat.
         */
        const onWidgetAvailable = () => {
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

          /*
           * Belt to the stylesheet's braces.
           *
           * globals.css hides the launcher with `!important`, but an inline style carrying
           * `!important` beats any stylesheet rule — so if Zoho writes the launcher's
           * display inline, only another inline declaration can win. That is set here on
           * the element directly, using the same live-DOM selectors as the CSS.
           *
           * The observer re-applies it if Zoho re-renders the launcher after load, which
           * widgets commonly do on route changes or once their config arrives. It watches
           * insertions only and coalesces bursts into one pass per frame, so React's own
           * re-renders elsewhere on the page cost next to nothing.
           */
          const LAUNCHER = 'button[id^="zohohc-asap"], button[class*="zd-launcher"]';

          const hideLauncher = () => {
            document.querySelectorAll<HTMLElement>(LAUNCHER).forEach((el) => {
              el.style.setProperty("display", "none", "important");
              el.style.setProperty("visibility", "hidden", "important");
              el.style.setProperty("pointer-events", "none", "important");
            });
          };

          hideLauncher();

          let queued = false;
          new MutationObserver(() => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
              queued = false;
              hideLauncher();
            });
          }).observe(document.body, { childList: true, subtree: true });

          markSupportReady();

          // Current ASAP.
          try {
            const desk = window.ZohoDeskAsap as
              { invoke?: (action: string, cb: unknown) => void } | undefined;

            desk?.invoke?.("login", (accept: (token: string) => void) => {
              void provideToken(accept);
            });
          } catch {
            /* not this generation */
          }

          // Legacy ASAP.
          try {
            const hc = window.ZohoHCAsap as
              { Action?: (name: string, cb: unknown) => void } | undefined;

            hc?.Action?.(
              "onGetUserToken",
              (accept: (token: string) => void) => {
                void provideToken(accept);
              },
            );
          } catch {
            /* not this generation either */
          }
        };

        script.onload = () => {
          // Preferred path: the widget tells us when it is ready.
          try {
            window.ZohoDeskAsapReady?.(onWidgetAvailable);
          } catch {
            /* fall through to the poll */
          }

          /*
           * Fallback: watch for the global directly.
           *
           * The ready hook depends on Zoho's own bootstrap firing, and when it silently did
           * not, the Support item never appeared - leaving no way into support at all, since
           * the floating launcher is hidden. Polling for the object the console proves does
           * exist removes that single point of failure. Gives up after ~10s rather than
           * spinning forever.
           */
          let tries = 0;
          const poll = window.setInterval(() => {
            tries += 1;

            if (window.ZohoDeskAsap) {
              window.clearInterval(poll);
              onWidgetAvailable();
            } else if (tries > 40) {
              window.clearInterval(poll);
            }
          }, 250);
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
