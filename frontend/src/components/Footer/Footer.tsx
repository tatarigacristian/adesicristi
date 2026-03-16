"use client";

import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";

export default function Footer({ settings }: { settings?: WeddingSettings | null }) {
  const couple = getCoupleNames(settings ?? null);

  return (
    <section className="content-section bg-background-soft">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col sm:block">
        {/* Section header */}
        <div className="text-center mb-2 sm:mb-10">
          <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
            Vă mulțumim din suflet
          </h2>
          <SmallFlourish className="mx-auto mb-[30px] sm:mb-0" />
        </div>

        {/* Names at bottom */}
        <div className="text-center mt-auto sm:mt-0">
          <p className="script-font text-5xl text-text-heading">
            {couple.display}
          </p>
        </div>
      </div>
    </section>
  );
}
