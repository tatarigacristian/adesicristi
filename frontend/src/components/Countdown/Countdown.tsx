"use client";

import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const WEDDING_DATE = new Date("2026-07-04T11:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

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

export default function Countdown({ variant = "section" }: { variant?: "section" | "sidebar" }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const ref = useScrollAnimation<HTMLElement>();

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return variant === "sidebar" ? (
      <div className="bg-background rounded-xl px-5 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-border-light/50 min-h-[6rem]" />
    ) : null;
  }

  if (variant === "sidebar") {
    return (
      <div className="bg-background rounded-xl px-5 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-border-light/50">
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
                <span className="text-xl text-accent/40 -mt-4">:</span>
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
      className="snap-section content-section bg-background-soft animate-on-scroll"
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
