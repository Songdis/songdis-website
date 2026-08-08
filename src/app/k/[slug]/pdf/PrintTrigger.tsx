"use client";

import { useEffect, useState } from "react";

/**
 * Opens the browser's print dialog once the page is ready, and leaves a visible button
 * behind for anyone who dismisses it or arrives with JS blocked.
 *
 * Why the browser's own printer rather than a PDF library: "Save as PDF" produces real
 * selectable text, working hyperlinks and correctly embedded fonts, with no dependency
 * added to any repo and nothing to install on App Runner or Amplify. A server-side
 * renderer would need either a headless Chrome in the deploy image or dompdf — and dompdf
 * cannot lay out flex or grid, which this design is entirely built from.
 *
 * The button is `print:hidden`, so it never appears in the output it triggers.
 */
export default function PrintTrigger() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);

    // Wait for images to finish. Printing mid-load silently produces a PDF with blank
    // frames where the artwork should be, which looks like a broken kit rather than a
    // slow one — and the artist would have no idea why.
    const fire = () => window.setTimeout(() => window.print(), 350);

    if (document.readyState === "complete") {
      fire();
      return;
    }

    window.addEventListener("load", fire, { once: true });
    return () => window.removeEventListener("load", fire);
  }, []);

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="fixed bottom-5 right-5 z-50 rounded-full bg-[#C30100] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5342F] print:hidden"
    >
      Download PDF
    </button>
  );
}
