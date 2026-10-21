type Fbq = (...args: unknown[]) => void;


export function trackMeta(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const fbq = (window as unknown as { fbq?: Fbq }).fbq;

  if (typeof fbq !== "function") {
    return;
  }

  try {
    if (eventId) {
      fbq("track", event, params ?? {}, { eventID: eventId });
    } else if (params) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch {
  }
}


export function trackSignUp(userId?: number | null): void {
  if (!userId) {
    return;
  }

  trackMeta("CompleteRegistration", undefined, `signup-${userId}`);
}

export function trackSubscribe(plan?: string | null, interval?: string | null): void {
  trackMeta("Subscribe", {
    content_name: plan ?? undefined,
    predicted_ltv: undefined,
    subscription_interval: interval ?? undefined,
  });
}
