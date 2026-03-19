"use client";

import { useState, useEffect } from "react";
import { WeddingSettings, formatDate } from "@/utils/settings";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";
import SectionDots from "@/components/Ornaments/SectionDots";
import { useSlideActive } from "@/hooks/useSlideActive";

const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/embed/jEj57Rqeuy8";

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/
  );
  return match ? match[1] : null;
}

const TIMELINE = [
  { date: "2021-12-24", label: "Ne-am găsit", icon: "phone" },
  { date: "2022-01-10", label: "Ne-am întâlnit", icon: "coffee" },
  { date: "2022-02-02", label: "Un cuplu", icon: "heart" },
  { date: "2022-12-28", label: "Prima casă", icon: "home" },
  { date: "2023-05-02", label: "Logodna", icon: "ring" },
  { date: "", label: "Nunta", icon: "champagne" },
];

import { DeviceMobileCamera, Coffee, HeartStraight, House, Diamond, Champagne, Play } from "@phosphor-icons/react";

function TimelineIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  switch (icon) {
    case "phone":
      return <DeviceMobileCamera size={size} weight="duotone" />;
    case "coffee":
      return <Coffee size={size} weight="duotone" />;
    case "heart":
      return <HeartStraight size={size} weight="duotone" />;
    case "home":
      return <House size={size} weight="duotone" />;
    case "ring":
      return <Diamond size={size} weight="duotone" />;
    case "champagne":
      return <Champagne size={size} weight="duotone" />;
    default:
      return null;
  }
}

export default function Couple({ settings }: { settings?: WeddingSettings | null }) {
  const showContent = useSlideActive("couple");
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
      className="content-section bg-background-soft"
    >
      {/* Header */}
      <div className="section-header">
        <h2 className="serif-font text-2xl md:text-4xl font-bold text-text-heading uppercase mb-2 sm:mb-3">Noi doi</h2>
        <SectionDots />
          <p className="body-font text-[0.7rem] tracking-[0.2em] uppercase text-text-muted">
            Povestea noastră
          </p>
      </div>

      {/* Content */}
      <div className={`section-content max-w-5xl px-6 transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-10 lg:gap-14 w-full">

          {/* Desktop: full vertical timeline (left side) */}
          <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end lg:self-stretch">
            <div className="relative flex flex-col h-full">
              <div className="flex flex-col justify-between h-full">
                {timeline.map((item, i) => {
                  const isLast = i === timeline.length - 1;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 short:w-9 short:h-9 rounded-full flex items-center justify-center shrink-0 bg-button text-white"
                      >
                        <TimelineIcon icon={item.icon} size={20} />
                      </div>
                      <div>
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-text-muted mb-0.5">
                          {formatDate(item.date)}
                        </p>
                        <p className={`serif-font text-lg short:text-base leading-snug ${isLast ? "text-button font-medium" : "text-text-heading"}`}>
                          {item.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile: video + timeline below; Desktop: video right */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start gap-4">
            <div className="w-[55vw] max-w-[240px] sm:max-w-xs lg:max-w-sm short:lg:max-w-[260px] glass-card !p-0 overflow-hidden rounded-xl">
              <div className="relative w-full" style={{ paddingBottom: "150%" }}>
                {!playing ? (
                  <button
                    onClick={() => setPlaying(true)}
                    className="absolute inset-0 w-full h-full cursor-pointer group"
                    aria-label="Play video"
                  >
                    <img
                      src="/images/video-thumbnail.png"
                      alt="Video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center px-6">
                      <div className="flex items-center justify-center gap-1.5 bg-button/70 backdrop-blur-sm rounded-full py-1.5 px-5 group-hover:bg-button/90 transition-colors duration-300">
                        <Play size={12} weight="fill" className="text-white" />
                        <span className="text-[0.6rem] font-medium tracking-[0.1em] uppercase text-white/90">Play video</span>
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

            {/* Mobile: rotating timeline under video */}
            <div className="lg:hidden relative w-full shrink-0" style={{ height: 36 }}>
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1;
                const isActive = i === activeTimelineIndex;
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 flex items-center justify-center gap-2
                      transition-all duration-500 ease-in-out
                      ${isActive && !timelineFading ? "opacity-100 translate-y-0" : ""}
                      ${isActive && timelineFading ? "opacity-0 -translate-y-2" : ""}
                      ${!isActive ? "opacity-0 translate-y-2 pointer-events-none" : ""}`}
                  >
                    <span className="text-[0.65rem] tracking-[0.15em] uppercase text-text-muted whitespace-nowrap">
                      {formatDate(item.date)}
                    </span>
                    <span className="w-px h-3.5 bg-button/30" />
                    <span className={`serif-font text-[0.85rem] leading-none whitespace-nowrap ${isLast ? "text-button font-medium" : "text-text-heading"}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SectionFooterNav settings={settings} />
    </section>
  );
}
