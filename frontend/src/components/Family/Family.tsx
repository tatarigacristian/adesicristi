"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Family() {
  const ref = useScrollAnimation<HTMLElement>();

  return (
    <section
      id="family"
      ref={ref}
      className="snap-section content-section bg-background-soft animate-on-scroll"
    >
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Nasi */}
          <div className="glass-card text-center flex-1">
            {/* Icon: rings */}
            <div className="text-accent mb-4">
              <svg viewBox="0 0 60 50" className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="22" cy="25" rx="14" ry="16" opacity="0.6"/>
                <ellipse cx="38" cy="25" rx="14" ry="16" opacity="0.6"/>
              </svg>
            </div>
            <h3 className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Impreuna cu nasii
            </h3>
            <div className="w-10 h-px bg-accent/30 mx-auto mb-3"></div>
            <p className="script-font text-2xl text-text-heading">
              {/* TODO: replace with real names */}
              Numele Nasilor
            </p>
          </div>

          {/* Parinti */}
          <div className="glass-card text-center flex-1">
            {/* Icon: heart */}
            <div className="text-accent mb-4">
              <svg viewBox="0 0 50 45" className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M25,40 C25,40 5,28 5,15 C5,8 12,4 19,8 C22,10 25,14 25,14 C25,14 28,10 31,8 C38,4 45,8 45,15 C45,28 25,40 25,40 Z" fill="currentColor" opacity="0.1"/>
                <path d="M25,38 C25,38 7,27 7,15 C7,9 13,6 19,9 C22,11 25,15 25,15 C25,15 28,11 31,9 C37,6 43,9 43,15 C43,27 25,38 25,38 Z" opacity="0.5"/>
              </svg>
            </div>
            <h3 className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Dragii nostri parinti
            </h3>
            <div className="w-10 h-px bg-accent/30 mx-auto mb-3"></div>
            <p className="script-font text-2xl text-text-heading">
              {/* TODO: replace with real names */}
              Parintii Miresei & Parintii Mirelui
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
