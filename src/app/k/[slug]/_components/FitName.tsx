"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The artist's name, as big as it can be without breaking a word.
 *
 * The display face is very wide and letters vary a lot ("O" is far wider than "i"), so a size
 * estimated from the letter count still split names mid-word on phones ("Obe / d"). This
 * measures the longest word in the real font and sizes the name so that word fits the column.
 * Lines may break between words, never inside one.
 */
export default function FitName({
  name,
  max = 96,
  min = 28,
  className = "",
  style,
}: {
  name: string;
  max?: number;
  min?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const p = probe.current;
    if (!el || !p) return;

    const fit = () => {
      const width = el.clientWidth;
      if (!width) return;
      // Measure each word at 100px in the real font; scale so the widest one fits.
      let widest = 0;
      for (const word of name.split(/\s+/).filter(Boolean)) {
        p.textContent = word;
        widest = Math.max(widest, p.getBoundingClientRect().width);
      }
      if (!widest) return;
      const next = Math.max(min, Math.min(max, Math.floor((width / widest) * 100 * 0.98)));
      setSize(next);
    };

    fit();
    // The font may still be loading on first paint; fit again once it is, and on resize.
    document.fonts?.ready.then(fit).catch(() => undefined);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [name, max, min]);

  return (
    <h1
      ref={ref}
      className={className}
      style={{
        ...style,
        // Before measuring: a safe guess from the length, so the first paint is close.
        fontSize: size ? `${size}px` : `clamp(${min}px, 9vw, ${Math.round(max * 0.66)}px)`,
        wordBreak: "keep-all",
        overflowWrap: "normal",
      }}
    >
      {name}
      <span
        ref={probe}
        aria-hidden
        style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap", fontSize: "100px", left: -9999, top: 0 }}
      />
    </h1>
  );
}
