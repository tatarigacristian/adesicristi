"use client";

import { useEffect, useState } from "react";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import { useSlideTo } from "@/context/SwiperContext";

interface GuestData {
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
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
  const slideTo = useSlideTo();

  const couple = getCoupleNames(settings ?? null);
  const dateDisplay = settings?.ceremonie_data
    ? formatDate(settings.ceremonie_data)
    : "4 Iulie 2026";

  // Initials for monogram
  const initialMireasa = couple.mireasa.charAt(0).toUpperCase();
  const initialMire = couple.mire.charAt(0).toUpperCase();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="content-section bg-background relative overflow-hidden">
      {/* Corner ornaments */}
      <SectionCorners size="w-[35px] h-[35px] sm:w-[55px] sm:h-[55px]" offset={16} />

      <div
        className={`max-w-lg mx-auto text-center transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >

        {/* Monogram */}
        <div
          className={`relative mb-4 sm:mb-10 transition-all duration-1000 delay-300 ease-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 160 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="72" className="stroke-button/40" strokeWidth="0.5" fill="none" />
              <circle cx="80" cy="80" r="68" className="stroke-button/25" strokeWidth="0.3" fill="none" />
              <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" className="fill-button/60" />
              <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" className="fill-button/60" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">
                {initialMireasa}
              </span>
              <span className="script-font text-lg text-button/80 italic">&amp;</span>
              <span className="serif-font text-[2.2rem] font-light text-text-heading tracking-wide">
                {initialMire}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: heart divider + date after monogram */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-center gap-3">
            <span className="block w-12 h-px bg-button/30" />
            <svg viewBox="0 0 50 48" className="w-6 h-6 text-button/60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
              <path d="M25,38 C25,38 8,27 8,16 C8,10 13,7 18,10 C21,12 25,16 25,16 C25,16 29,12 32,10 C37,7 42,10 42,16 C42,27 25,38 25,38 Z" strokeWidth="0.6" opacity="0.4" />
            </svg>
            <span className="block w-12 h-px bg-button/30" />
          </div>
          <p className="serif-font text-xl text-text-heading font-light mt-2 tracking-wide">
            {dateDisplay}
          </p>
        </div>

        {/* Invitation text */}
        <div
          className={`transition-all duration-1000 delay-500 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-[0.6rem] tracking-[0.4em] uppercase text-button mb-3 sm:mb-5 font-medium">
            Cu drag vă invităm
          </p>

          <h2 className="serif-font text-xl sm:text-2xl md:text-[1.7rem] font-light italic text-text-heading leading-relaxed mb-4 sm:mb-6">
            Să fiți alături de noi
          </h2>

          <SmallFlourish className="mx-auto my-3 sm:my-6" />

          <p className="serif-font text-[0.85rem] sm:text-[0.95rem] leading-[1.8] sm:leading-[1.9] text-foreground mt-4 sm:mt-6 max-w-md mx-auto">
            {guest ? (
              <>
                {guest.intro_long ? (
                  <>{guest.intro_long}</>
                ) : (
                  <>Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment.</>
                )}
              </>
            ) : (
              <>
                Ne-ar face o deosebită plăcere să fiți alături de noi în această zi
                specială, să împărtășim împreună emoția și fericirea acestui moment
                unic.
              </>
            )}
          </p>
        </div>

        {/* Scroll hint */}
        <div
          className={`mt-6 sm:mt-14 transition-all duration-1000 delay-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={() => slideTo("couple")}
            className="group cursor-pointer inline-flex flex-col items-center gap-2"
            aria-label="Scroll down"
          >
            <span className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted group-hover:text-button transition-colors duration-300">
              Descoperă mai mult
            </span>
            <svg
              width="20"
              height="12"
              viewBox="0 0 20 12"
              fill="none"
              className="scroll-arrow text-button/70 group-hover:text-button transition-colors duration-300"
            >
              <path d="M2 2L10 10L18 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
