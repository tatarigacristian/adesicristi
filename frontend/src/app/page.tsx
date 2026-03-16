"use client";

import { useEffect, useState } from "react";
import SwiperLayout from "@/components/Layout/SwiperLayout";
import { WeddingSettings, fetchWeddingSettings, applyThemeColors } from "@/utils/settings";

export default function Home() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchWeddingSettings().then((s) => {
      setSettings(s);
      applyThemeColors(s);
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  return (
    <>
      {/* Blur overlay until theme colors are applied */}
      <div
        className={`fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm transition-opacity duration-500 pointer-events-none ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        style={{ willChange: "opacity" }}
        onTransitionEnd={(e) => {
          if (ready) (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />

      <SwiperLayout settings={settings} />
    </>
  );
}
