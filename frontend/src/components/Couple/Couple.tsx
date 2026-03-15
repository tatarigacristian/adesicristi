"use client";

import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings, formatDate } from "@/utils/settings";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";

const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/embed/jEj57Rqeuy8";

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/
  );
  return match ? match[1] : null;
}

const TIMELINE = [
  { date: "2021-12-24", label: "Ne-am cunoscut", icon: "sparkle" },
  { date: "2022-01-10", label: "Prima întâlnire", icon: "coffee" },
  { date: "2022-02-02", label: "Împreună", icon: "heart" },
  { date: "2022-12-28", label: "Ne-am mutat împreună", icon: "home" },
  { date: "2023-05-02", label: "Logodna", icon: "ring" },
  { date: "", label: "Nunta", icon: "celebrate" },
];

function TimelineIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "sparkle":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
        </svg>
      );
    case "coffee":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
        </svg>
      );
    case "heart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "home":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "ring":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="14" r="6" />
          <circle cx="15" cy="14" r="6" />
          <path d="M12 2l1.5 4h-3L12 2z" />
        </svg>
      );
    case "celebrate":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83M12 18v4M16.24 16.24l2.83 2.83M18 12h4M16.24 7.76l2.83-2.83" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Couple({ settings }: { settings?: WeddingSettings | null }) {
  const ref = useScrollAnimation<HTMLElement>();
  const [playing, setPlaying] = useState(false);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const [timelineFading, setTimelineFading] = useState(false);

  const youtubeUrl = settings?.link_youtube_video || DEFAULT_YOUTUBE_URL;
  const videoId = getYoutubeId(youtubeUrl);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;

  const embedSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`
    : youtubeUrl;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimelineFading(true);
      setTimeout(() => {
        setActiveTimelineIndex((prev) => (prev + 1) % TIMELINE.length);
        setTimelineFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Use wedding date from settings for the last timeline entry
  const weddingDate = settings?.ceremonie_data?.split("T")[0] || "2026-07-04";
  const timeline = TIMELINE.map((item, i) =>
    i === TIMELINE.length - 1 ? { ...item, date: weddingDate } : item
  );

  return (
    <section
      id="couple"
      ref={ref}
      className="snap-section content-section bg-background-soft animate-on-scroll"
    >
      <div className="w-full max-w-5xl mx-auto px-6">
        <div className="text-center mb-2 sm:mb-10">
          <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2 sm:mb-3">Noi doi</h2>
          <SmallFlourish className="mx-auto mb-1 sm:mb-3" />
          <p className="text-sm text-foreground">
            Vă invităm să urmăriți povestea noastră
          </p>
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-10 lg:gap-14">

          {/* Timeline — vertically centered with video on desktop */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end lg:self-center">
            {/* Mobile: single item with fade, no icons/dots */}
            <div className="lg:hidden flex flex-col items-center">
              {(() => {
                const item = timeline[activeTimelineIndex];
                const isLast = activeTimelineIndex === timeline.length - 1;
                return (
                  <div
                    className={`flex flex-col items-center text-center transition-opacity duration-400 ${
                      timelineFading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-text-muted mb-1">
                      {formatDate(item.date)}
                    </p>
                    <p className={`serif-font text-xl leading-snug ${isLast ? "text-button font-medium" : "text-text-heading"}`}>
                      {item.label}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Desktop: full vertical timeline */}
            <div className="hidden lg:block relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-button/20" />

              <div className="flex flex-col gap-8">
                {timeline.map((item, i) => {
                  const isLast = i === timeline.length - 1;
                  return (
                    <div key={i} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center
                          ${isLast
                            ? "bg-button text-white"
                            : "bg-button/70 text-white"
                          }`}
                      >
                        <TimelineIcon icon={item.icon} />
                      </div>
                      <div className="pt-0">
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-text-muted mb-0.5">
                          {formatDate(item.date)}
                        </p>
                        <p className={`serif-font text-lg leading-snug ${isLast ? "text-button font-medium" : "text-text-heading"}`}>
                          {item.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Video */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <div className="w-full max-w-[280px] sm:max-w-xs glass-card !p-0 overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: "120%" }}>
                {!playing ? (
                  <button
                    onClick={() => setPlaying(true)}
                    className="absolute inset-0 w-full h-full cursor-pointer group"
                    aria-label="Play video"
                  >
                    {thumbnailUrl && (
                      <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-button ml-1">
                          <path d="M8 5v14l11-7z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ) : (
                  <iframe
                    className="absolute inset-0 w-full h-full border-0"
                    src={embedSrc}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
