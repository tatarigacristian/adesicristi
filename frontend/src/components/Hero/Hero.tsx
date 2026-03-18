"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";
import { getInvitationAudience, getGreeting, getInvitationLine, getAlaturiLine, getDefaultIntroLong } from "@/utils/invitation-text";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import ScrollIndicator from "@/components/Ornaments/ScrollIndicator";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";
import { useSwiper } from "@/context/SwiperContext";

interface GuestData {
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  sex: "M" | "F" | null;
  partner: { nume: string; prenume: string } | null;
  children?: { id: number; nume: string; prenume: string }[];
}

function formatGuestNames(guest: GuestData): string {
  const childNames = guest.children && guest.children.length > 0
    ? guest.children.map((c) => c.prenume)
    : [];

  if (guest.partner) {
    const sameNume = guest.nume === guest.partner.nume;
    if (sameNume) {
      // Maria, Ionut si Darius Ionescu OR Testan și Testica Testulescu
      const allNames = [guest.prenume, guest.partner.prenume, ...childNames];
      const last = allNames.pop()!;
      return allNames.length > 0
        ? `${allNames.join(", ")} și ${last} ${guest.nume}`
        : `${last} ${guest.nume}`;
    } else {
      // Ion, Maria si Darius OR Ion și Maria
      const allNames = [guest.prenume, guest.partner.prenume, ...childNames];
      const last = allNames.pop()!;
      return allNames.length > 0
        ? `${allNames.join(", ")} și ${last}`
        : last;
    }
  }

  // Fara partener: Prenume Nume
  return `${guest.prenume} ${guest.nume}`;
}

export default function Hero({
  guest,
  settings,
}: {
  guest?: GuestData | null;
  settings?: WeddingSettings | null;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const nestedRef = useRef<SwiperType | null>(null);
  const parentSwiper = useSwiper();

  const couple = getCoupleNames(settings ?? null);
  const dateDisplay = settings?.ceremonie_data
    ? formatDate(settings.ceremonie_data)
    : "4 Iulie 2026";

  const initialMireasa = couple.mireasa.charAt(0).toUpperCase();
  const initialMire = couple.mire.charAt(0).toUpperCase();

  const audience = guest ? getInvitationAudience(Boolean(guest.plus_one && guest.partner), guest.sex ?? null) : null;
  const personalizedText = guest?.intro_long
    || (audience ? getDefaultIntroLong(audience) : "Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment.");
  const defaultText = "Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment unic.";

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Nested Swiper callback — control parent based on nested position
  const onNestedSwiper = useCallback((nested: SwiperType) => {
    nestedRef.current = nested;
    if (!parentSwiper) return;

    // Disable parent while nested is active on Hero slide
    if (parentSwiper.activeIndex === 0) {
      parentSwiper.disable();
    }

    // Intercept touch/wheel on nested's last slide:
    // - swipe forward (down) → hand off to parent
    // - swipe backward (up) → stay in nested (go back to slide 0)
    let touchStartY = 0;

    nested.el.addEventListener("touchstart", (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    nested.el.addEventListener("touchend", (e: TouchEvent) => {
      if (!nested.isEnd) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      // Swipe forward (finger moves up, deltaY > 0) on last slide → go to parent
      if (deltaY > 30) {
        parentSwiper.enable();
        parentSwiper.slideNext(800);
      }
    }, { passive: true });

    // Also handle mousewheel for desktop testing
    nested.el.addEventListener("wheel", (e: WheelEvent) => {
      if (!nested.isEnd) return;
      // Scroll down on last slide → go to parent
      if (e.deltaY > 0) {
        e.preventDefault();
        e.stopPropagation();
        parentSwiper.enable();
        parentSwiper.slideNext(800);
      }
    }, { capture: true, passive: false });
  }, [parentSwiper]);

  // When parent leaves Hero (goes to slide 1+), reset nested to slide 0.
  // When parent comes back to Hero, re-disable parent so nested controls scrolling.
  useEffect(() => {
    if (!parentSwiper || !isMobile) return;

    const onParentSlideChange = () => {
      const nested = nestedRef.current;
      if (!nested) return;

      if (parentSwiper.activeIndex === 0) {
        // Coming back to Hero — re-enable nested, disable parent
        nested.enable();
        nested.el.style.pointerEvents = "";
        parentSwiper.disable();
      } else {
        // Left Hero — reset nested to slide 0 for next visit
        nested.slideTo(0, 0);
      }
    };

    parentSwiper.on("slideChange", onParentSlideChange);
    return () => {
      parentSwiper.off("slideChange", onParentSlideChange);
    };
  }, [parentSwiper, isMobile]);

  return (
    <section className="content-section bg-background relative overflow-hidden">
      <SectionCorners size="w-[35px] h-[35px] sm:w-[55px] sm:h-[55px]" offset={16} />

      {/* ─── Mobile: static header + nested Swiper ─── */}
      {isMobile && (
        <div
          className={`absolute inset-0 flex flex-col items-center text-center transition-opacity duration-1000 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ paddingTop: "3.5rem" }}
        >
          {/* Static: Monogram + Heart + Date */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 160 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="72" className="stroke-button/40" strokeWidth="0.5" fill="none" />
              <circle cx="80" cy="80" r="68" className="stroke-button/25" strokeWidth="0.3" fill="none" />
              <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" className="fill-button/60" />
              <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" className="fill-button/60" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">{initialMireasa}</span>
              <span className="script-font text-lg text-button/80 italic">&amp;</span>
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">{initialMire}</span>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-center gap-3">
              <span className="block w-12 h-px bg-button/30" />
              <svg viewBox="0 0 50 48" className="w-6 h-6 text-button/60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
                <path d="M25,38 C25,38 8,27 8,16 C8,10 13,7 18,10 C21,12 25,16 25,16 C25,16 29,12 32,10 C37,7 42,10 42,16 C42,27 25,38 25,38 Z" strokeWidth="0.6" opacity="0.4" />
              </svg>
              <span className="block w-12 h-px bg-button/30" />
            </div>
            <p className="serif-font text-xl text-text-heading font-light mt-2 tracking-wide">{dateDisplay}</p>
          </div>

          {/* Nested Swiper — only the dynamic part */}
          <div className="flex-1 w-full overflow-hidden">
            <Swiper
              direction="vertical"
              modules={[Mousewheel]}
              mousewheel={{
                sensitivity: 1,
                forceToAxis: true,
                thresholdDelta: 10,
                thresholdTime: 300,
              }}
              touchEventsTarget="container"
              speed={500}
              slidesPerView={1}
              onSwiper={onNestedSwiper}
              style={{ height: "100%", overflow: "hidden" }}
            >
              {/* Phase 1: greeting + invitation */}
              <SwiperSlide>
                <div className="h-full flex flex-col items-center px-6">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {guest && audience && (
                      <>
                        <p className={`serif-font text-base italic text-text-muted mb-1 transition-all duration-700 ease-out delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                          {getGreeting(audience)}
                        </p>
                        <p className={`serif-font text-xl text-text-heading font-light mb-3 transition-all duration-700 ease-out delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                          {formatGuestNames(guest)}
                        </p>
                      </>
                    )}
                    <p className={`text-[0.6rem] tracking-[0.4em] uppercase text-button mb-3 font-medium mt-2 transition-all duration-700 ease-out delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                      {audience ? getInvitationLine(audience) : "Cu drag vă invităm"}
                    </p>
                    <h2 className={`serif-font text-xl font-light italic text-text-heading leading-relaxed transition-all duration-700 ease-out delay-[900ms] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                      {audience ? getAlaturiLine(audience) : "Să fiți alături de noi"}
                    </h2>
                  </div>
                  <SectionFooterNav settings={settings} />
                </div>
              </SwiperSlide>

              {/* Phase 2: personalized message */}
              <SwiperSlide>
                <div className="h-full flex flex-col items-center px-6">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="body-font text-[0.85rem] leading-[1.9] text-foreground max-w-md mx-auto px-2">
                      {guest ? personalizedText : defaultText}
                    </p>
                  </div>
                  <SectionFooterNav settings={settings} />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      )}

      {/* ─── Desktop ─── */}
      <div
        className={`hidden sm:flex max-w-lg mx-auto text-center flex-1 flex-col items-center justify-center transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className={`relative mb-10 transition-all duration-1000 delay-300 ease-out ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 160 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="72" className="stroke-button/40" strokeWidth="0.5" fill="none" />
              <circle cx="80" cy="80" r="68" className="stroke-button/25" strokeWidth="0.3" fill="none" />
              <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" className="fill-button/60" />
              <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" className="fill-button/60" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">{initialMireasa}</span>
              <span className="script-font text-lg text-button/80 italic">&amp;</span>
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">{initialMire}</span>
            </div>
          </div>
        </div>

        {guest && audience && (
          <div className="mb-6">
            <p className="serif-font text-lg italic text-text-muted mb-1">
              {getGreeting(audience)}
            </p>
            <p className="serif-font text-2xl text-text-heading font-light">
              {formatGuestNames(guest)}
            </p>
          </div>
        )}

        <div className={`transition-all duration-1000 delay-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[0.6rem] tracking-[0.4em] uppercase text-button mb-5 font-medium">{audience ? getInvitationLine(audience) : "Cu drag vă invităm"}</p>
          <h2 className="serif-font text-2xl md:text-[1.7rem] font-light italic text-text-heading leading-relaxed mb-6">{audience ? getAlaturiLine(audience) : "Să fiți alături de noi"}</h2>
          <SmallFlourish className="mx-auto my-6" />
          <p className="body-font text-[0.95rem] leading-[1.9] text-foreground mt-6 max-w-md mx-auto">
            {guest ? personalizedText : defaultText}
          </p>
        </div>
      </div>

      {/* Footer — outside the centered content container */}
      <div className={`hidden sm:block w-full transition-all duration-1000 delay-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <SectionFooterNav settings={settings} />
      </div>
    </section>
  );
}
