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
  sex: "M" | "F" | null;
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
  const isAnimating = useRef(false);

  const handleSwiper = useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper);
  }, []);

  // Block wheel events during slide transition to prevent double-jump
  useEffect(() => {
    if (!swiperInstance) return;
    const el = swiperInstance.el;
    if (!el) return;

    const onTransitionStart = () => { isAnimating.current = true; };
    const onTransitionEnd = () => { isAnimating.current = false; };

    // Capture wheel at DOM level BEFORE Swiper sees it
    const blockWheel = (e: WheelEvent) => {
      if (isAnimating.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("wheel", blockWheel, { capture: true, passive: false });
    swiperInstance.on("slideChangeTransitionStart", onTransitionStart);
    swiperInstance.on("slideChangeTransitionEnd", onTransitionEnd);

    return () => {
      el.removeEventListener("wheel", blockWheel, { capture: true } as EventListenerOptions);
      swiperInstance.off("slideChangeTransitionStart", onTransitionStart);
      swiperInstance.off("slideChangeTransitionEnd", onTransitionEnd);
    };
  }, [swiperInstance]);

  // Lock html scroll for Swiper pages only
  useEffect(() => {
    document.documentElement.classList.add("swiper-lock");
    return () => {
      document.documentElement.classList.remove("swiper-lock");
    };
  }, []);

  // iOS Chrome: vh/dvh get stuck after keyboard dismiss.
  // Use visualViewport.height but only update when keyboard is CLOSED
  // (height increases back to full), not when it opens (height shrinks).
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const fullHeight = window.visualViewport?.height ?? window.innerHeight;
    panel.style.height = `${fullHeight}px`;
    document.documentElement.style.setProperty("--real-vh", `${fullHeight}px`);

    const lastFullHeight = { current: fullHeight };

    const onResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const h = vv.height;
      // Only update when viewport grows back (keyboard closed / orientation)
      // Ignore when it shrinks (keyboard opening)
      if (h >= lastFullHeight.current * 0.85) {
        lastFullHeight.current = h;
        panel.style.height = `${h}px`;
        document.documentElement.style.setProperty("--real-vh", `${h}px`);
        swiperInstance?.update();
      }
    };

    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => setTimeout(onResize, 200));

    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [swiperInstance]);

  return (
    <SwiperProvider swiper={swiperInstance}>
      <MobileNav />
      <div className="split-container">
        <Sidebar settings={settings} hasGuest={!!guest} />
        <main ref={panelRef} className="right-panel">
          <Swiper
            direction="vertical"
            modules={[Mousewheel]}
            mousewheel={{
              sensitivity: 1,
              forceToAxis: true,
              thresholdDelta: 15,
              thresholdTime: 400,
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
