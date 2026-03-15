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

    // If element is already in viewport, make it visible immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return ref;
}
