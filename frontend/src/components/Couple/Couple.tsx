"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings } from "@/utils/settings";

const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/embed/jEj57Rqeuy8";

export default function Couple({ settings }: { settings?: WeddingSettings | null }) {
  const ref = useScrollAnimation<HTMLElement>();

  const youtubeUrl = settings?.link_youtube_video || DEFAULT_YOUTUBE_URL;
  // Ensure embed URL format with params
  const embedUrl = youtubeUrl.includes("?")
    ? youtubeUrl
    : `${youtubeUrl}?controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`;

  return (
    <section
      id="couple"
      ref={ref}
      className="snap-section content-section bg-background animate-on-scroll !px-0 md:!px-12"
    >
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-6 px-6">
          <h2 className="script-font text-4xl text-text-heading mb-3">Noi doi</h2>
          <p className="text-sm text-foreground/70">
            Va invitam sa urmariti povestea noastra
          </p>
        </div>

        <div className="w-full max-w-sm md:rounded-lg overflow-hidden border-y md:border border-border-light">
          <div className="relative overflow-hidden" style={{ paddingBottom: "155%" }}>
            <iframe
              className="absolute border-0"
              style={{
                top: "-60px",
                left: "0",
                width: "100%",
                height: "calc(100% + 120px)",
              }}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
