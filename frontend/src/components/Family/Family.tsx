"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings } from "@/utils/settings";

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
        <div className="flex flex-col gap-6">
          {/* Nasi */}
          {hasNasi && (
            <div className="family-card text-center">
              <div className="text-button mb-4">
                <svg viewBox="0 0 60 50" className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="22" cy="25" rx="14" ry="16"/>
                  <ellipse cx="38" cy="25" rx="14" ry="16"/>
                </svg>
              </div>
              <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
                Împreună cu nașii
              </h3>
              <div className="w-8 h-px bg-button/40 mx-auto mb-4"></div>
              <p className="script-font text-2xl text-text-heading">
                {nasNume}
              </p>
            </div>
          )}

          {/* Parinti */}
          {hasParinti && (
            <div className="family-card text-center">
              <div className="text-button mb-4">
                <svg viewBox="0 0 50 45" className="w-12 h-12 mx-auto" fill="currentColor" stroke="none">
                  <path d="M25,40 C25,40 5,28 5,15 C5,8 12,4 19,8 C22,10 25,14 25,14 C25,14 28,10 31,8 C38,4 45,8 45,15 C45,28 25,40 25,40 Z" opacity="0.7"/>
                </svg>
              </div>
              <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
                Dragii noștri părinți
              </h3>
              <div className="w-8 h-px bg-button/40 mx-auto mb-4"></div>
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
