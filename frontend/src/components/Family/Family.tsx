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
      <div className="max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-6">
          {/* Nasi */}
          <div className="family-card text-center">
            {/* Icon: rings */}
            <div className="text-accent/50 mb-4">
              <svg viewBox="0 0 60 50" className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="22" cy="25" rx="14" ry="16" opacity="0.6"/>
                <ellipse cx="38" cy="25" rx="14" ry="16" opacity="0.6"/>
              </svg>
            </div>
            <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
              Impreuna cu nasii
            </h3>
            <div className="w-8 h-px bg-border mx-auto mb-4"></div>
            <p className="script-font text-2xl text-text-heading">
              Simona & Vlad Panaite
            </p>
          </div>

          {/* Parinti */}
          <div className="family-card text-center">
            {/* Icon: heart */}
            <div className="text-accent/40 mb-4">
              <svg viewBox="0 0 50 45" className="w-10 h-10 mx-auto" fill="currentColor" stroke="none">
                <path d="M25,40 C25,40 5,28 5,15 C5,8 12,4 19,8 C22,10 25,14 25,14 C25,14 28,10 31,8 C38,4 45,8 45,15 C45,28 25,40 25,40 Z" opacity="0.25"/>
              </svg>
            </div>
            <h3 className="text-[0.6rem] tracking-[0.3em] uppercase text-text-muted mb-3">
              Dragii nostri parinti
            </h3>
            <div className="w-8 h-px bg-border mx-auto mb-4"></div>
            <p className="script-font text-2xl text-text-heading leading-relaxed">
              Mina & Nicu Ungureanu
            </p>
            <p className="script-font text-2xl text-text-heading leading-relaxed mt-1">
              Viorica & Nicu Țățărigă
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
