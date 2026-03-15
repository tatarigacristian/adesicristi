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
      className="snap-section content-section bg-background animate-on-scroll"
    >
      <div className="max-w-lg mx-auto w-full">
        {/* Section header */}
        <div className="text-center mb-2 sm:mb-10">
          <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
            Familie
          </h2>
          <SmallFlourish className="mx-auto" />
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Nasi */}
          {hasNasi && (
            <div className="family-card text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-2 sm:mb-4">
                <svg viewBox="0 0 80 50" className="w-10 h-10 sm:w-14 sm:h-14 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="28" cy="27" rx="14" ry="16" strokeWidth="1.2" />
                  <ellipse cx="52" cy="27" rx="14" ry="16" strokeWidth="1.2" />
                  <ellipse cx="28" cy="27" rx="10" ry="12" strokeWidth="0.5" opacity="0.4" />
                  <ellipse cx="52" cy="27" rx="10" ry="12" strokeWidth="0.5" opacity="0.4" />
                  <path d="M28 8 L26 3 L28 5 L30 3 Z" fill="currentColor" opacity="0.6" />
                  <path d="M52 8 L50 3 L52 5 L54 3 Z" fill="currentColor" opacity="0.6" />
                  <circle cx="28" cy="11" r="1" fill="currentColor" opacity="0.5" />
                  <circle cx="52" cy="11" r="1" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
                Împreună cu nașii
              </h3>
              <Flourish size="sm" className="mx-auto mb-4" />
              <p className="script-font text-2xl text-text-heading">
                {nasNume}
              </p>
            </div>
          )}

          {/* Parinti */}
          {hasParinti && (
            <div className="family-card text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-2 sm:mb-4">
                <svg viewBox="0 0 50 48" className="w-10 h-10 sm:w-14 sm:h-14 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
                  <path d="M25,38 C25,38 8,27 8,16 C8,10 13,7 18,10 C21,12 25,16 25,16 C25,16 29,12 32,10 C37,7 42,10 42,16 C42,27 25,38 25,38 Z" strokeWidth="0.6" opacity="0.4" />
                  <path d="M20 4 Q22 1, 25 2 Q28 1, 30 4" strokeWidth="0.6" opacity="0.5" />
                  <circle cx="21" cy="3" r="0.6" fill="currentColor" opacity="0.4" />
                  <circle cx="29" cy="3" r="0.6" fill="currentColor" opacity="0.4" />
                </svg>
              </div>
              <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
                Dragii noștri părinți
              </h3>
              <Flourish size="sm" className="mx-auto mb-4" />
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
