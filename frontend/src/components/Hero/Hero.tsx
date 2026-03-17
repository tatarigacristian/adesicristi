"use client";

import { useEffect, useState, useCallback } from "react";
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
    if (!parentSwiper) return;

    console.log("[Hero] Nested init. Parent activeIndex:", parentSwiper.activeIndex, "Parent enabled:", parentSwiper.enabled);

    // Fully disable parent so it doesn't capture any touch/wheel events
    if (parentSwiper.activeIndex === 0) {
      console.log("[Hero] Disabling parent completely");
      parentSwiper.disable();
    }

    // Ignore reachEnd during init
    let initialized = false;
    setTimeout(() => {
      initialized = true;
      console.log("[Hero] Nested ready. activeIndex:", nested.activeIndex);
      // Re-disable parent in case reachEnd during init re-enabled it
      if (parentSwiper.activeIndex === 0 && nested.activeIndex === 0) {
        console.log("[Hero] Re-disabling parent after init");
        parentSwiper.disable();
      }
    }, 300);

    nested.on("slideChange", () => {
      if (!initialized) return;
      console.log("[Hero] Nested slideChange → index:", nested.activeIndex, "isEnd:", nested.isEnd);
      if (nested.isEnd) {
        console.log("[Hero] Nested at end → disabling nested, enabling parent");
        nested.disable();
        nested.el.style.pointerEvents = "none";
        parentSwiper.enable();
        console.log("[Hero] Parent enabled:", parentSwiper.enabled);
      }
    });

    nested.on("reachEnd", () => {
      if (!initialized) return;
      console.log("[Hero] Nested reachEnd → disabling nested, enabling parent");
      nested.disable();
      nested.el.style.pointerEvents = "none";
      parentSwiper.enable();
    });
  }, [parentSwiper]);

  // Re-block parent when navigating back to Hero slide
  useEffect(() => {
    if (!parentSwiper || !isMobile) return;

    const onParentSlideChange = () => {
      console.log("[Hero] Parent slideChange → activeIndex:", parentSwiper.activeIndex);
      // No re-blocking needed — once nested is done, parent stays enabled
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
                        <p className="serif-font text-base italic text-text-muted mb-1">
                          {getGreeting(audience)}
                        </p>
                        <p className="serif-font text-xl text-text-heading font-light mb-3">
                          {guest.partner
                            ? guest.nume === guest.partner.nume
                              ? `${guest.prenume} și ${guest.partner.prenume} ${guest.nume}`
                              : `${guest.prenume} ${guest.nume} și ${guest.partner.prenume} ${guest.partner.nume}`
                            : `${guest.prenume} ${guest.nume}`}
                        </p>
                      </>
                    )}
                    <p className="text-[0.6rem] tracking-[0.4em] uppercase text-button mb-3 font-medium mt-2">
                      {audience ? getInvitationLine(audience) : "Cu drag vă invităm"}
                    </p>
                    <h2 className="serif-font text-xl font-light italic text-text-heading leading-relaxed">
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
                    <p className="serif-font text-[0.85rem] leading-[1.8] text-foreground max-w-md mx-auto px-2">
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
              {guest.partner
                ? guest.nume === guest.partner.nume
                  ? `${guest.prenume} și ${guest.partner.prenume} ${guest.nume}`
                  : `${guest.prenume} ${guest.nume} și ${guest.partner.prenume} ${guest.partner.nume}`
                : `${guest.prenume} ${guest.nume}`}
            </p>
          </div>
        )}

        <div className={`transition-all duration-1000 delay-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[0.6rem] tracking-[0.4em] uppercase text-button mb-5 font-medium">{audience ? getInvitationLine(audience) : "Cu drag vă invităm"}</p>
          <h2 className="serif-font text-2xl md:text-[1.7rem] font-light italic text-text-heading leading-relaxed mb-6">{audience ? getAlaturiLine(audience) : "Să fiți alături de noi"}</h2>
          <SmallFlourish className="mx-auto my-6" />
          <p className="serif-font text-[0.95rem] leading-[1.9] text-foreground mt-6 max-w-md mx-auto">
            {guest ? personalizedText : defaultText}
          </p>
        </div>
      </div>

      {/* Footer — outside the centered content container */}
      <div className={`hidden sm:block transition-all duration-1000 delay-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <SectionFooterNav settings={settings} />
      </div>
    </section>
  );
}
