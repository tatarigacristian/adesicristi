"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface LocationCard {
  title: string;
  date: string;
  time: string;
  address: string;
  googleMapsUrl: string;
  image: string;
}

const LOCATIONS: LocationCard[] = [
  {
    title: "Cununia Religioasa",
    date: "4 Iulie 2026",
    time: "ora 15:00",
    address: "Adresa va fi comunicata ulterior",
    googleMapsUrl: "https://maps.app.goo.gl/BpJMVU3vwg3QuLDr5",
    image: "/images/spiritual.png",
  },
  {
    title: "Transport",
    date: "4 Iulie 2026",
    time: "ora 18:00",
    address: "Adresa va fi comunicata ulterior",
    googleMapsUrl: "https://maps.app.goo.gl/zvSki9tUL6UGbsyU9",
    image: "/images/bus.png",
  },
  {
    title: "Petrecerea",
    date: "4 Iulie 2026",
    time: "ora 19:00",
    address: "Adresa va fi comunicata ulterior",
    googleMapsUrl: "https://maps.app.goo.gl/kpEz9hCmH5mY19s68",
    image: "/images/party.png",
  },
];

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
    <div className="glass-card overflow-hidden p-0">
      <img
        src={loc.image}
        alt={loc.title}
        className="w-full h-44 object-cover"
      />
      <div className="p-5 text-center">
        <h3 className="serif-font text-lg text-text-heading mb-2">
          {loc.title}
        </h3>
        <p className="text-xs text-text-muted flex items-center justify-center gap-1 mb-1">
          <span>&#128197;</span> {loc.date}, {loc.time}
        </p>
        <p className="text-xs text-foreground/60 mb-4 leading-relaxed">
          {loc.address}
        </p>
        {loc.googleMapsUrl && (
          <button
            onClick={() => onMapClick(loc)}
            className="btn-glass text-xs cursor-pointer"
          >
            <span>&#128204;</span> Vezi pe harta
          </button>
        )}
      </div>
    </div>
  );
}

export default function Locations() {
  const ref = useScrollAnimation<HTMLElement>();
  const [drawerLocation, setDrawerLocation] = useState<LocationCard | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

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

  // Auto-play carousel every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % LOCATIONS.length;
      scrollToIndex(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, scrollToIndex]);

  return (
    <>
      <section
        id="locations"
        ref={ref}
        className="snap-section content-section bg-background animate-on-scroll"
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
              Detaliile evenimentului
            </h2>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-text-muted">
              Cand si unde
            </p>
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {LOCATIONS.map((loc) => (
                <div
                  key={loc.title}
                  className="w-full flex-shrink-0 snap-center px-4"
                >
                  <LocationCardContent loc={loc} onMapClick={handleMapClick} />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2.5 mt-6">
              {LOCATIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to ${LOCATIONS[i].title}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === i
                      ? "w-6 h-2 bg-accent-rose"
                      : "w-2 h-2 bg-border hover:bg-accent/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 gap-5">
            {LOCATIONS.map((loc) => (
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
              Deschide cu aplicatia preferata
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={drawerLocation.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <span className="text-xl">📍</span>
                <span className="text-sm font-medium text-text-heading">Google Maps</span>
              </a>
              <a
                href={getAppleMapsUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <span className="text-xl">🗺️</span>
                <span className="text-sm font-medium text-text-heading">Apple Maps</span>
              </a>
              <a
                href={getWazeUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <span className="text-xl">🚗</span>
                <span className="text-sm font-medium text-text-heading">Waze</span>
              </a>
            </div>
            <button
              onClick={() => setDrawerLocation(null)}
              className="w-full mt-4 py-2.5 text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer"
            >
              Inchide
            </button>
          </div>
        </div>
      )}
    </>
  );
}
