"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function RSVP() {
  const ref = useScrollAnimation<HTMLElement>();

  return (
    <section
      id="rsvp"
      ref={ref}
      className="snap-section content-section bg-background-soft animate-on-scroll"
    >
      <div className="max-w-lg mx-auto w-full">
        <div className="glass-card">
          <div className="text-center mb-6">
            <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
              Confirmare
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Va asteptam cu drag!<br />
              Completati formularul de mai jos pentru a ne anunta decizia.
            </p>
          </div>
          {/* TODO: implement full RSVP form in Phase 5 */}
          <p className="text-center text-xs text-text-muted/60">
            Formularul RSVP va fi implementat in Faza 5
          </p>
        </div>
      </div>
    </section>
  );
}
