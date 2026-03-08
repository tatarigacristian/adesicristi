"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Couple() {
  const ref = useScrollAnimation<HTMLElement>();

  return (
    <section
      id="couple"
      ref={ref}
      className="snap-section content-section bg-background animate-on-scroll"
    >
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          {/* Image */}
          <div className="w-full md:w-1/2">
            <div className="glass-card p-3">
              {/* TODO: replace with real couple photo */}
              <div className="w-full aspect-[4/5] bg-background-soft rounded-lg flex items-center justify-center">
                <span className="text-text-muted text-sm">Foto cuplu</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2">
            <h2 className="script-font text-4xl text-text-heading mb-2">Noi doi</h2>
            <h3 className="serif-font text-lg font-light text-accent tracking-wide mb-4">
              O calatorie a iubirii
            </h3>
            <div className="w-12 h-px bg-accent/40 mb-6"></div>
            <div className="text-sm leading-relaxed text-foreground/80 space-y-4">
              <p>
                Sunt momente in viata pe care le astepti cu sufletul la gura si cu
                fluturasi in stomac, iar acesta, pentru noi, este unul dintre ele.
              </p>
              <p>
                Incepand cu aceasta zi vom pasi spre viitor cu planuri ambitioase,
                cu visuri marete si cu forte proaspete, unite.
              </p>
              <p>
                Avem deosebita placere de a va invita sa fiti alaturi de noi in
                ziua in care sufletele noastre se vor uni.
              </p>
              <p>Va asteptam cu drag!</p>
            </div>

            {/* YouTube embed placeholder */}
            <div className="mt-8 aspect-video rounded-lg overflow-hidden bg-background-soft flex items-center justify-center border border-border-light">
              <span className="text-text-muted text-sm">Video YouTube</span>
              {/*
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/VIDEO_ID"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
