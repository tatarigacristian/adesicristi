"use client";

import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";

export default function Footer({ settings }: { settings?: WeddingSettings | null }) {
  const couple = getCoupleNames(settings ?? null);
  const initialMireasa = couple.mireasa.charAt(0).toUpperCase();
  const initialMire = couple.mire.charAt(0).toUpperCase();

  return (
    <section className="content-section bg-background-soft">
      {/* Header */}
      <div className="section-header">
        <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
          Vă mulțumim din suflet
        </h2>
        <SmallFlourish className="mx-auto" />
      </div>

      {/* Content — Monogram */}
      <div className="section-content">
        <div className="relative w-36 h-36">
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

      {/* Footer */}
      <SectionFooterNav settings={settings} />
    </section>
  );
}
