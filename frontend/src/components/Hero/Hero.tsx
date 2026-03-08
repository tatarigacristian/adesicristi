"use client";

import { useEffect, useState } from "react";

interface GuestData {
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro: string | null;
  partner: { nume: string; prenume: string } | null;
}

export default function Hero({ guest }: { guest?: GuestData | null }) {
  const [isVisible, setIsVisible] = useState(false);

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
      {/* Subtle decorative corner ornaments */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-accent/30 rounded-tl-sm" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-accent/30 rounded-tr-sm" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-accent/30 rounded-bl-sm" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-accent/30 rounded-br-sm" />

      <div
        className={`max-w-lg mx-auto text-center transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Mobile-only hero info (hidden on desktop where sidebar shows it) */}
        <div className="lg:hidden mb-10">
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-accent font-medium mb-4">
            Ne casatorim!
          </p>
          <h1 className="script-font text-5xl text-text-heading mb-5 leading-tight">
            Ade & Cristi
          </h1>
          <div className="elegant-divider">
            <span></span>
            <span className="heart-icon">&#9829;</span>
            <span></span>
          </div>
          <p className="serif-font text-xl text-text-heading font-light mt-3 tracking-wide">
            4 Iulie 2026
          </p>
        </div>

        {/* Monogram */}
        <div
          className={`relative mb-10 transition-all duration-1000 delay-300 ease-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="monogram-ring w-32 h-32 mx-auto rounded-full flex items-center justify-center">
            <div className="w-[7rem] h-[7rem] rounded-full border border-accent/30 flex items-center justify-center bg-background">
              <span className="script-font text-4xl text-accent tracking-wide">
                A <span className="serif-font text-lg text-accent/60 italic">&</span> C
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
          <p className="text-[0.6rem] tracking-[0.4em] uppercase text-accent/80 mb-5 font-medium">
            Cu drag va invitam
          </p>

          <h2 className="serif-font text-2xl md:text-[1.7rem] font-light italic text-text-heading leading-relaxed mb-6">
            Sa petreceti alaturi de noi
            <br />
            cel mai important moment
            <br />
            din viata noastra
          </h2>

          <div className="flex items-center justify-center gap-4 my-6">
            <span className="block w-12 h-px bg-gradient-to-r from-transparent to-accent/40" />
            <svg
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
              className="text-accent-rose/60"
            >
              <path
                d="M8 14L1.2 7.2C-0.4 5.6-0.4 3 1.2 1.4C2.8-0.2 5.4-0.2 7 1.4L8 2.4L9 1.4C10.6-0.2 13.2-0.2 14.8 1.4C16.4 3 16.4 5.6 14.8 7.2L8 14Z"
                fill="currentColor"
              />
            </svg>
            <span className="block w-12 h-px bg-gradient-to-l from-transparent to-accent/40" />
          </div>

          <p className="serif-font text-[0.95rem] leading-[1.9] text-foreground/75 mt-6 max-w-md mx-auto">
            {guest ? (
              <>
                Dragii nostri {guest.prenume} {guest.nume}
                {guest.partner && <> si {guest.partner.prenume} {guest.partner.nume}</>}
                , cu bucurie in suflet va anuntam ca ne casatorim!
                {guest.intro ? (
                  <> {guest.intro}</>
                ) : (
                  <> Ne-ar face o deosebita placere sa fiti alaturi de noi in aceasta zi speciala, sa impartasim impreuna emotia si fericirea acestui moment unic.</>
                )}
              </>
            ) : (
              <>
                Dragii nostri, cu bucurie in suflet va anuntam ca ne casatorim!
                Ne-ar face o deosebita placere sa fiti alaturi de noi in aceasta zi
                speciala, sa impartasim impreuna emotia si fericirea acestui moment
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
            <span className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted group-hover:text-accent transition-colors duration-300">
              Descopera mai mult
            </span>
            <svg
              width="20"
              height="12"
              viewBox="0 0 20 12"
              fill="none"
              className="scroll-arrow text-accent/50 group-hover:text-accent transition-colors duration-300"
            >
              <path d="M2 2L10 10L18 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
