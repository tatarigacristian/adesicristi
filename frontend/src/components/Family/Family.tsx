"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings } from "@/utils/settings";
import Flourish from "@/components/Ornaments/Flourish";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import SectionCorners from "@/components/Ornaments/SectionCorners";

export default function Family({
  settings,
}: {
  settings?: WeddingSettings | null;
}) {
  const ref = useScrollAnimation<HTMLElement>();

  // Nasi
  const nasNume = settings?.nas_prenume && settings?.nasa_prenume
    ? settings.nasa_nume === settings.nas_nume
      ? `${settings.nasa_prenume} & ${settings.nas_prenume} ${settings.nas_nume}`
      : `${settings.nasa_prenume} ${settings.nasa_nume} & ${settings.nas_prenume} ${settings.nas_nume}`
    : null;

  // Parents - use structured fields first, fallback to free text
  const parintiMireasa = settings?.tata_mireasa_prenume
    ? `${settings.mama_mireasa_prenume} & ${settings.tata_mireasa_prenume} ${settings.tata_mireasa_nume}`
    : settings?.parinti_mireasa || null;

  const parintiMire = settings?.tata_mire_prenume
    ? `${settings.mama_mire_prenume} & ${settings.tata_mire_prenume} ${settings.tata_mire_nume}`
    : settings?.parinti_mire || null;

  const hasNasi = !!nasNume;
  const hasParinti = !!parintiMireasa || !!parintiMire;

  if (!hasNasi && !hasParinti) return null;

  return (
    <section
      id="family"
      ref={ref}
      className="content-section bg-background animate-on-scroll"
    >
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col sm:block">
        {/* Section header */}
        <div className="text-center mb-2 sm:mb-10">
          <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
            Familie
          </h2>
          <SmallFlourish className="mx-auto mb-[30px] sm:mb-0" />
        </div>

        <div className="flex flex-col gap-3 sm:gap-6 mt-auto sm:mt-0">
          {/* Nasi */}
          {hasNasi && (
            <div className="family-card text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-1 sm:mb-4">
                <svg viewBox="0 0 48 28" className="w-10 h-6 sm:w-14 sm:h-8 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="15" r="10" strokeWidth="1.2" />
                  <circle cx="31" cy="15" r="10" strokeWidth="1.2" />
                  <path d="M17 3 L15.5 0.5 L17 2 L18.5 0.5 Z" fill="currentColor" opacity="0.5" />
                  <circle cx="17" cy="15" r="6.5" strokeWidth="0.5" opacity="0.3" />
                  <circle cx="31" cy="15" r="6.5" strokeWidth="0.5" opacity="0.3" />
                </svg>
              </div>
              <h3 className="text-[0.7rem] tracking-[0.3em] uppercase text-text-heading font-semibold mb-2">
                Împreună cu nașii
              </h3>
              <Flourish size="sm" className="mx-auto mb-2" />
              <p className="script-font text-2xl text-text-heading">
                {nasNume}
              </p>
            </div>
          )}

          {/* Separator */}
          {hasNasi && hasParinti && (
            <div className="flex items-center justify-center gap-4">
              <span className="block flex-1 max-w-[60px] h-px bg-button/20" />
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className="text-button flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 19C13.8 20.8 12 21.5 10 21.5C7.2 21.5 5 19.8 5 17.2C5 14.8 6.8 13.2 9 11.5C7.5 9.8 6.2 8.2 6.2 6.2C6.2 3.8 8 2 10.2 2C12.4 2 14 3.6 14 5.8C14 7.8 12.5 9.2 10.5 10.5L14.2 14.8C14.8 13.6 15.2 12.2 15.2 10.8H17.2C17.2 12.8 16.5 14.8 15.5 16.5L18 19.2H15.5Z" fill="currentColor" fillOpacity="0.7" />
              </svg>
              <span className="block flex-1 max-w-[60px] h-px bg-button/20" />
            </div>
          )}

          {/* Parinti */}
          {hasParinti && (
            <div className="family-card text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-1 sm:mb-4">
                <svg viewBox="0 0 50 48" className="w-8 h-8 sm:w-14 sm:h-14 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
                  <path d="M25,38 C25,38 8,27 8,16 C8,10 13,7 18,10 C21,12 25,16 25,16 C25,16 29,12 32,10 C37,7 42,10 42,16 C42,27 25,38 25,38 Z" strokeWidth="0.6" opacity="0.4" />
                  <path d="M20 4 Q22 1, 25 2 Q28 1, 30 4" strokeWidth="0.6" opacity="0.5" />
                  <circle cx="21" cy="3" r="0.6" fill="currentColor" opacity="0.4" />
                  <circle cx="29" cy="3" r="0.6" fill="currentColor" opacity="0.4" />
                </svg>
              </div>
              <h3 className="text-[0.7rem] tracking-[0.3em] uppercase text-text-heading font-semibold mb-2">
                Dragii noștri părinți
              </h3>
              <Flourish size="sm" className="mx-auto mb-2" />
              {parintiMireasa && (
                <p className="script-font text-2xl text-text-heading leading-relaxed">
                  {parintiMireasa}
                </p>
              )}
              {parintiMire && (
                <p className="script-font text-2xl text-text-heading leading-relaxed mt-1">
                  {parintiMire}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
