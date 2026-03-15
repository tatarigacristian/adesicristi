"use client";

import { useEffect, useState } from "react";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";
import SectionCorners from "@/components/Ornaments/SectionCorners";

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

  const handleClick = () => {
    const target = document.getElementById("couple");
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="snap-section content-section bg-background relative overflow-hidden">
      {/* Corner ornaments */}
      <SectionCorners size="w-[40px] h-[40px] sm:w-[55px] sm:h-[55px]" offset={8} />

      <div
        className={`max-w-lg mx-auto text-center transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Mobile-only hero info */}
        <div className="lg:hidden mb-6 sm:mb-10">
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-button font-medium mb-3">
            Ne căsătorim!
          </p>
          <h1 className="script-font text-4xl sm:text-5xl text-text-heading mb-4 leading-tight">
            {couple.display}
          </h1>
          <div className="elegant-divider">
            <span></span>
            <span className="heart-icon">&#9829;</span>
            <span></span>
          </div>
          <p className="serif-font text-xl text-text-heading font-light mt-2 tracking-wide">
            {dateDisplay}
          </p>
        </div>

        {/* Monogram */}
        <div
          className={`relative mb-6 sm:mb-10 transition-all duration-1000 delay-300 ease-out ${
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
            Să petreceți alături de noi
            <br />
            cel mai important moment
            <br />
            din viața noastră
          </h2>

          <div className="flex items-center justify-center gap-4 my-3 sm:my-6">
            <span className="block w-12 h-px bg-gradient-to-r from-transparent to-button/40" />
            <svg
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
              className="text-button/80"
            >
              <path
                d="M8 14L1.2 7.2C-0.4 5.6-0.4 3 1.2 1.4C2.8-0.2 5.4-0.2 7 1.4L8 2.4L9 1.4C10.6-0.2 13.2-0.2 14.8 1.4C16.4 3 16.4 5.6 14.8 7.2L8 14Z"
                fill="currentColor"
              />
            </svg>
            <span className="block w-12 h-px bg-gradient-to-l from-transparent to-button/40" />
          </div>

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
            onClick={handleClick}
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
