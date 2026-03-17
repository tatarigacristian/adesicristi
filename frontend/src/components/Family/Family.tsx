"use client";

import { WeddingSettings } from "@/utils/settings";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
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

  // Parents
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
      <div className="section-content max-w-md px-6">
        <div className="flex flex-col items-center w-full gap-6 sm:gap-10">

          {/* Nasi */}
          {hasNasi && (
            <div className="text-center">
              <p className="text-[0.55rem] tracking-[0.2em] uppercase text-text-muted mb-2">
                Împreună cu nașii
              </p>
              <p className="script-font text-2xl sm:text-3xl text-text-heading">
                {nasNume}
              </p>
            </div>
          )}

          {/* Divider */}
          {hasNasi && hasParinti && (
            <div className="flex items-center gap-3 w-full max-w-[200px]">
              <span className="flex-1 h-px bg-button/15" />
              <svg viewBox="0 0 50 48" className="w-4 h-4 text-button/30" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
              </svg>
              <span className="flex-1 h-px bg-button/15" />
            </div>
          )}

          {/* Parinti */}
          {hasParinti && (
            <div className="text-center">
              <p className="text-[0.55rem] tracking-[0.2em] uppercase text-text-muted mb-2">
                Dragii noștri părinți
              </p>
              {parintiMireasa && (
                <p className="script-font text-2xl sm:text-3xl text-text-heading leading-relaxed">
                  {parintiMireasa}
                </p>
              )}
              {parintiMire && (
                <p className="script-font text-2xl sm:text-3xl text-text-heading leading-relaxed mt-1">
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
