const SDK_URL = "https://checkout.bachs.io/bachs.js";

export type BachsEventType =
  | "checkout.opened"
  | "checkout.loaded"
  | "checkout.ready"
  | "checkout.completed"
  | "checkout.failed"
  | "checkout.expired"
  | "checkout.closed"
  | "checkout.error";

export interface BachsEvent {
  type: BachsEventType;
  data: Record<string, unknown> & { reference?: string; message?: string; reason?: string };
}

interface BachsSDK {
  Initialize: (options: { onEvent?: (event: BachsEvent) => void; baseUrl?: string }) => BachsSDK;
  Checkout: {
    open: (args: {
      checkoutUrl?: string;
      token?: string;
      onEvent?: (event: BachsEvent) => void;
      options?: { showCloseButton?: boolean; autoCloseOnComplete?: boolean };
    }) => Promise<void>;
    close: () => void;
    isOpen: () => boolean;
  };
}

declare global {
  interface Window {
    Bachs?: BachsSDK;
  }
}

let loadPromise: Promise<BachsSDK> | null = null;
let initialized = false;

export function loadBachs(): Promise<BachsSDK> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Bachs checkout is only available in the browser."));
  }

  if (window.Bachs) {
    return Promise.resolve(window.Bachs);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<BachsSDK>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);

    const settle = () => {
      if (window.Bachs) {
        resolve(window.Bachs);
      } else {
        loadPromise = null;
        reject(new Error("Bachs SDK loaded but did not register itself."));
      }
    };

    if (existing) {
      existing.addEventListener("load", settle, { once: true });
      existing.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("Could not load the Bachs checkout SDK."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = settle;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Could not load the Bachs checkout SDK."));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}


export async function openBachsOverlay(
  checkoutUrl: string,
  onEvent: (event: BachsEvent) => void
): Promise<void> {
  const Bachs = await loadBachs();

  if (!initialized) {
    Bachs.Initialize({});
    initialized = true;
  }

  await Bachs.Checkout.open({
    checkoutUrl,
    onEvent,
    options: { showCloseButton: true, autoCloseOnComplete: true },
  });
}

export function closeBachsOverlay(): void {
  if (typeof window !== "undefined" && window.Bachs?.Checkout.isOpen()) {
    window.Bachs.Checkout.close();
  }
}
