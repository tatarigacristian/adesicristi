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
import { WeddingSettings, fetchWeddingSettings } from "@/utils/settings";

export default function Home() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);

  useEffect(() => {
    fetchWeddingSettings().then(setSettings);
  }, []);

  return (
    <>
      <MobileNav />
      <div className="split-container">
        <Sidebar settings={settings} />
        <main className="right-panel">
          <Hero settings={settings} />
          <Couple settings={settings} />
          <Family />
          <Locations settings={settings} />
          <RSVP settings={settings} />
          <Footer />
        </main>
      </div>
    </>
  );
}
