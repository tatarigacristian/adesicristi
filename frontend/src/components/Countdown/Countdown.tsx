"use client";

import { useEffect, useState, useMemo } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import SectionCorners from "@/components/Ornaments/SectionCorners";

const DEFAULT_WEDDING_ISO = "2026-07-04T11:00:00";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetMs: number): TimeLeft | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

const units = [
  { key: "days", label: "zile" },
  { key: "hours", label: "ore" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "sec" },
] as const;

export default function Countdown({
  variant = "section",
  weddingDateISO,
}: {
  variant?: "section" | "sidebar";
  weddingDateISO?: string;
}) {
  const targetMs = useMemo(
    () => new Date(weddingDateISO || DEFAULT_WEDDING_ISO).getTime(),
    [weddingDateISO]
  );

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | undefined>(undefined);
  const ref = useScrollAnimation<HTMLElement>();

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetMs));
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetMs)), 1000);
    return () => clearInterval(timer);
  }, [targetMs]);

  // undefined = not yet mounted (SSR), null = countdown finished (wedding day)
  if (timeLeft === undefined) {
    return variant === "sidebar" ? (
      <div className="family-card rounded-xl !px-5 !py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] min-h-[6rem]" />
    ) : null;
  }

  // Hide on wedding day (countdown reached 0)
  if (timeLeft === null) {
    return null;
  }

  if (variant === "sidebar") {
    return (
      <div className="relative family-card rounded-xl !px-5 !py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <SectionCorners size="w-[25px] h-[25px]" offset={10} />
        <p className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-4 font-medium">
          Au mai ramas
        </p>
        <div className="flex items-center justify-center gap-2">
          {units.map((unit, i) => (
            <div key={unit.key} className="flex items-center gap-2">
              <div className="text-center min-w-[2.5rem]">
                <span className="block text-3xl font-light serif-font text-text-heading tabular-nums">
                  {unit.key === "days" ? timeLeft[unit.key] : pad(timeLeft[unit.key])}
                </span>
                <span className="block mt-1 text-[0.5rem] tracking-[0.25em] uppercase text-text-muted">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="text-xl text-button/70 -mt-4">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      id="countdown"
      ref={ref}
      className="content-section bg-background-soft animate-on-scroll"
    >
      <div className="text-center">
        <p className="text-[0.7rem] tracking-[0.3em] uppercase text-text-muted mb-6">
          Au mai ramas
        </p>
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {units.map((unit, i) => (
            <div key={unit.key} className="flex items-center gap-4 md:gap-8">
              <div className="text-center">
                <span className="block text-4xl md:text-6xl font-light serif-font text-text-heading tabular-nums">
                  {unit.key === "days" ? timeLeft[unit.key] : pad(timeLeft[unit.key])}
                </span>
                <span className="block mt-1 text-[0.6rem] tracking-[0.25em] uppercase text-text-muted">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="text-2xl text-border -mt-4">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
