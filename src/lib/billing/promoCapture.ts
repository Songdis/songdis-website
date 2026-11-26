// A promo code that arrived in a link (?promo=CBA2026, e.g. from a campaign QR code) is kept
// for 30 days, so it is still there after sign-up and email verification, and is applied the
// first time the person opens the plans.
const KEY = "songdis_promo";
const DAYS = 30;

export function savePromoFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("promo") || params.get("code") || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,64}$/.test(code)) return;
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // Private mode or storage blocked: they can still type the code.
  }
}

export function savedPromo(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    if (!code || Date.now() - at > DAYS * 86400000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function forgetPromo(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
