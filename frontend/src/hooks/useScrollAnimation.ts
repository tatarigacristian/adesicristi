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

    // All animated sections live inside Swiper which uses CSS translate3d.
    // IntersectionObserver cannot detect transform-based positioning,
    // so always make elements visible immediately — Swiper's own slide
    // transitions handle the visual animation.
    el.classList.add("visible");
  }, []);

  return ref;
}
