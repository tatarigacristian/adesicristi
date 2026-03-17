"use client";

import { useState, useEffect, useCallback } from "react";
import { useSwiper, useSlideTo, SLIDE_IDS } from "@/context/SwiperContext";

const NAV_ITEMS = [
  { label: "Voi doi", sectionId: "hero" },
  { label: "Noi doi", sectionId: "couple" },
  { label: "Familie", sectionId: "family" },
  { label: "Locații", sectionId: "locations" },
  { label: "Confirmă prezența", sectionId: "rsvp" },
  { label: "Mulțumim", sectionId: "footer" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const swiper = useSwiper();
  const slideTo = useSlideTo();

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

  // Animate in/out
  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClick = (sectionId: string) => {
    setOpen(false);
    slideTo(sectionId);
  };

  return (
    <div className="lg:hidden">
      {/* Burger / X button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm
                   border border-border-light shadow-sm flex items-center justify-center
                   transition-all duration-300 hover:bg-white cursor-pointer"
        aria-label="Menu"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <span className={`absolute block w-4 h-[1.5px] bg-text-heading rounded-full transition-all duration-300
            ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
          <span className={`absolute block w-4 h-[1.5px] bg-text-heading rounded-full transition-all duration-300
            ${open ? "opacity-0" : ""}`} />
          <span className={`absolute block w-4 h-[1.5px] bg-text-heading rounded-full transition-all duration-300
            ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
        </div>
      </button>

      {/* Full-screen overlay */}
      {visible && (
        <div
          className={`fixed inset-0 z-40 flex flex-col items-center justify-center
            bg-background/95 backdrop-blur-md transition-opacity duration-400
            ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        >
          <nav className="flex flex-col items-stretch w-full flex-1 pt-16 pb-20">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.sectionId}
                onClick={(e) => { e.stopPropagation(); handleClick(item.sectionId); }}
                className={`flex-1 flex items-center justify-center border-b border-button/10 last:border-b-0
                  hover:text-button transition-all duration-300 cursor-pointer relative
                  ${activeSection === item.sectionId ? "text-button" : "text-text-heading/60"}
                  ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: open ? `${100 + i * 70}ms` : "0ms" }}
              >
                <span className="serif-font text-2xl">{item.label}</span>
                {activeSection === item.sectionId && (
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-button" />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom ornament */}
          <div
            className={`absolute bottom-8 left-0 right-0 text-center transition-all duration-500 ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: open ? "600ms" : "0ms" }}
          >
            <p className="script-font text-xl text-button">Ade & Cristi</p>
          </div>
        </div>
      )}
    </div>
  );
}
