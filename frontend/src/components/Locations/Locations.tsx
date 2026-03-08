"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface LocationCard {
  title: string;
  date: string;
  time: string;
  address: string;
  mapQuery: string;
}

const LOCATIONS: LocationCard[] = [
  {
    title: "Cununia Civila",
    date: "4 Iulie 2026",
    time: "ora 11:00",
    address: "Adresa va fi comunicata ulterior",
    mapQuery: "",
  },
  {
    title: "Cununia Religioasa",
    date: "4 Iulie 2026",
    time: "ora 14:00",
    address: "Adresa va fi comunicata ulterior",
    mapQuery: "",
  },
  {
    title: "Petrecerea",
    date: "4 Iulie 2026",
    time: "ora 18:00",
    address: "Adresa va fi comunicata ulterior",
    mapQuery: "",
  },
];

function openMap(query: string) {
  if (!query) return;
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    "_blank"
  );
}

export default function Locations() {
  const ref = useScrollAnimation<HTMLElement>();

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LOCATIONS.map((loc) => (
            <div key={loc.title} className="glass-card overflow-hidden p-0">
              {/* Image placeholder */}
              <div className="w-full h-44 bg-background-soft flex items-center justify-center">
                <span className="text-text-muted/40 text-xs">Imagine {loc.title}</span>
              </div>

              <div className="p-5 text-center">
                <h3 className="serif-font text-lg text-text-heading mb-2">{loc.title}</h3>
                <p className="text-xs text-text-muted flex items-center justify-center gap-1 mb-1">
                  <span>&#128197;</span> {loc.date}, {loc.time}
                </p>
                <p className="text-xs text-foreground/60 mb-4 leading-relaxed">{loc.address}</p>
                {loc.mapQuery && (
                  <button
                    onClick={() => openMap(loc.mapQuery)}
                    className="btn-glass text-xs"
                  >
                    <span>&#128204;</span> Vezi pe harta
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
