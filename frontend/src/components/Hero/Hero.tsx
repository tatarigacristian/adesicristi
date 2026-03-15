"use client";

import { useEffect, useState } from "react";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";

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
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-button/30 rounded-tl-sm" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-button/30 rounded-tr-sm" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-button/30 rounded-bl-sm" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-button/30 rounded-br-sm" />

      <div
        className={`max-w-lg mx-auto text-center transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Mobile-only hero info */}
        <div className="lg:hidden mb-10">
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-button font-medium mb-4">
            Ne căsătorim!
          </p>
          <h1 className="script-font text-5xl text-text-heading mb-5 leading-tight">
            {couple.display}
          </h1>
          <div className="elegant-divider">
            <span></span>
            <span className="heart-icon">&#9829;</span>
            <span></span>
          </div>
          <p className="serif-font text-xl text-text-heading font-light mt-3 tracking-wide">
            {dateDisplay}
          </p>
        </div>

        {/* Monogram */}
        <div
          className={`relative mb-10 transition-all duration-1000 delay-300 ease-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="monogram-ring w-32 h-32 mx-auto rounded-full flex items-center justify-center">
            <div className="w-[7rem] h-[7rem] rounded-full border border-button/30 flex items-center justify-center bg-background">
              <span className="script-font text-4xl text-button tracking-wide">
                {initialMireasa} <span className="serif-font text-lg text-button/80 italic">&</span> {initialMire}
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
          <p className="text-[0.6rem] tracking-[0.4em] uppercase text-button mb-5 font-medium">
            Cu drag vă invităm
          </p>

          <h2 className="serif-font text-2xl md:text-[1.7rem] font-light italic text-text-heading leading-relaxed mb-6">
            Să petreceți alături de noi
            <br />
            cel mai important moment
            <br />
            din viața noastră
          </h2>

          <div className="flex items-center justify-center gap-4 my-6">
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

          <p className="serif-font text-[0.95rem] leading-[1.9] text-foreground mt-6 max-w-md mx-auto">
            {guest ? (
              <>
                {guest.intro_long ? (
                  <>{guest.intro_long}</>
                ) : (
                  <>Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment unic.</>
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
          className={`mt-14 transition-all duration-1000 delay-700 ease-out ${
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
