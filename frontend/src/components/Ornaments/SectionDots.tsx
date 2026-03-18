"use client";

import { useState, useEffect, useCallback } from "react";
import { useSwiper, SLIDE_IDS } from "@/context/SwiperContext";

export default function SectionDots({ className = "" }: { className?: string }) {
  const swiper = useSwiper();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSlideChange = useCallback(() => {
    if (swiper) setActiveIndex(swiper.activeIndex);
  }, [swiper]);

  useEffect(() => {
    if (!swiper) return;
    swiper.on("slideChange", handleSlideChange);
    handleSlideChange();
    return () => { swiper.off("slideChange", handleSlideChange); };
  }, [swiper, handleSlideChange]);

  return (
    <div className={`flex items-center justify-center gap-2 py-2 ${className}`}>
      <span className="block w-10 h-px bg-button/30 sm:hidden" />
      <div className="flex items-center gap-1.5 sm:hidden">
        {SLIDE_IDS.map((_, i) => (
          <div key={i}>
            <div
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-1.5 h-1.5 bg-button/60"
                  : "w-1 h-1 bg-button/15"
              }`}
            />
          </div>
        ))}
      </div>
      <span className="block w-10 h-px bg-button/30 sm:hidden" />
    </div>
  );
}
