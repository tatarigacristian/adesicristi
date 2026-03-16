"use client";

import Flourish from "@/components/Ornaments/Flourish";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";

export default function Footer({ settings }: { settings?: WeddingSettings | null }) {
  const couple = getCoupleNames(settings ?? null);

  return (
    <section className="snap-section content-section bg-background-soft min-h-[50vh]">
      <div className="relative text-center px-8 py-16 sm:py-20 glass-card max-w-lg mx-auto w-full">
        <SectionCorners size="w-[25px] h-[25px]" offset={10} />

        <p className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-4">
          Vă mulțumim din suflet
        </p>

        <Flourish size="sm" className="mx-auto mb-6" />

        <p className="script-font text-4xl text-text-heading mb-6">
          {couple.display}
        </p>

        <Flourish size="sm" className="mx-auto" />
      </div>
    </section>
  );
}
