"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Hero from "@/components/Hero/Hero";
import Couple from "@/components/Couple/Couple";
import Family from "@/components/Family/Family";
import Locations from "@/components/Locations/Locations";
import RSVP from "@/components/RSVP/RSVP";
import Footer from "@/components/Footer/Footer";
import MobileNav from "@/components/Navigation/MobileNav";
import { WeddingSettings, fetchWeddingSettings, applyThemeColors } from "@/utils/settings";

export default function Home() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchWeddingSettings().then((s) => {
      setSettings(s);
      applyThemeColors(s);
      // Small delay to let CSS variables propagate before revealing
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

      <MobileNav />
      <div className="split-container">
        <Sidebar settings={settings} />
        <main className="right-panel">
          <Hero settings={settings} />
          <Couple settings={settings} />
          <Family settings={settings} />
          <Locations settings={settings} />
          <RSVP settings={settings} />
          <Footer />
        </main>
      </div>
    </>
  );
}
