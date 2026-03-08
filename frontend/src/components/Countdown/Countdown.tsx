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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const ref = useScrollAnimation<HTMLElement>();

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (variant === "sidebar") {
    return (
      <div className="border border-border-light rounded-lg px-4 py-5">
        <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
          Au mai ramas
        </p>
        <div className="flex items-center justify-center gap-1">
          {units.map((unit, i) => (
            <div key={unit.key} className="flex items-center gap-1">
              <div className="text-center">
                <span className="block text-2xl font-light serif-font text-text-heading tabular-nums">
                  {unit.key === "days" ? timeLeft[unit.key] : pad(timeLeft[unit.key])}
                </span>
                <span className="block text-[0.55rem] tracking-[0.2em] uppercase text-text-muted">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="text-lg text-border mx-1 -mt-4">:</span>
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
