"use client";

import { useEffect, useState } from "react";

const SHORT_VIEWPORT_MAX_HEIGHT = 650;

export function useShortViewport() {
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    const check = () => setIsShort(window.innerHeight < SHORT_VIEWPORT_MAX_HEIGHT);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isShort;
}
