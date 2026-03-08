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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuest() {
      try {
        const res = await fetch(`${API_URL}/api/guests/${slug}`);
        if (res.ok) {
          setGuest(await res.json());
        }
      } catch {
        // silently fail, show default message
      } finally {
        setLoading(false);
      }
    }
    fetchGuest();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="script-font text-3xl text-text-heading mb-2">Ade & Cristi</p>
          <p className="text-xs text-text-muted tracking-widest uppercase">Se incarca...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileNav />
      <div className="split-container">
        <Sidebar />
        <main className="right-panel">
          <Hero guest={guest} />
          <Couple />
          <Family />
          <Locations />
          <RSVP guest={guest} />
          <Footer />
        </main>
      </div>
    </>
  );
}
