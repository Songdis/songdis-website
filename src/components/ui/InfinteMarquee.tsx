"use client";

import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  duration?: number;
  direction?: "left" | "right";
  gap?: number;
  pauseOnHover?: boolean;
  itemAlignment?: "center" | "end";
  /**
   * curved — wraps the track in a CSS 3D perspective container so the
   * cards appear to sit on a curved/cylindrical surface.
   * Only applies when itemAlignment === "end" (the cover art strip).
   */
  curved?: boolean;
  className?: string;
}

const InfiniteMarquee: React.FC<MarqueeProps> = ({
  children,
  duration = 30,
  direction = "left",
  gap = 16,
  pauseOnHover = true,
  itemAlignment = "center",
  curved = false,
  className = "",
}) => {
  const animationName = `marquee-${direction}`;
  const trackId = `marquee-track-${animationName}-${duration}`;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        overflow: "hidden",
        /* Edge fade */
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
        /* 3D perspective on the outer wrapper — this is what makes children
           appear to curve. A higher value = subtler curve, lower = more extreme. */
        ...(curved && {
          perspective: "1200px",
          perspectiveOrigin: "50% 0%",
        }),
      }}
    >
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        #${trackId}:hover {
          animation-play-state: ${pauseOnHover ? "paused" : "running"};
        }
      `}</style>

      {/*
        When curved=true we wrap the scrolling track in an extra div that
        applies rotateX — this tilts the entire strip backward in 3D space,
        making the bottom of the cards recede away from the viewer.
        The perspective on the parent converts that tilt into a real vanishing-
        point curve rather than a flat skew.
      */}
      <div
        style={{
          ...(curved && {
            transform: "rotateX(12deg)",
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
          }),
        }}
      >
        <div
          id={trackId}
          style={{
            display: "flex",
            width: "max-content",
            alignItems: itemAlignment === "end" ? "flex-end" : "center",
            gap: `${gap}px`,
            animation: `${animationName} ${duration}s linear infinite`,
            willChange: "transform",
          }}
        >
          {/* Original */}
          <div
            style={{
              display: "flex",
              flexShrink: 0,
              alignItems: itemAlignment === "end" ? "flex-end" : "center",
              gap: `${gap}px`,
            }}
          >
            {children}
          </div>
          {/* Clone — seamless loop */}
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              flexShrink: 0,
              alignItems: itemAlignment === "end" ? "flex-end" : "center",
              gap: `${gap}px`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteMarquee;