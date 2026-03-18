"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SwiperLayout from "@/components/Layout/SwiperLayout";
import MaintenancePage from "@/components/MaintenancePage";
import WeddingPageLoader from "@/components/WeddingPageLoader";
import { WeddingSettings, applyThemeColors } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  sex: "M" | "F" | null;
  partner: { nume: string; prenume: string } | null;
}

export default function SlugPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isIncognito = searchParams.get("incognito") === "true";
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsUnavailable, setSettingsUnavailable] = useState(false);

  // Log invitation open (fire-and-forget, skip in incognito mode)
  useEffect(() => {
    if (slug && !isIncognito) {
      fetch(`${API_URL}/api/invitation-log/${slug}`, { method: "POST" }).catch(() => {});
    }
  }, [slug, isIncognito]);

  useEffect(() => {
    async function fetchData() {
      try {
        const settingsRes = await fetch(`${API_URL}/api/wedding-settings`);
        if (!settingsRes.ok) {
          setSettingsUnavailable(true);
          return;
        }
        const settingsData: WeddingSettings = await settingsRes.json();
        setSettings(settingsData);
        applyThemeColors(settingsData);

        const guestRes = await fetch(`${API_URL}/api/guests/${slug}`);
        if (guestRes.ok) {
          setGuest(await guestRes.json());
        }
      } catch {
        setSettingsUnavailable(true);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => setReady(true));
      }
    }
    fetchData();
  }, [slug]);

  if (settingsUnavailable) {
    return <MaintenancePage />;
  }

  if (loading) {
    return <WeddingPageLoader />;
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

      <SwiperLayout settings={settings} guest={guest} />
    </>
  );
}
