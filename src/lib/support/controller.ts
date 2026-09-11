"use client";

/**
 * A tiny handle on the help-desk widget, so the rest of the app can open it.
 *
 * The widget's own floating bubble is hidden — support belongs in the sidebar next to
 * everything else, not hovering over the page competing with Ayo for the same corner. That
 * means something has to open it, and the Sidebar needs to know whether it is there at all
 * so it does not render a button that does nothing.
 *
 * Module-level rather than React context because the widget is a third-party global loaded
 * outside React's tree; there is exactly one of it per page, and threading a provider
 * through the layout to describe a singleton would be more machinery than it is worth.
 */

type Listener = (ready: boolean) => void;

let ready = false;
const listeners = new Set<Listener>();

/** Called by SupportWidget once the widget is loaded and its own launcher is hidden. */
export function markSupportReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((fn) => fn(true));
}

export function isSupportReady(): boolean {
  return ready;
}

export function onSupportReady(fn: Listener): () => void {
  listeners.add(fn);
  // Fire immediately for anything that mounted after the widget finished loading.
  if (ready) fn(true);
  return () => {
    listeners.delete(fn);
  };
}

type DeskAsap = { invoke?: (action: string, ...args: unknown[]) => void };
type HcAsap = { Action?: (name: string, ...args: unknown[]) => void };

/**
 * Open the help widget.
 *
 * Both ASAP generations are attempted, and within the current one both the bare and
 * argumented forms of "open", because the accepted shape varies by widget version. Each is
 * wrapped: the cost of a call that does not exist is nothing, and the alternative is a
 * support button that silently does nothing on some portals.
 */
export function openSupport(): void {
  const desk = (window as { ZohoDeskAsap?: DeskAsap }).ZohoDeskAsap;
  const hc = (window as { ZohoHCAsap?: HcAsap }).ZohoHCAsap;

  const attempts: Array<() => void> = [
    () => desk?.invoke?.("open"),
    () => desk?.invoke?.("open", "app"),
    () => desk?.invoke?.("routeTo", { page: "ticket.form" }),
    () => hc?.Action?.("open"),
  ];

  for (const attempt of attempts) {
    try {
      attempt();
    } catch {
      /* not this shape */
    }
  }
}
