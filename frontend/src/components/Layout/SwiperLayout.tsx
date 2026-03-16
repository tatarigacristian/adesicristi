"use client";

import { useState, useCallback, useEffect } from "react";
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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

export default function SwiperLayout({
  settings,
  guest,
}: {
  settings: WeddingSettings | null;
  guest?: GuestData | null;
}) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const isDesktop = useIsDesktop();

  const handleSwiper = useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper);
  }, []);

  // Mobile: native scroll, no Swiper
  if (!isDesktop) {
    return (
      <SwiperProvider swiper={null}>
        <MobileNav />
        <div className="split-container">
          <Sidebar settings={settings} />
          <main className="right-panel mobile-scroll">
            <Hero guest={guest} settings={settings} />
            <Couple settings={settings} />
            <Family settings={settings} />
            <Locations settings={settings} />
            <RSVP guest={guest} settings={settings} />
            <Footer settings={settings} />
          </main>
        </div>
      </SwiperProvider>
    );
  }

  // Desktop: Swiper with mousewheel
  return (
    <SwiperProvider swiper={swiperInstance}>
      <MobileNav />
      <div className="split-container">
        <Sidebar settings={settings} />
        <main className="right-panel">
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
            simulateTouch={false}
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
