"use client";

import { useState, useEffect, useCallback } from "react";
import Countdown from "../Countdown/Countdown";
import { WeddingSettings, getCoupleNames, formatDate, getWeddingDateISO } from "@/utils/settings";
import Flourish from "@/components/Ornaments/Flourish";
import { useSwiper, useSlideTo, SLIDE_IDS } from "@/context/SwiperContext";
import { MapPin } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { label: "Noi doi", sectionId: "couple" },
  { label: "Familie", sectionId: "family" },
  { label: "Locatii", sectionId: "locations" },
  { label: "Confirma prezenta", sectionId: "rsvp" },
  { label: "Multumim", sectionId: "footer" },
];

export default function Sidebar({ settings, hasGuest }: { settings?: WeddingSettings | null; hasGuest?: boolean }) {
  const [activeSection, setActiveSection] = useState("");
  const swiper = useSwiper();
  const slideTo = useSlideTo();

  const couple = getCoupleNames(settings ?? null);
  const weddingDateISO = getWeddingDateISO(settings ?? null);
  const dateDisplay = settings?.ceremonie_data
    ? formatDate(settings.ceremonie_data)
    : "4 Iulie 2026";

  // Track active slide
  const handleSlideChange = useCallback(() => {
    if (swiper) {
      const id = SLIDE_IDS[swiper.activeIndex];
      if (id) setActiveSection(id);
    }
  }, [swiper]);

  useEffect(() => {
    if (!swiper) return;
    swiper.on("slideChange", handleSlideChange);
    handleSlideChange();
    return () => { swiper.off("slideChange", handleSlideChange); };
  }, [swiper, handleSlideChange]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, sectionId: string) => {
    e.preventDefault();
    slideTo(sectionId);
  };

  return (
    <aside className="left-panel">
      <div className="flex flex-col items-center text-center px-8 w-full">
        <p className="text-[0.8rem] tracking-[0.35em] uppercase text-button serif-font font-medium mb-2 short:mb-1">
          Ne căsătorim!
        </p>

        <h1 className="script-font text-6xl xl:text-7xl short:text-5xl text-text-heading mb-4 short:mb-2 leading-tight">
          {couple.display}
        </h1>

        <Flourish size="sm" className="mb-4 short:mb-2" />

        <p className="serif-font text-2xl short:text-xl text-text-heading font-light tracking-wide mb-2 short:mb-1">
          {dateDisplay}
        </p>

        <div className="flex flex-col items-center gap-0.5 text-button mb-8 short:mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} weight="duotone" />
            <span className="serif-font text-sm">Iasi</span>
          </div>
        </div>

        <div className="w-full max-w-xs mb-10 short:mb-4">
          <Countdown variant="sidebar" weddingDateISO={weddingDateISO} />
        </div>

        <nav className="w-full">
          <ul className="flex flex-col gap-4 short:gap-2.5 w-min mx-auto">
            {hasGuest && (
              <li className="grid grid-cols-[0.5rem_1fr] items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    activeSection === "hero" ? "bg-button" : "bg-border"
                  }`}
                />
                <button
                  onClick={(e) => handleClick(e, "hero")}
                  className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer text-left ${
                    activeSection === "hero"
                      ? "text-text-heading font-medium"
                      : "text-text-muted hover:text-text-heading"
                  }`}
                >
                  Voi doi
                </button>
              </li>
            )}
            {NAV_ITEMS.map((item) => (
              <li key={item.sectionId} className="grid grid-cols-[0.5rem_1fr] items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    activeSection === item.sectionId
                      ? "bg-button"
                      : "bg-border"
                  }`}
                />
                <button
                  onClick={(e) => handleClick(e, item.sectionId)}
                  className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer text-left leading-relaxed ${
                    activeSection === item.sectionId
                      ? "text-text-heading font-medium"
                      : "text-text-muted hover:text-text-heading"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
