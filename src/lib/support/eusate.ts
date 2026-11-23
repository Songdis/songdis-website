"use client";

/**
 * Eusate chat (support AI "Sate" plus the team), loaded from Eusate's CDN.
 *
 * Settings come from the API (/support/identity or /support/widget) so the key can change
 * without a rebuild. Loading is idempotent: the dashboard and the public site share it.
 */

export interface EusateSettings {
  provider: "eusate";
  configured: boolean;
  api_key: string;
  sdk_url: string;
  environment?: string;
}

type EusateGlobal = {
  init: (cfg: Record<string, unknown>) => void;
  open?: () => void;
  close?: () => void;
  isInitialized?: () => boolean;
};

declare global {
  interface Window {
    Eusate?: EusateGlobal;
  }
}

const SCRIPT_ID = "eusate-sdk";
let loading: Promise<boolean> | null = null;

export function loadEusate(settings: EusateSettings): Promise<boolean> {
  if (typeof window === "undefined" || !settings?.api_key || !settings.sdk_url) return Promise.resolve(false);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const start = () => {
      try {
        if (window.Eusate?.isInitialized?.()) return resolve(true);
        window.Eusate?.init({
          apiKey: settings.api_key,
          environment: settings.environment ?? "production",
          onReady: () => resolve(true),
          onError: () => resolve(false),
        });
        // Some versions never call onReady; don't leave callers waiting forever.
        setTimeout(() => resolve(Boolean(window.Eusate)), 8000);
      } catch {
        resolve(false);
      }
    };

    if (window.Eusate) return start();
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", start, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = settings.sdk_url;
    s.async = true;
    s.onload = start;
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  return loading;
}

export function openEusate(): boolean {
  try {
    if (window.Eusate?.open) {
      window.Eusate.open();
      return true;
    }
  } catch {
    /* not loaded */
  }
  return false;
}
