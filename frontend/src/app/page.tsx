"use client";

import { useEffect, useState } from "react";
import SwiperLayout from "@/components/Layout/SwiperLayout";
import MaintenancePage from "@/components/MaintenancePage";
import { WeddingSettings, applyThemeColors } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export default function Home() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsUnavailable, setSettingsUnavailable] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/wedding-settings`);
        if (!res.ok) {
          setSettingsUnavailable(true);
          return;
        }
        const s: WeddingSettings = await res.json();
        setSettings(s);
        applyThemeColors(s);
      } catch {
        setSettingsUnavailable(true);
      } finally {
        requestAnimationFrame(() => setReady(true));
      }
    }
    load();
  }, []);

  if (settingsUnavailable) {
    return <MaintenancePage />;
  }

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
