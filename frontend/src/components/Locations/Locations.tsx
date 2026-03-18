"use client";

import { useState, useMemo } from "react";
import { WeddingSettings, formatDate } from "@/utils/settings";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";
import SectionDots from "@/components/Ornaments/SectionDots";

interface LocationCard {
  title: string;
  date: string;
  time: string;
  address: string;
  googleMapsUrl: string;
  image: string;
  imagePosition?: string;
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
        imagePosition: "top",
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
      imagePosition: "top",
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

/* Desktop card — minimalist row, no image */
function LocationCardDesktop({
  loc,
  onMapClick,
}: {
  loc: LocationCard;
  onMapClick: (loc: LocationCard) => void;
}) {
  return (
    <div className="flex items-center gap-8 py-6">
      <div className="w-[44px] h-[44px] rounded-full border border-button/30 flex items-center justify-center text-button flex-shrink-0">
        <EventIcon type={loc.title} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="serif-font text-xl text-text-heading leading-tight">
          {loc.title}
        </h3>
        <p className="text-[0.65rem] tracking-[0.15em] uppercase text-button mt-1">
          {loc.date}{loc.time ? ` · ${loc.time}` : ""}
        </p>
        <p className="text-[0.7rem] text-text-muted mt-0.5 leading-snug">
          {loc.address}
        </p>
      </div>
      {loc.googleMapsUrl && (
        <button
          onClick={() => onMapClick(loc)}
          className="text-[0.6rem] tracking-[0.15em] uppercase text-button hover:text-button-hover transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Vezi pe hartă
        </button>
      )}
    </div>
  );
}

/* Event icons for mobile timeline */
function EventIcon({ type }: { type: string }) {
  if (type.toLowerCase().includes("transport")) {
    return (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7 Q3 5, 5 5 L19 5 Q21 5, 21 7 L21 15 Q21 17, 19 17 L5 17 Q3 17, 3 15Z" />
        <rect x="5" y="7" width="4" height="3" rx="0.5" />
        <rect x="10" y="7" width="4" height="3" rx="0.5" />
        <rect x="15" y="7" width="4" height="3" rx="0.5" />
        <circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
      </svg>
    );
  }
  if (type.toLowerCase().includes("petrecere") || type.toLowerCase().includes("recep")) {
    return (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2 L7 4 C7 8, 9 10, 12 10 C15 10, 17 8, 17 4 L17 2" />
        <line x1="12" y1="10" x2="12" y2="18" />
        <line x1="8" y1="18" x2="16" y2="18" />
        <line x1="7" y1="2" x2="17" y2="2" />
      </svg>
    );
  }
  // Default: church
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="10" y1="3" x2="14" y2="3" />
      <path d="M7 10 L12 5 L17 10" />
      <rect x="6" y="10" width="12" height="11" />
      <path d="M10 21 L10 17 Q10 15, 12 15 Q14 15, 14 17 L14 21" />
    </svg>
  );
}

export default function Locations({ settings }: { settings?: WeddingSettings | null }) {
  const [drawerLocation, setDrawerLocation] = useState<LocationCard | null>(null);

  const locations = useMemo(() => buildLocations(settings ?? null), [settings]);

  function handleMapClick(loc: LocationCard) {
    if (window.innerWidth < 1024) {
      setDrawerLocation(loc);
    } else {
      window.open(loc.googleMapsUrl, "_blank");
    }
  }

  return (
    <>
      <section
        id="locations"
        className="content-section bg-background-soft"
      >
        {/* Header */}
        <div className="section-header">
          <h2 className="serif-font text-2xl md:text-4xl font-bold text-text-heading mb-2 uppercase">
            Agenda
          </h2>
          <SectionDots />
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-text-muted">
            Când și unde
          </p>
        </div>

        {/* Content */}
        <div className="section-content max-w-4xl px-4">
          {/* Mobile timeline */}
          <div className="md:hidden px-6">
            <div className="relative pl-10">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-button/20" />
              <div className="flex flex-col gap-6">
                {locations.map((loc, i) => (
                  <div key={loc.title} className="relative">
                    <div className="absolute -left-10 top-0 w-[30px] h-[30px] rounded-full flex items-center justify-center bg-button text-white">
                      <EventIcon type={loc.title} />
                    </div>
                    <div>
                      <h3 className="serif-font text-base text-text-heading leading-tight">
                        {loc.title}
                      </h3>
                      <p className="text-[0.65rem] text-button mt-0.5">
                        {loc.date}{loc.time ? `, ${loc.time}` : ""}
                      </p>
                      <p className="text-[0.65rem] text-text-muted mt-0.5 leading-snug">
                        {loc.address}
                      </p>
                      {loc.googleMapsUrl && (
                        <button
                          onClick={() => handleMapClick(loc)}
                          className="mt-1.5 text-[0.6rem] tracking-[0.1em] uppercase text-button flex items-center gap-1 cursor-pointer hover:text-button-hover transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Vezi pe hartă
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop list */}
          <div className="hidden md:flex flex-col justify-center w-full max-w-2xl mx-auto divide-y divide-border-light">
            {locations.map((loc) => (
              <LocationCardDesktop
                key={loc.title}
                loc={loc}
                onMapClick={handleMapClick}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <SectionFooterNav settings={settings} />
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
