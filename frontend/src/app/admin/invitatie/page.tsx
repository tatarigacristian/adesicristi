"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  partner_id: number | null;
}

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  nas_nume: string | null;
  nas_prenume: string | null;
  nasa_nume: string | null;
  nasa_prenume: string | null;
  parinti_mireasa: string | null;
  parinti_mire: string | null;
  tata_mireasa_nume: string | null;
  tata_mireasa_prenume: string | null;
  mama_mireasa_nume: string | null;
  mama_mireasa_prenume: string | null;
  tata_mire_nume: string | null;
  tata_mire_prenume: string | null;
  mama_mire_nume: string | null;
  mama_mire_prenume: string | null;
  ceremonie_data: string | null;
  ceremonie_ora: string | null;
  ceremonie_adresa: string | null;
  ceremonie_descriere: string | null;
  transport_ora: string | null;
  transport_adresa: string | null;
  petrecere_ora: string | null;
  petrecere_adresa: string | null;
  petrecere_descriere: string | null;
  confirmare_pana_la: string | null;
  contact_info: string | null;
  color_main: string | null;
  color_second: string | null;
  color_button: string | null;
  color_text: string | null;
}

const defaultIntroLines = [
  "AVEM PLĂCEREA DE A VĂ INVITA SĂ FIȚI ALĂTURI DE NOI",
  "ÎN ZIUA ÎN CARE NE LEGĂM DESTINELE",
  "ȘI PĂȘIM ÎMPREUNĂ PE DRUMUL UNEI NOI VIEȚI.",
];

/* ─── Color utilities ─── */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = amount / 100;
  return `#${Math.min(255, Math.round(r + (255 - r) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(g + (255 - g) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(b + (255 - b) * f)).toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount / 100;
  return `#${Math.round(r * f).toString(16).padStart(2, "0")}${Math.round(g * f).toString(16).padStart(2, "0")}${Math.round(b * f).toString(16).padStart(2, "0")}`;
}

function buildPalette(settings: WeddingSettings) {
  const bg = settings.color_main || "#FDFBF8";
  const text = settings.color_text || "#2C2622";
  const accent = settings.color_button || "#C4B5A0";
  return {
    primary: text,
    secondary: lighten(text, 25),
    muted: lighten(text, 45),
    ornament: accent,
    bg,
    bgOuter: darken(bg, 5),
  };
}

/* ─── SVG Decorative Elements ─── */
function CornerOrnament({ style, color }: { style: React.CSSProperties; color: string }) {
  return (
    <svg style={{ position: "absolute", ...style }} viewBox="0 0 80 80" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L2 28 Q4 18, 12 12 Q18 8, 28 6 Q36 4, 40 2 Z" fill="none" stroke={color} strokeWidth="0.6" />
      <path d="M2 2 Q8 12, 16 18 Q22 24, 32 28" fill="none" stroke={color} strokeWidth="0.5" />
      <path d="M2 6 Q10 10, 14 16 Q18 22, 24 24" fill="none" stroke={color} strokeWidth="0.4" opacity="0.6" />
      <circle cx="8" cy="8" r="1.2" fill={color} opacity="0.5" />
    </svg>
  );
}

function Flourish({ width = 200, color }: { width?: number; color: string }) {
  return (
    <svg viewBox="0 0 400 24" style={{ width, height: width * 0.06 }} xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="12" x2="140" y2="12" stroke={color} strokeWidth="0.5" />
      <line x1="260" y1="12" x2="400" y2="12" stroke={color} strokeWidth="0.5" />
      <path d="M160 12 Q170 4, 180 8 Q188 11, 196 6 L200 4 L204 6 Q212 11, 220 8 Q230 4, 240 12 Q230 20, 220 16 Q212 13, 204 18 L200 20 L196 18 Q188 13, 180 16 Q170 20, 160 12Z" fill="none" stroke={color} strokeWidth="0.6" />
      <path d="M197 12 L200 9 L203 12 L200 15Z" fill={color} />
    </svg>
  );
}

function SmallFlourish({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 12" style={{ width: 120, height: 7 }} xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2="70" y2="6" stroke={color} strokeWidth="0.4" />
      <line x1="130" y1="6" x2="200" y2="6" stroke={color} strokeWidth="0.4" />
      <path d="M80 6 Q90 1, 100 6 Q110 11, 120 6" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="100" cy="6" r="1.5" fill={color} />
    </svg>
  );
}

function ChurchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="10" y1="3" x2="14" y2="3" />
      <path d="M7 10 L12 5 L17 10" />
      <rect x="6" y="10" width="12" height="11" />
      <path d="M10 21 L10 17 Q10 15, 12 15 Q14 15, 14 17 L14 21" />
      <circle cx="12" cy="12.5" r="1" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function TransportIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7 Q3 5, 5 5 L19 5 Q21 5, 21 7 L21 15 Q21 17, 19 17 L18.5 17" />
      <path d="M5.5 17 L3 17 L3 7" />
      <rect x="5" y="7" width="4" height="3.5" rx="0.5" />
      <rect x="10" y="7" width="4" height="3.5" rx="0.5" />
      <rect x="15" y="7" width="4" height="3.5" rx="0.5" />
      <path d="M3 12 L21 12" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
      <path d="M8.8 17 L15.2 17" />
    </svg>
  );
}

function VenueIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2 L7 4 C7 8, 9 10, 12 10 C15 10, 17 8, 17 4 L17 2" />
      <line x1="12" y1="10" x2="12" y2="18" />
      <line x1="8" y1="18" x2="16" y2="18" />
      <line x1="7" y1="2" x2="17" y2="2" />
      <path d="M8 5 C9 4.5, 11 4.5, 12 5 C13 5.5, 15 5.5, 16 5" opacity="0.4" />
      <circle cx="10" cy="7" r="0.5" opacity="0.3" />
      <circle cx="13" cy="6" r="0.4" opacity="0.3" />
    </svg>
  );
}

function LocationIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" style={{ width: 10, height: 10, verticalAlign: "middle", marginRight: 3 }} fill="none" stroke={color} strokeWidth="1.2" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5 C5.5 1.5, 3.5 3.5, 3.5 6 C3.5 9, 8 14.5, 8 14.5 C8 14.5, 12.5 9, 12.5 6 C12.5 3.5, 10.5 1.5, 8 1.5Z" />
      <circle cx="8" cy="6" r="1.8" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" style={{ width: 10, height: 10, verticalAlign: "middle", marginRight: 3 }} fill="none" stroke={color} strokeWidth="1.2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5 L8 8 L10.5 9.5" />
    </svg>
  );
}

function InvitatieContent() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get("guestId");
  const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [partner, setPartner] = useState<GuestData | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guestId || !token) return;

    async function load() {
      try {
        const [guestsRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/guests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);

        if (settingsRes.ok) setSettings(await settingsRes.json());

        if (guestsRes.ok) {
          const guests: GuestData[] = await guestsRes.json();
          const found = guests.find((g) => g.id === parseInt(guestId!));
          if (found) {
            setGuest(found);
            if (found.partner_id) {
              setPartner(guests.find((g) => g.id === found.partner_id) || null);
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [guestId, token]);

  if (loading) {
    return <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Se incarca...</p>;
  }

  if (!guest || !settings) {
    return <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Invitatul nu a fost gasit.</p>;
  }

  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const initialMireasa = mireasa.charAt(0).toUpperCase();
  const initialMire = mire.charAt(0).toUpperCase();

  const ceremonieDateObj = settings.ceremonie_data ? new Date(settings.ceremonie_data) : null;
  const dayOfWeek = ceremonieDateObj
    ? ceremonieDateObj.toLocaleDateString("ro-RO", { weekday: "long" }).toUpperCase()
    : "SAMBATA";
  const dateFormatted = ceremonieDateObj
    ? `${String(ceremonieDateObj.getDate()).padStart(2, "0")}.${String(ceremonieDateObj.getMonth() + 1).padStart(2, "0")}`
    : "00.00";
  const year = ceremonieDateObj ? ceremonieDateObj.getFullYear().toString() : "2026";

  const confirmareDate = settings.confirmare_pana_la
    ? new Date(settings.confirmare_pana_la).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const introLines = guest.intro_short
    ? guest.intro_short.split("\n").filter((l) => l.trim())
    : defaultIntroLines;

  const c = buildPalette(settings);

  const f = {
    mont: "'Montserrat', sans-serif" as const,
    serif: "'Cormorant Garamond', serif" as const,
    script: "'Alex Brush', cursive" as const,
    upper: "uppercase" as const,
  };

  // Parents
  const parintiMireasa = settings.tata_mireasa_prenume
    ? `${settings.mama_mireasa_prenume} si ${settings.tata_mireasa_prenume} ${settings.tata_mireasa_nume}`
    : settings.parinti_mireasa;
  const parintiMire = settings.tata_mire_prenume
    ? `${settings.mama_mire_prenume} si ${settings.tata_mire_prenume} ${settings.tata_mire_nume}`
    : settings.parinti_mire;

  // Nasi
  const nasiText = settings.nas_prenume && settings.nasa_prenume
    ? settings.nasa_nume === settings.nas_nume
      ? `${settings.nasa_prenume} si ${settings.nas_prenume} ${settings.nas_nume}`
      : `${settings.nasa_prenume} ${settings.nasa_nume} si ${settings.nas_prenume} ${settings.nas_nume}`
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Alex+Brush&family=Montserrat:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${c.bgOuter}; font-family: 'Montserrat', sans-serif; }
        .inv-page { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; gap: 1.5rem; }
        .inv-actions { display: flex; gap: 0.75rem; }
        .inv-btn { padding: 0.5rem 1.5rem; border-radius: 0.5rem; font-size: 0.85rem; font-family: 'Montserrat', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: ${c.secondary}; color: #fff; }
        .inv-btn:hover { background: ${c.primary}; }
        .inv-btn-secondary { background: ${c.bg}; color: ${c.secondary}; border: 1px solid ${c.ornament}; }
        .inv-btn-secondary:hover { background: #f5f0ea; }
        @media print {
          body { background: white; }
          .inv-actions { display: none !important; }
          .inv-page { padding: 0; }
        }
      `}</style>

      <div className="inv-page">
        <div className="inv-actions">
          <button className="inv-btn" onClick={() => window.print()}>Printeaza</button>
          <button className="inv-btn inv-btn-secondary" onClick={() => window.close()}>Inchide</button>
        </div>

        {/* ─── Outer Card ─── */}
        <div
          style={{
            width: "15cm",
            minHeight: "21cm",
            background: c.bg,
            border: `1px solid ${c.ornament}`,
            padding: "0.6cm",
            position: "relative",
          }}
        >
          {/* ─── Inner Border ─── */}
          <div
            style={{
              border: `0.5px solid ${c.ornament}`,
              padding: "1.2cm 1.5cm",
              minHeight: "calc(21cm - 1.2cm)",
              fontFamily: f.serif,
              color: c.primary,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.2cm",
              position: "relative",
            }}
          >
            {/* Corner Ornaments */}
            <CornerOrnament color={c.ornament} style={{ top: -2, left: -2 }} />
            <CornerOrnament color={c.ornament} style={{ top: -2, right: -2, transform: "scaleX(-1)" }} />
            <CornerOrnament color={c.ornament} style={{ bottom: -2, left: -2, transform: "scaleY(-1)" }} />
            <CornerOrnament color={c.ornament} style={{ bottom: -2, right: -2, transform: "scale(-1, -1)" }} />

            {/* ─── Monogram (large, central) ─── */}
            <div style={{ position: "relative", marginBottom: "0.2cm", marginTop: "0.1cm" }}>
              <svg viewBox="0 0 160 160" style={{ width: 140, height: 140 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="80" r="72" stroke={c.ornament} strokeWidth="0.5" fill="none" />
                <circle cx="80" cy="80" r="68" stroke={c.ornament} strokeWidth="0.3" fill="none" />
                <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" fill={c.ornament} opacity="0.7" />
                <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" fill={c.ornament} opacity="0.7" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: "0.3cm" }}>
                <span style={{ fontFamily: f.serif, fontSize: "2.69rem", fontWeight: 300, color: c.primary, letterSpacing: "0.05em" }}>{initialMireasa}</span>
                <span style={{ fontFamily: f.script, fontSize: "1.49rem", color: c.muted }}>&amp;</span>
                <span style={{ fontFamily: f.serif, fontSize: "2.69rem", fontWeight: 300, color: c.primary, letterSpacing: "0.05em" }}>{initialMire}</span>
              </div>
            </div>

            {/* ─── Heart divider ─── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "0.15cm" }}>
              <span style={{ display: "block", width: 40, height: 0.5, background: c.ornament, opacity: 0.4 }} />
              <svg viewBox="0 0 50 48" style={{ width: 14, height: 14 }} fill="none" stroke={c.ornament} xmlns="http://www.w3.org/2000/svg">
                <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={c.ornament} fillOpacity="0.15" />
              </svg>
              <span style={{ display: "block", width: 40, height: 0.5, background: c.ornament, opacity: 0.4 }} />
            </div>

            {/* ─── Guest greeting ─── */}
            <p style={{ fontFamily: f.serif, fontSize: "1.29rem", fontWeight: 400, color: c.primary, letterSpacing: "0.03em" }}>
              {partner ? "Dragii noștri" : "Dragă"} {partner ? `${guest.prenume} & ${partner.prenume}` : `${guest.prenume} ${guest.nume}`},
            </p>

            {/* ─── "Cu drag vă invităm" ─── */}
            <p style={{ fontSize: "0.64rem", fontFamily: f.mont, letterSpacing: "0.25em", textTransform: f.upper, fontWeight: 500, color: c.ornament, marginTop: "0.1cm" }}>
              CU DRAG VĂ INVITĂM
            </p>

            {/* ─── Script heading ─── */}
            <p style={{ fontFamily: f.script, fontSize: "1.69rem", color: c.primary, fontStyle: "italic" }}>
              Să fiți alături de noi
            </p>

            {/* ─── Flourish ─── */}
            <div style={{ margin: "0.1cm 0" }}>
              <Flourish width={180} color={c.ornament} />
            </div>

            {/* ─── Invitation Text ─── */}
            <div style={{ lineHeight: 1.8, maxWidth: "10cm" }}>
              {introLines.map((line, i) => (
                <p key={i} style={{ fontSize: "0.61rem", fontFamily: f.mont, letterSpacing: "0.15em", textTransform: f.upper, fontWeight: 300, color: c.secondary }}>
                  {line}
                </p>
              ))}
            </div>

            {/* ─── Parents (side by side) ─── */}
            {(parintiMireasa || parintiMire) && (
              <div style={{ display: "flex", justifyContent: "center", gap: "1.2cm", marginTop: "0.2cm", width: "100%" }}>
                {parintiMireasa && (
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontSize: "0.59rem", fontFamily: f.mont, letterSpacing: "0.2em", textTransform: f.upper, fontWeight: 400, color: c.muted, marginBottom: "0.08cm" }}>
                      PĂRINȚII MIRESEI
                    </p>
                    <p style={{ fontFamily: f.serif, fontSize: "0.89rem", fontWeight: 400, fontStyle: "italic", color: c.secondary }}>
                      {parintiMireasa}
                    </p>
                  </div>
                )}
                {parintiMire && (
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontSize: "0.59rem", fontFamily: f.mont, letterSpacing: "0.2em", textTransform: f.upper, fontWeight: 400, color: c.muted, marginBottom: "0.08cm" }}>
                      PĂRINȚII MIRELUI
                    </p>
                    <p style={{ fontFamily: f.serif, fontSize: "0.89rem", fontWeight: 400, fontStyle: "italic", color: c.secondary }}>
                      {parintiMire}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Nași ─── */}
            {nasiText && (
              <div style={{ textAlign: "center", marginTop: "0.15cm" }}>
                <p style={{ fontSize: "0.59rem", fontFamily: f.mont, letterSpacing: "0.2em", textTransform: f.upper, fontWeight: 400, color: c.muted, marginBottom: "0.08cm" }}>
                  ALĂTURI DE NAȘII
                </p>
                <p style={{ fontFamily: f.serif, fontSize: "0.89rem", fontWeight: 400, fontStyle: "italic", color: c.secondary }}>
                  {nasiText}
                </p>
              </div>
            )}

            {/* ─── Flourish ─── */}
            <div style={{ margin: "0.15cm 0" }}>
              <Flourish width={180} color={c.ornament} />
            </div>

            {/* ─── Date row ─── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4cm" }}>
              <span style={{ fontSize: "0.74rem", fontFamily: f.mont, letterSpacing: "0.3em", fontWeight: 600, color: c.primary }}>{dayOfWeek}</span>
              <svg viewBox="0 0 4 20" style={{ width: 3, height: 16 }} xmlns="http://www.w3.org/2000/svg">
                <line x1="2" y1="0" x2="2" y2="20" stroke={c.ornament} strokeWidth="0.8" />
              </svg>
              <span style={{ fontSize: "0.74rem", fontFamily: f.mont, letterSpacing: "0.2em", fontWeight: 600, color: c.primary }}>{dateFormatted}</span>
              <svg viewBox="0 0 4 20" style={{ width: 3, height: 16 }} xmlns="http://www.w3.org/2000/svg">
                <line x1="2" y1="0" x2="2" y2="20" stroke={c.ornament} strokeWidth="0.8" />
              </svg>
              <span style={{ fontSize: "0.74rem", fontFamily: f.mont, letterSpacing: "0.2em", fontWeight: 600, color: c.primary }}>{year}</span>
            </div>

            {/* ─── Events (matching card style: icon → time → address) ─── */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.6cm", marginTop: "0.2cm", width: "100%" }}>
              {settings.ceremonie_ora && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.06cm" }}>
                  <ChurchIcon color={c.muted} />
                  <p style={{ fontSize: "0.69rem", fontFamily: f.mont, fontWeight: 500, color: c.primary, letterSpacing: "0.05em", marginTop: "0.04cm" }}>
                    ora {settings.ceremonie_ora}
                  </p>
                  {settings.ceremonie_adresa && (
                    <p style={{ fontSize: "0.57rem", fontFamily: f.mont, fontWeight: 300, color: c.muted, textAlign: "center" }}>
                      {settings.ceremonie_adresa}
                    </p>
                  )}
                </div>
              )}

              {settings.transport_ora && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.06cm" }}>
                  <TransportIcon color={c.muted} />
                  <p style={{ fontSize: "0.69rem", fontFamily: f.mont, fontWeight: 500, color: c.primary, letterSpacing: "0.05em", marginTop: "0.04cm" }}>
                    ora {settings.transport_ora}
                  </p>
                  {settings.transport_adresa && (
                    <p style={{ fontSize: "0.57rem", fontFamily: f.mont, fontWeight: 300, color: c.muted, textAlign: "center" }}>
                      {settings.transport_adresa}
                    </p>
                  )}
                </div>
              )}

              {settings.petrecere_ora && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.06cm" }}>
                  <VenueIcon color={c.muted} />
                  <p style={{ fontSize: "0.69rem", fontFamily: f.mont, fontWeight: 500, color: c.primary, letterSpacing: "0.05em", marginTop: "0.04cm" }}>
                    ora {settings.petrecere_ora}
                  </p>
                  {settings.petrecere_adresa && (
                    <p style={{ fontSize: "0.57rem", fontFamily: f.mont, fontWeight: 300, color: c.muted, textAlign: "center" }}>
                      {settings.petrecere_adresa}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ─── Script Closing ─── */}
            <p style={{ fontFamily: f.script, fontSize: "1.59rem", color: c.primary, marginTop: "0.3cm" }}>
              Va asteptam cu drag!
            </p>

            {/* ─── RSVP ─── */}
            {confirmareDate && (
              <div>
                <p style={{ fontSize: "0.57rem", fontFamily: f.mont, letterSpacing: "0.15em", textTransform: f.upper, fontWeight: 400, color: c.muted, lineHeight: 2 }}>
                  VA RUGAM SA NE CONFIRMATI PREZENTA DUMNEAVOASTRA
                </p>
                <p style={{ fontSize: "0.57rem", fontFamily: f.mont, letterSpacing: "0.15em", textTransform: f.upper, fontWeight: 400, color: c.muted }}>
                  PANA IN DATA DE {confirmareDate.toUpperCase()}.
                </p>
              </div>
            )}

            {/* ─── Contact ─── */}
            {settings.contact_info && (
              <div style={{ marginTop: "0.15cm", width: "80%" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.1cm" }}>
                  <SmallFlourish color={c.ornament} />
                </div>
                {settings.contact_info.split("\n").map((line, i) => (
                  <p key={i} style={{ fontSize: "0.54rem", fontFamily: f.mont, letterSpacing: "0.1em", fontWeight: 400, color: c.muted }}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function InvitatiePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Se incarca...</div>}>
      <InvitatieContent />
    </Suspense>
  );
}
