"use client";

import { useState, useEffect, useCallback } from "react";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";
import { useSwiper, SLIDE_IDS } from "@/context/SwiperContext";
import ScrollIndicator from "./ScrollIndicator";

export default function SectionFooterNav({
  settings,
  className = "",
}: {
  settings?: WeddingSettings | null;
  className?: string;
}) {
  const couple = getCoupleNames(settings ?? null);
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
    <div className={`section-footer pb-2 sm:pb-0 ${className}`}>
      {/* Contact + scroll row */}
      <div className="flex items-center justify-center w-full max-w-sm mx-auto sm:justify-center">
        {/* Left: Mireasa — mobile only */}
        {settings?.telefon_mireasa && (
          <a
            href={`tel:${settings.telefon_mireasa.replace(/\s/g, "")}`}
            className="flex-1 flex flex-col items-center gap-0.5 group sm:hidden"
          >
            <span className="text-[0.55rem] text-text-muted">{couple.mireasa}</span>
            <span className="text-[0.6rem] text-button group-hover:text-button-hover transition-colors">
              {settings.telefon_mireasa}
            </span>
          </a>
        )}

        {/* Center: scroll indicator */}
        <div className="flex flex-col items-center px-4 sm:px-0">
          <ScrollIndicator />
        </div>

        {/* Right: Mire — mobile only */}
        {settings?.telefon_mire && (
          <a
            href={`tel:${settings.telefon_mire.replace(/\s/g, "")}`}
            className="flex-1 flex flex-col items-center gap-0.5 group sm:hidden"
          >
            <span className="text-[0.55rem] text-text-muted">{couple.mire}</span>
            <span className="text-[0.6rem] text-button group-hover:text-button-hover transition-colors">
              {settings.telefon_mire}
            </span>
          </a>
        )}
      </div>

      {/* Section dots — full width, mobile only */}
      <div className="flex justify-between px-8 mt-2 sm:hidden">
        {SLIDE_IDS.map((_, i) => (
          <div key={i} className="flex items-center justify-center w-3 h-3">
            <div
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-2 h-2 bg-button"
                  : "w-1 h-1 bg-button/20"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
