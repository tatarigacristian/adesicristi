"use client";

import { useState } from "react";
import { useSwiper, useSlideTo } from "@/context/SwiperContext";

const NAV_ITEMS = [
  { label: "Noi doi", sectionId: "couple" },
  { label: "Familie", sectionId: "family" },
  { label: "Locatii", sectionId: "locations" },
  { label: "Confirma prezenta", sectionId: "rsvp" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const swiper = useSwiper();
  const slideTo = useSlideTo();

  const handleClick = (sectionId: string) => {
    setOpen(false);
    if (swiper) {
      // Desktop: use Swiper
      slideTo(sectionId);
    } else {
      // Mobile: native scroll
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="lg:hidden">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm
                   border border-border-light shadow-sm flex items-center justify-center
                   text-text-heading transition-colors hover:bg-white"
        aria-label="Menu"
      >
        <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
      </button>

      {/* Overlay menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => handleClick(item.sectionId)}
              className="text-sm tracking-[0.2em] uppercase text-text-heading hover:text-button transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
