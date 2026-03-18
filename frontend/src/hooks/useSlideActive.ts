"use client";

import { useState, useEffect, useCallback } from "react";
import { useSwiper, SLIDE_IDS } from "@/context/SwiperContext";

export function useSlideActive(sectionId: typeof SLIDE_IDS[number]) {
  const swiper = useSwiper();
  const [show, setShow] = useState(false);
  const sectionIndex = SLIDE_IDS.indexOf(sectionId);

  const handleChange = useCallback(() => {
    if (!swiper) return;
    if (swiper.activeIndex === sectionIndex) {
      setShow(false);
      // Double rAF ensures the browser paints opacity:0 first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
    }
  }, [swiper, sectionIndex]);

  useEffect(() => {
    if (!swiper) return;
    swiper.on("slideChangeTransitionEnd", handleChange);
    // Check on mount in case this is the initial active slide
    if (swiper.activeIndex === sectionIndex) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => { clearTimeout(timer); swiper.off("slideChangeTransitionEnd", handleChange); };
    }
    return () => { swiper.off("slideChangeTransitionEnd", handleChange); };
  }, [swiper, sectionIndex, handleChange]);

  return show;
}
