"use client";

import { useState, useMemo } from "react";
import { WeddingSettings, formatDate } from "@/utils/settings";
import SectionCorners from "@/components/Ornaments/SectionCorners";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";
import SectionDots from "@/components/Ornaments/SectionDots";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import { useSlideActive } from "@/hooks/useSlideActive";

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
      <div className="w-12 h-12 rounded-full bg-button flex items-center justify-center text-white flex-shrink-0">
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
          className="body-font text-[0.6rem] tracking-[0.15em] uppercase text-button hover:text-button-hover transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
        >
          <MapPin size={11} weight="duotone" />
          Vezi pe hartă
        </button>
      )}
    </div>
  );
}

/* Event icons for location cards — using Phosphor Icons */
import { Church, Car as PhCar, Champagne, MapPin, NavigationArrow } from "@phosphor-icons/react";

function EventIcon({ type }: { type: string }) {
  const size = 28;
  if (type.toLowerCase().includes("transport")) {
    return <PhCar size={size} weight="duotone" />;
  }
  if (type.toLowerCase().includes("petrecere") || type.toLowerCase().includes("recep")) {
    return <Champagne size={size} weight="duotone" />;
  }
  return <Church size={size} weight="duotone" />;
}

export default function Locations({ settings }: { settings?: WeddingSettings | null }) {
  const showContent = useSlideActive("locations");
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
          <SmallFlourish className="hidden sm:block mx-auto my-2" />
          <p className="body-font text-[0.7rem] sm:text-[0.85rem] tracking-[0.2em] uppercase text-text-muted">
            Când și unde
          </p>
        </div>

        {/* Content */}
        <div className={`section-content max-w-4xl px-4 transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {/* Mobile timeline */}
          <div className="md:hidden px-6">
            <div className="relative pl-10">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-button/20" />
              <div className="flex flex-col gap-6">
                {locations.map((loc, i) => (
                  <div
                    key={loc.title}
                    className="relative cursor-pointer"
                    onClick={() => loc.googleMapsUrl && handleMapClick(loc)}
                  >
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
                        <p className="body-font mt-1.5 text-[0.6rem] tracking-[0.1em] uppercase text-button flex items-center gap-1">
                          <MapPin size={10} weight="duotone" />
                          Vezi pe hartă
                        </p>
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
                <MapPin size={20} weight="duotone" className="text-button flex-shrink-0" />
                <span className="text-sm font-medium text-text-heading">Google Maps</span>
              </a>
              <a
                href={getAppleMapsUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <NavigationArrow size={20} weight="duotone" className="text-button flex-shrink-0" />
                <span className="text-sm font-medium text-text-heading">Apple Maps</span>
              </a>
              <a
                href={getWazeUrl(drawerLocation.googleMapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:bg-background-soft transition-colors"
              >
                <PhCar size={20} weight="duotone" className="text-button flex-shrink-0" />
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
