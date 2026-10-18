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

/**
 * Fire a standard Meta event. Silently does nothing if the pixel is unavailable.
 *
 * `eventId` is Meta's deduplication key. The same conversion is now also sent server-side
 * through the Conversions API, and Meta collapses the two into one only when both carry the
 * same event id under the same event name. Without it, every conversion that reaches Meta by
 * both routes is counted twice — which inflates reported return on ad spend and is
 * indistinguishable from a good week.
 */
export function trackMeta(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
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
    // The options object is the FOURTH argument and the key is `eventID`, capital I and D.
    // Spelled any other way it is ignored silently and the dedup simply does not happen.
    if (eventId) {
      fbq("track", event, params ?? {}, { eventID: eventId });
    } else if (params) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch {
    // Tracking is never worth breaking a sign-up or a payment confirmation over.
  }
}

/**
 * A new account was created.
 *
 * `userId` is required for this to fire at all. The API sends the same CompleteRegistration
 * from AuthController::register() with the event id `signup-<user id>`, and this has to match
 * it exactly. With no id there is no way to build that key, so the event is skipped rather
 * than sent undeduplicated — the server's copy always goes out and always carries the email
 * and user id, so nothing is lost by staying quiet, whereas firing would count the sign-up
 * twice.
 */
export function trackSignUp(userId?: number | null): void {
  if (!userId) {
    return;
  }

  trackMeta("CompleteRegistration", undefined, `signup-${userId}`);
}

/**
 * A subscription went active.
 *
 * `Subscribe`, not `Purchase`: Meta requires `value` and `currency` on Purchase, and the
 * billing status this is called from carries neither — it returns the plan and interval,
 * not the amount charged. Sending Purchase without a value would report a conversion worth
 * zero and skew the reported return on ad spend downward.
 *
 * Purchase now comes from the server instead, out of the Bachs webhook, which is the only
 * place the amount actually charged is known. Do NOT add a browser Purchase here: it would
 * need to share the server's event id — the payment reference — which this page does not
 * have, so the two would not deduplicate and every subscription would count twice.
 */
export function trackSubscribe(plan?: string | null, interval?: string | null): void {
  trackMeta("Subscribe", {
    content_name: plan ?? undefined,
    predicted_ltv: undefined,
    subscription_interval: interval ?? undefined,
  });
}
