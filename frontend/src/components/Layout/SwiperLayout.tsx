"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { SwiperProvider } from "@/context/SwiperContext";
import { WeddingSettings } from "@/utils/settings";
import Hero from "@/components/Hero/Hero";
import Couple from "@/components/Couple/Couple";
import Family from "@/components/Family/Family";
import Locations from "@/components/Locations/Locations";
import RSVP from "@/components/RSVP/RSVP";
import Footer from "@/components/Footer/Footer";
import MobileNav from "@/components/Navigation/MobileNav";
import Sidebar from "@/components/Sidebar/Sidebar";

import "swiper/css";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  partner: { nume: string; prenume: string } | null;
}

export default function SwiperLayout({
  settings,
  guest,
}: {
  settings: WeddingSettings | null;
  guest?: GuestData | null;
}) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSwiper = useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper);
  }, []);

  // Drive container height from visualViewport — the only value iOS Chrome
  // reports correctly after keyboard dismiss. CSS vh/dvh can get stuck.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const setHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      panel.style.height = `${h}px`;
      swiperInstance?.update();
    };

    setHeight();

    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", () => setTimeout(setHeight, 200));

    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
    };
  }, [swiperInstance]);

  return (
    <SwiperProvider swiper={swiperInstance}>
      <MobileNav />
      <div className="split-container">
        <Sidebar settings={settings} />
        <main ref={panelRef} className="right-panel">
          <Swiper
            direction="vertical"
            modules={[Mousewheel]}
            mousewheel={{
              sensitivity: 1,
              forceToAxis: true,
            }}
            speed={800}
            slidesPerView={1}
            onSwiper={handleSwiper}
            style={{ height: "100%" }}
          >
            <SwiperSlide><Hero guest={guest} settings={settings} /></SwiperSlide>
            <SwiperSlide><Couple settings={settings} /></SwiperSlide>
            <SwiperSlide><Family settings={settings} /></SwiperSlide>
            <SwiperSlide><Locations settings={settings} /></SwiperSlide>
            <SwiperSlide><RSVP guest={guest} settings={settings} /></SwiperSlide>
            <SwiperSlide><Footer settings={settings} /></SwiperSlide>
          </Swiper>
        </main>
      </div>
    </SwiperProvider>
  );
}
