"use client";

import { useEffect, useRef, useState } from "react";

const LETTERS = ["S", "O", "N", "G", "D", "I", "S"];

export default function NeonWordmark() {
  const [visible, setVisible] = useState(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const loop = () => {
      // Blink off
      const tOff = setTimeout(() => {
        setVisible(false);

        // Back on after 120ms
        const tOn = setTimeout(() => {
          setVisible(true);

          // Wait before next blink
          const tNext = setTimeout(loop, 3000);
          timeoutsRef.current.push(tNext);
        }, 120);

        timeoutsRef.current.push(tOn);
      }, 3000);

      timeoutsRef.current.push(tOff);
    };

    const tStart = setTimeout(loop, 2000);
    timeoutsRef.current.push(tStart);

    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden select-none pointer-events-none"
      style={{ marginBottom: "-0.12em" }}
    >
      <p
        className="font-heading uppercase text-center whitespace-nowrap"
        style={{
          fontSize: "clamp(50px, 16vw, 260px)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "transparent",
          WebkitTextStroke: "2px #C30100",
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease-in",
        }}
      >
        SONGDIS
      </p>
    </div>
  );
}