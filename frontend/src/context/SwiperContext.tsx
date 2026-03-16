"use client";

import { createContext, useContext } from "react";
import type { Swiper as SwiperType } from "swiper";

const SwiperContext = createContext<SwiperType | null>(null);

export function SwiperProvider({ swiper, children }: { swiper: SwiperType | null; children: React.ReactNode }) {
  return <SwiperContext.Provider value={swiper}>{children}</SwiperContext.Provider>;
}

// Section IDs in slide order
export const SLIDE_IDS = ["hero", "couple", "family", "locations", "rsvp", "footer"] as const;

export function useSwiper() {
  return useContext(SwiperContext);
}

export function useSlideTo() {
  const swiper = useContext(SwiperContext);
  return (sectionId: string) => {
    if (!swiper) return;
    const index = SLIDE_IDS.indexOf(sectionId as typeof SLIDE_IDS[number]);
    if (index >= 0) {
      swiper.slideTo(index, 800);
    }
  };
}
