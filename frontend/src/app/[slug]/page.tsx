"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SwiperLayout from "@/components/Layout/SwiperLayout";
import { WeddingSettings, fetchWeddingSettings, getCoupleNames, applyThemeColors } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  partner: { nume: string; prenume: string } | null;
}

export default function SlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [guestRes, settingsData] = await Promise.all([
          fetch(`${API_URL}/api/guests/${slug}`),
          fetchWeddingSettings(),
        ]);
        if (guestRes.ok) {
          setGuest(await guestRes.json());
        }
        setSettings(settingsData);
        applyThemeColors(settingsData);
      } catch {
        // silently fail, show default message
      } finally {
        requestAnimationFrame(() => setReady(true));
      }
    }
    fetchData();
  }, [slug]);

  const couple = getCoupleNames(settings);

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

      {!ready ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="script-font text-3xl text-text-heading mb-2">{couple.display}</p>
            <p className="text-xs text-text-muted tracking-widest uppercase">Se încarcă...</p>
          </div>
        </div>
      ) : (
        <SwiperLayout settings={settings} guest={guest} />
      )}
    </>
  );
}
