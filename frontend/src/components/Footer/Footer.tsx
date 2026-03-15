"use client";

import Flourish from "@/components/Ornaments/Flourish";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";

export default function Footer({ settings }: { settings?: WeddingSettings | null }) {
  const couple = getCoupleNames(settings ?? null);

  return (
    <section className="snap-section content-section bg-background-soft min-h-[50vh]">
      <div className="relative text-center px-8 py-10 glass-card">
        <SectionCorners size="w-[30px] h-[30px]" offset={0} />

        <SmallFlourish className="mx-auto mb-6" />

        <p className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-4">
          Vă mulțumim din suflet
        </p>

        <p className="script-font text-4xl text-text-heading mb-4">
          {couple.display}
        </p>

        <Flourish size="sm" className="mx-auto mt-4" />
      </div>
    </section>
  );
}
