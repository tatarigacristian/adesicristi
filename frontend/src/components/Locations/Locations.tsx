"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings, formatDate } from "@/utils/settings";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";

interface LocationCard {
  title: string;
  date: string;
  time: string;
  address: string;
  googleMapsUrl: string;
  image: string;
}

function buildLocations(settings: WeddingSettings | null): LocationCard[] {
  if (!settings) {
    return [
      {
        title: "Cununia Religioasă",
        date: "4 Iulie 2026",
        time: "ora 15:00",
        address: "Adresa va fi comunicată ulterior",
        googleMapsUrl: "https://maps.app.goo.gl/BpJMVU3vwg3QuLDr5",
        image: "/images/spiritual.png",
      },
      {
        title: "Transport",
        date: "4 Iulie 2026",
        time: "ora 18:00",
        address: "Adresa va fi comunicată ulterior",
        googleMapsUrl: "https://maps.app.goo.gl/zvSki9tUL6UGbsyU9",
        image: "/images/bus.png",
      },
      {
        title: "Petrecerea",
        date: "4 Iulie 2026",
        time: "ora 19:00",
        address: "Adresa va fi comunicată ulterior",
        googleMapsUrl: "https://maps.app.goo.gl/kpEz9hCmH5mY19s68",
        image: "/images/party.png",
      },
    ];
  }

  return [
    {
      title: settings.ceremonie_descriere || "Cununia Religioasă",
      date: settings.ceremonie_data ? formatDate(settings.ceremonie_data) : "4 Iulie 2026",
      time: settings.ceremonie_ora ? `ora ${settings.ceremonie_ora}` : "",
      address: settings.ceremonie_adresa || "Adresa va fi comunicată ulterior",
      googleMapsUrl: settings.ceremonie_google_maps || "",
      image: "/images/spiritual.png",
    },
    {
      title: settings.transport_descriere || "Transport",
      date: settings.transport_data ? formatDate(settings.transport_data) : "4 Iulie 2026",
      time: settings.transport_ora ? `ora ${settings.transport_ora}` : "",
      address: settings.transport_adresa || "Adresa va fi comunicată ulterior",
      googleMapsUrl: settings.transport_google_maps || "",
      image: "/images/bus.png",
    },
    {
      title: settings.petrecere_descriere || "Petrecerea",
      date: settings.petrecere_data ? formatDate(settings.petrecere_data) : "4 Iulie 2026",
      time: settings.petrecere_ora ? `ora ${settings.petrecere_ora}` : "",
      address: settings.petrecere_adresa || "Adresa va fi comunicată ulterior",
      googleMapsUrl: settings.petrecere_google_maps || "",
      image: "/images/party.png",
    },
  ];
}

function getWazeUrl(googleMapsUrl: string) {
  return `https://waze.com/ul?navigate=yes&ll=${encodeURIComponent(googleMapsUrl)}`;
}

function getAppleMapsUrl(googleMapsUrl: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(googleMapsUrl)}`;
}

function LocationCardContent({
  loc,
  onMapClick,
}: {
  loc: LocationCard;
  onMapClick: (loc: LocationCard) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-accent">
      <img
        src={loc.image}
        alt={loc.title}
        className="w-full h-96 sm:h-96 md:h-44 object-cover"
      />
      <div className="px-4 py-3 sm:p-5 text-center bg-accent-light">
        <h3 className="serif-font text-base sm:text-lg text-text-heading mb-1">
          {loc.title}
        </h3>
        <p className="text-[0.7rem] text-text-muted flex items-center justify-center gap-1.5 mb-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button/60">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {loc.date}{loc.time ? `, ${loc.time}` : ""}
        </p>
        <p className="text-[0.7rem] text-foreground mb-2 leading-snug">
          {loc.address}
        </p>
        {loc.googleMapsUrl && (
          <button
            onClick={() => onMapClick(loc)}
            className="btn-glass !py-1.5 !px-3 text-xs cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Vezi pe hartă
          </button>
        )}
      </div>
    </div>
  );
}

export default function Locations({ settings }: { settings?: WeddingSettings | null }) {
  const ref = useScrollAnimation<HTMLElement>();
  const [drawerLocation, setDrawerLocation] = useState<LocationCard | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const locations = useMemo(() => buildLocations(settings ?? null), [settings]);

  function handleMapClick(loc: LocationCard) {
    if (window.innerWidth < 1024) {
      setDrawerLocation(loc);
    } else {
      window.open(loc.googleMapsUrl, "_blank");
    }
  }

  const scrollToIndex = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    isScrolling.current = true;
    const cardWidth = carousel.offsetWidth;
    carousel.scrollTo({ left: cardWidth * index, behavior: "smooth" });
    setActiveIndex(index);
    setTimeout(() => {
      isScrolling.current = false;
    }, 400);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (isScrolling.current) return;
      const cardWidth = carousel.offsetWidth;
      const index = Math.round(carousel.scrollLeft / cardWidth);
      setActiveIndex(index);
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % locations.length;
      scrollToIndex(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, scrollToIndex, locations.length]);

  return (
    <>
      <section
        id="locations"
        ref={ref}
        className="snap-section content-section bg-background-soft animate-on-scroll"
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-2 sm:mb-10">
            <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
              Detaliile evenimentului
            </h2>
            <SmallFlourish className="mx-auto mb-3" />
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-text-muted">
              Când și unde
            </p>
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {locations.map((loc) => (
                <div
                  key={loc.title}
                  className="w-full flex-shrink-0 snap-center px-4"
                >
                  <LocationCardContent loc={loc} onMapClick={handleMapClick} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-6">
              {locations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to ${locations[i].title}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === i
                      ? "w-6 h-2 bg-button"
                      : "w-2 h-2 bg-border hover:bg-button/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 gap-5">
            {locations.map((loc) => (
              <LocationCardContent
                key={loc.title}
                loc={loc}
                onMapClick={handleMapClick}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mobile map drawer */}
      {drawerLocation && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setDrawerLocation(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border-light rounded-full mx-auto mb-4" />
            <h3 className="serif-font text-lg text-text-heading text-center mb-1">
              {drawerLocation.title}
            </h3>
            <p className="text-xs text-text-muted text-center mb-5">
              Deschide cu aplicația preferată
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={drawerLocation.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm font-medium text-text-heading">Google Maps</span>
              </a>
              <a
                href={getAppleMapsUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span className="text-sm font-medium text-text-heading">Apple Maps</span>
              </a>
              <a
                href={getWazeUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H7L5 10l-2.5 1.1C1.7 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                  <path d="M9 17h6" />
                </svg>
                <span className="text-sm font-medium text-text-heading">Waze</span>
              </a>
            </div>
            <button
              onClick={() => setDrawerLocation(null)}
              className="w-full mt-4 py-2.5 text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer"
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </>
  );
}
