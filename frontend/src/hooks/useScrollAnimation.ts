"use client";

import { useCallback, useRef } from "react";

export function useScrollAnimation<T extends HTMLElement>() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((el: T | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!el) return;

    // Inside Swiper, slides are positioned via translate3d so the default
    // IntersectionObserver (root=viewport) never sees off-screen slides.
    // Use the Swiper container (.right-panel) as the observation root so
    // intersections are detected when a slide becomes active.
    const swiperRoot = el.closest(".right-panel") as HTMLElement | null;

    // If element is already in viewport, make it visible immediately
    const rect = el.getBoundingClientRect();
    const rootRect = swiperRoot?.getBoundingClientRect();
    const viewH = rootRect ? rootRect.bottom : window.innerHeight;
    const viewTop = rootRect ? rootRect.top : 0;
    if (rect.top < viewH && rect.bottom > viewTop) {
      el.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
        }
      },
      { root: swiperRoot, threshold: 0.15 }
    );

    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return ref;
}
