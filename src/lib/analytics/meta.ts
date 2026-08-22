/**
 * Meta Pixel events.
 *
 * The pixel itself is loaded in the root layout and fires PageView on load. That is all
 * Meta sees by default — the App Router navigates client-side, so a visitor moving from
 * the landing page through sign-up to a paid plan never triggers another event. Without
 * the calls below, Instagram optimises for "loaded a page" rather than "signed up", which
 * buys cheap traffic that does not convert.
 *
 * Everything here is best-effort and MUST NOT be able to break the flow it sits in.
 * Sign-up and payment confirmation are the two moments where a thrown error costs real
 * money, so every call is guarded three ways: no window (SSR), no fbq (blocked by an ad
 * blocker, which is common), and a try/catch around the call itself.
 */

type Fbq = (...args: unknown[]) => void;

/** Fire a standard Meta event. Silently does nothing if the pixel is unavailable. */
export function trackMeta(event: string, params?: Record<string, unknown>): void {
  // Server render, or a build-time pass — there is no pixel here.
  if (typeof window === "undefined") {
    return;
  }

  const fbq = (window as unknown as { fbq?: Fbq }).fbq;

  // Ad blockers remove fbq entirely. That is a normal state, not an error.
  if (typeof fbq !== "function") {
    return;
  }

  try {
    if (params) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch {
    // Tracking is never worth breaking a sign-up or a payment confirmation over.
  }
}

/** A new account was created. */
export function trackSignUp(): void {
  trackMeta("CompleteRegistration");
}

/**
 * A subscription went active.
 *
 * `Subscribe`, not `Purchase`: Meta requires `value` and `currency` on Purchase, and the
 * billing status this is called from carries neither — it returns the plan and interval,
 * not the amount charged. Sending Purchase without a value would report a conversion worth
 * zero and skew the reported return on ad spend downward.
 */
export function trackSubscribe(plan?: string | null, interval?: string | null): void {
  trackMeta("Subscribe", {
    content_name: plan ?? undefined,
    predicted_ltv: undefined,
    subscription_interval: interval ?? undefined,
  });
}
