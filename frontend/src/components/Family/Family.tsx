"use client";

import { WeddingSettings } from "@/utils/settings";
import Flourish from "@/components/Ornaments/Flourish";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import ScrollIndicator from "@/components/Ornaments/ScrollIndicator";

export default function Family({
  settings,
}: {
  settings?: WeddingSettings | null;
}) {
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
      className="content-section bg-background"
    >
      {/* Header */}
      <div className="section-header">
        <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
          Familie
        </h2>
        <SmallFlourish className="mx-auto" />
      </div>

      {/* Content */}
      <div className="section-content max-w-lg px-4">
        <div className="flex flex-col gap-2 sm:gap-4 w-full">
          {/* Nasi */}
          {hasNasi && (
            <div className="family-card !py-3 sm:!py-4 text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-1 sm:mb-2">
                <svg viewBox="0 0 48 28" className="w-8 h-5 sm:w-14 sm:h-8 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="15" r="10" strokeWidth="1.2" />
                  <circle cx="31" cy="15" r="10" strokeWidth="1.2" />
                  <path d="M17 3 L15.5 0.5 L17 2 L18.5 0.5 Z" fill="currentColor" opacity="0.5" />
                  <circle cx="17" cy="15" r="6.5" strokeWidth="0.5" opacity="0.3" />
                  <circle cx="31" cy="15" r="6.5" strokeWidth="0.5" opacity="0.3" />
                </svg>
              </div>
              <h3 className="text-[0.65rem] tracking-[0.3em] uppercase text-text-heading font-semibold mb-1">
                Împreună cu nașii
              </h3>
              <p className="script-font text-xl sm:text-2xl text-text-heading">
                {nasNume}
              </p>
            </div>
          )}

          {/* Flourish separator between cards */}
          {hasNasi && hasParinti && (
            <Flourish size="sm" className="mx-auto" />
          )}

          {/* Parinti */}
          {hasParinti && (
            <div className="family-card !py-3 sm:!py-4 text-center relative">
              <SectionCorners size="w-[25px] h-[25px]" offset={10} />
              <div className="text-button mb-1 sm:mb-2">
                <svg viewBox="0 0 50 48" className="w-7 h-7 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
                  <path d="M25,38 C25,38 8,27 8,16 C8,10 13,7 18,10 C21,12 25,16 25,16 C25,16 29,12 32,10 C37,7 42,10 42,16 C42,27 25,38 25,38 Z" strokeWidth="0.6" opacity="0.4" />
                </svg>
              </div>
              <h3 className="text-[0.65rem] tracking-[0.3em] uppercase text-text-heading font-semibold mb-1">
                Dragii noștri părinți
              </h3>
              {parintiMireasa && (
                <p className="script-font text-xl sm:text-2xl text-text-heading leading-relaxed">
                  {parintiMireasa}
                </p>
              )}
              {parintiMire && (
                <p className="script-font text-xl sm:text-2xl text-text-heading leading-relaxed mt-0.5">
                  {parintiMire}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="section-footer">
        <ScrollIndicator className="mx-auto" />
      </div>
    </section>
  );
}
