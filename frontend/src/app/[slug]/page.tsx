"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar/Sidebar";
import Hero from "@/components/Hero/Hero";
import Couple from "@/components/Couple/Couple";
import Family from "@/components/Family/Family";
import Locations from "@/components/Locations/Locations";
import RSVP from "@/components/RSVP/RSVP";
import Footer from "@/components/Footer/Footer";
import MobileNav from "@/components/Navigation/MobileNav";
import { WeddingSettings, fetchWeddingSettings, getCoupleNames, applyThemeColors } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro: string | null;
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
            <p className="text-xs text-text-muted tracking-widest uppercase">Se incarca...</p>
          </div>
        </div>
      ) : (
        <>
          <MobileNav />
          <div className="split-container">
            <Sidebar settings={settings} />
            <main className="right-panel">
              <Hero guest={guest} settings={settings} />
              <Couple settings={settings} />
              <Family />
              <Locations settings={settings} />
              <RSVP guest={guest} settings={settings} />
              <Footer />
            </main>
          </div>
        </>
      )}
    </>
  );
}
