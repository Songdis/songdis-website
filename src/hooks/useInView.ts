"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** 0–1: how much of the element must be visible before triggering */
  threshold?: number;
  /** If true, the observer disconnects after first intersection */
  once?: boolean;
  /** Margin around the root — same syntax as CSS margin */
  rootMargin?: string;
}

/**
 * useInView
 * ──────────────────────────────────────────────────────────────────
 * Lightweight IntersectionObserver hook for scroll-triggered reveals.
 * Zero dependencies beyond React. Cleans up automatically.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const isInView = useInView(ref, { threshold: 0.2, once: true });
 */
export function useInView<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseInViewOptions = {}
): boolean {
  const { threshold = 0, once = false, rootMargin = "0px" } = options;
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Bail early — already triggered and once-mode
    if (once && isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once && observerRef.current) {
            observerRef.current.disconnect();
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, threshold, rootMargin, once]);

  return isInView;
}