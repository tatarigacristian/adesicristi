"use client";

import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { getInvitationAudience, getGreetingShort, getDefaultIntroShort } from "@/utils/invitation-text";
import { Church, Bus, Champagne } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://adesicristi.vercel.app";

interface PartnerData {
  nume: string;
  prenume: string;
}

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  sex: "M" | "F" | null;
  partner: PartnerData | null;
  children?: { id: number; nume: string; prenume: string }[];
}

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  nas_nume: string | null;
  nas_prenume: string | null;
  nasa_nume: string | null;
  nasa_prenume: string | null;
  ceremonie_data: string | null;
  ceremonie_ora: string | null;
  ceremonie_adresa: string | null;
  ceremonie_descriere: string | null;
  transport_ora: string | null;
  transport_adresa: string | null;
  transport_descriere: string | null;
  petrecere_ora: string | null;
  petrecere_adresa: string | null;
  petrecere_descriere: string | null;
  color_main: string;
  color_second: string;
  color_button: string;
  color_text: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = amount / 100;
  return `#${Math.min(255, Math.round(r + (255 - r) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(g + (255 - g) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(b + (255 - b) * f)).toString(16).padStart(2, "0")}`;
}

function darkenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount / 100;
  return `#${Math.round(r * f).toString(16).padStart(2, "0")}${Math.round(g * f).toString(16).padStart(2, "0")}${Math.round(b * f).toString(16).padStart(2, "0")}`;
}

/* --- SVG Corner Ornament (inline in CSS via background) --- */
type CornerPos = "top-left" | "top-right" | "bottom-left" | "bottom-right";
function CornerOrnament({ position, color }: { position: CornerPos; color: string }) {
  return (
    <div className={`corner-ornament ${position}`}>
      <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%", display: "block" }} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 28 Q4 18, 12 12 Q18 8, 28 6 Q36 4, 40 2 Z" fill="none" stroke={color} strokeWidth="2" />
        <path d="M2 2 Q8 12, 16 18 Q22 24, 32 28" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M2 6 Q10 10, 14 16 Q18 22, 24 24" fill="none" stroke={color} strokeWidth="1" />
        <circle cx="8" cy="8" r="3" fill={color} />
      </svg>
    </div>
  );
}

function CardFront({
  guest,
  partner,
  settings,
  qrDataUrl,
}: {
  guest: GuestData;
  partner: PartnerData | null;
  settings: WeddingSettings;
  qrDataUrl: string;
}) {
  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const initialMireasa = mireasa.charAt(0).toUpperCase();
  const initialMire = mire.charAt(0).toUpperCase();
  const dateDisplay = settings.ceremonie_data
    ? formatDate(settings.ceremonie_data)
    : "4 Iulie 2026";

  const text = settings.color_text || "#344b30";
  const accent = settings.color_button || "#7f9f84";
  const muted = lightenHex(text, 45);
  const main = settings.color_main || "#FDF8F7";

  return (
    <div className="card-face card-front">
      <div className="card-outer">
      <div className="card-inner" style={{ display: "grid", placeContent: "center", justifyItems: "center", padding: "0.3cm 0.8cm", gap: 0 }}>
        <CornerOrnament position="top-left" color={accent} />
        <CornerOrnament position="top-right" color={accent} />
        <CornerOrnament position="bottom-left" color={accent} />
        <CornerOrnament position="bottom-right" color={accent} />

        {/* Row: monogram + divider + QR */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", gap: "0.5cm" }}>

          {/* Left side - Monogram + text */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 160 160" style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="80" r="72" stroke={accent} strokeWidth="1.5" fill="none" />
                <circle cx="80" cy="80" r="68" stroke={accent} strokeWidth="1" fill="none" />
                <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" fill={accent} />
                <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" fill={accent} />
                <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-cormorant), 'Cormorant Garamond', serif" fontSize="44" fontWeight="300" fill={text}>
                  <tspan>{initialMireasa}</tspan>
                  <tspan dx="4" fontFamily="var(--font-script), 'Alex Brush', cursive" fontSize="26" fill={muted}>&amp;</tspan>
                  <tspan dx="4">{initialMire}</tspan>
                </text>
              </svg>
            </div>
            <p className="card-label" style={{ fontSize: "0.38rem", marginTop: "0.1cm", fontWeight: 600 }}>Ne căsătorim!</p>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: "60%", background: `linear-gradient(to bottom, transparent, ${accent}, transparent)` }} />

          {/* Right side - QR + label below */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div className="card-qr">
              <img src={qrDataUrl} alt="QR Code" style={{ width: "2cm", height: "2cm" }} />
            </div>
            <p className="card-label" style={{ fontSize: "0.38rem", marginTop: "0.08cm", fontWeight: 600 }}>
              Scanați codul
            </p>
          </div>

        </div>{/* end row */}

        {/* Heart icon centered */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "0.1cm" }}>
          <span style={{ display: "block", width: 30, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
          <svg viewBox="0 0 50 48" style={{ width: 12, height: 12 }} fill="none" stroke={accent} xmlns="http://www.w3.org/2000/svg">
            <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={accent} />
          </svg>
          <span style={{ display: "block", width: 30, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
        </div>

        {/* Footer - date */}
        <p className="card-date" style={{ fontSize: "0.35rem", marginTop: "0.1cm", fontWeight: 600 }}>{dateDisplay}</p>
      </div>
      </div>
      {/* Mask: hides the dashed crop marks where they overlap the solid border length, leaving only the corner overhang visible */}
    </div>
  );
}

function CardBack({
  guest,
  partner,
  settings,
}: {
  guest: GuestData;
  partner: PartnerData | null;
  settings: WeddingSettings;
}) {
  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const text = settings.color_text || "#344b30";
  const accent = settings.color_button || "#7f9f84";
  const main = settings.color_main || "#FDF8F7";

  const guestNames = (() => {
    const childNames = guest.children && guest.children.length > 0 ? guest.children.map((c) => c.prenume) : [];
    if (partner) {
      const same = guest.nume === partner.nume;
      const allNames = [guest.prenume, partner.prenume, ...childNames];
      const last = allNames.pop()!;
      return same
        ? `${allNames.join(", ")} și ${last} ${guest.nume}`
        : `${allNames.join(", ")} și ${last}`;
    }
    return guest.prenume;
  })();

  const audience = getInvitationAudience(!!partner || !!(guest.children && guest.children.length > 0), guest.sex ?? null);
  const introText = guest.intro_short
    ? guest.intro_short
    : getDefaultIntroShort(audience);

  const events = [
    {
      icon: "church" as const,
      label: settings.ceremonie_ora ? `ora ${settings.ceremonie_ora}` : "",
      desc: settings.ceremonie_descriere || "Ceremonie",
      address: settings.ceremonie_adresa || "",
    },
    {
      icon: "transport" as const,
      label: settings.transport_ora ? `ora ${settings.transport_ora}` : "",
      desc: settings.transport_descriere || "Transport",
      address: settings.transport_adresa || "",
    },
    {
      icon: "party" as const,
      label: settings.petrecere_ora ? `ora ${settings.petrecere_ora}` : "",
      desc: settings.petrecere_descriere || "Petrecere",
      address: settings.petrecere_adresa || "",
    },
  ].filter((e) => e.label);

  return (
    <div className="card-face card-back">
      <div className="card-outer">
      <div className="card-inner" style={{ paddingBottom: "0.3cm" }}>
        <CornerOrnament position="top-left" color={accent} />
        <CornerOrnament position="top-right" color={accent} />
        <CornerOrnament position="bottom-left" color={accent} />
        <CornerOrnament position="bottom-right" color={accent} />

        <p className="card-label" style={{ marginBottom: "10px" }}>Invitație</p>

        {/* Heart divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: "3px" }}>
          <span style={{ display: "block", width: 25, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
          <svg viewBox="0 0 50 48" style={{ width: 10, height: 10 }} fill="none" stroke={accent} xmlns="http://www.w3.org/2000/svg">
            <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={accent} />
          </svg>
          <span style={{ display: "block", width: 25, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
        </div>

        <p className="card-greeting" style={{ marginTop: 0, lineHeight: 1 }}>
          {getGreetingShort(audience, guest.slug)} {guestNames},
        </p>

        <p className="card-message">{introText}</p>

        <div className="card-events-row">
          {events.map((ev) => (
            <div key={ev.icon} className="card-event-item">
              <CardEventIcon icon={ev.icon} color={accent} />
              {ev.label && <span className="card-event-time">{ev.label}</span>}
              {ev.address && <span className="card-event-address">{ev.address}</span>}
            </div>
          ))}
        </div>

        {/* Closing - positioned at bottom like date on front */}
        <div className="card-back-footer">
          <p className="card-back-names">{mireasa} & {mire}</p>
          {(settings.nas_prenume || settings.nasa_prenume) && (
            <p className="card-nasi" style={{ marginBottom: 0, marginTop: "2px", lineHeight: 1 }}>
              împreună cu nașii {settings.nasa_prenume} & {settings.nas_prenume}{" "}
              {settings.nasa_nume === settings.nas_nume
                ? settings.nasa_nume
                : `${settings.nasa_nume} & ${settings.nas_nume}`}
            </p>
          )}
        </div>
      </div>
      </div>
      {/* Mask: hides the dashed crop marks where they overlap the solid border length, leaving only the corner overhang visible */}
    </div>
  );
}

function CardEventIcon({ icon, color }: { icon: "church" | "transport" | "party"; color: string }) {
  switch (icon) {
    case "church":
      return <Church size={14} weight="duotone" color={color} />;
    case "transport":
      return <Bus size={14} weight="duotone" color={color} />;
    case "party":
      return <Champagne size={14} weight="duotone" color={color} />;
  }
}

function buildStyles(s: WeddingSettings | null) {
  const main = s?.color_main || "#FDF8F7";
  const second = s?.color_second || "#C4A484";
  const button = s?.color_button || "#C4A484";
  const text = s?.color_text || "#3A3A3A";
  const muted = lightenHex(text, 45);
  const bgOuter = darkenHex(main, 5);
  const bgCard = lightenHex(main, 30);

  return `
    .card-page-root {
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
    }

    .card-page-root .print-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      gap: 2rem;
    }

    .card-page-root .cards-container {
      display: flex;
      gap: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .card-page-root .card-face {
      width: calc(9cm + 20px);
      height: calc(5.5cm + 20px);
      padding: 10px;
      box-sizing: border-box;
      background: transparent;
      position: relative;
    }

    .card-page-root .card-outer {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: ${main};
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      position: relative;
      z-index: 1;
    }

    .card-page-root .card-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5cm 0.7cm;
      position: relative;
      border: 0.5px solid ${button};
      margin: 4px;
      width: calc(100% - 8px);
      height: calc(100% - 8px);
      box-sizing: border-box;
      border-radius: 2px;
    }

    /* Corner ornaments */
    .card-page-root .corner-ornament {
      position: absolute;
      width: 22px;
      height: 22px;
    }
    .card-page-root .corner-ornament.top-left     { top: 2px; left: 2px; }
    .card-page-root .corner-ornament.top-right    { top: 2px; right: 2px; transform: scaleX(-1); }
    .card-page-root .corner-ornament.bottom-left  { bottom: 2px; left: 2px; transform: scaleY(-1); }
    .card-page-root .corner-ornament.bottom-right { bottom: 2px; right: 2px; transform: scale(-1, -1); }

    /* Front card */
    .card-page-root .card-label {
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
      font-size: 0.35rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${button};
      font-weight: 800;
      margin-bottom: 0.08cm;
    }

    .card-page-root .card-couple-names {
      font-family: var(--font-script), 'Alex Brush', cursive;
      font-size: 1.5rem;
      color: ${text};
      font-weight: 400;
      line-height: 1.1;
      margin-bottom: 0.1cm;
    }

    .card-page-root .card-qr {
      margin-bottom: 0.08cm;
    }
    .card-page-root .card-qr img {
      width: 1.5cm;
      height: 1.5cm;
      display: block;
      border-radius: 2px;
    }

    .card-page-root .card-guest-name {
      font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
      font-size: 0.5rem;
      color: ${text};
      font-weight: 500;
      letter-spacing: 0.08em;
      margin-bottom: 0.03cm;
    }

    .card-page-root .card-date {
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
      font-size: 0.33rem;
      color: ${muted};
      font-weight: 400;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    /* Back card */
    .card-page-root .card-back {
      background: transparent;
    }

    .card-page-root .card-greeting {
      font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
      font-size: 0.5rem;
      color: ${text};
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 0.05cm;
    }
    .card-page-root .card-nasi {
      font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
      font-size: 0.38rem;
      color: ${muted};
      font-weight: 700;
      font-style: italic;
      margin-bottom: 0.08cm;
    }

    .card-page-root .card-message {
      font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
      font-size: 0.42rem;
      color: ${lightenHex(text, 30)};
      font-weight: 600;
      font-style: italic;
      line-height: 1.6;
      text-align: center;
      margin-bottom: 10px;
    }

    .card-page-root .card-events-row {
      display: flex;
      gap: 0.35cm;
      margin-bottom: 0.12cm;
    }
    .card-page-root .card-event-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.04cm;
      flex: 1;
    }
    .card-page-root .card-event-time {
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
      font-size: 0.3rem;
      font-weight: 800;
      color: ${text};
      letter-spacing: 0.05em;
    }
    .card-page-root .card-event-address {
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
      font-size: 0.24rem;
      font-weight: 700;
      color: ${muted};
      text-align: center;
      line-height: 1.3;
      white-space: nowrap;
    }

    .card-page-root .card-back-footer {
      text-align: center;
    }
    .card-page-root .card-back-names {
      font-family: var(--font-script), 'Alex Brush', cursive;
      font-size: 0.85rem;
      font-weight: 700;
      color: ${text};
      margin: 0;
    }
  `;
}

export default function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [guestRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/guests/${slug}`),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);

        if (!guestRes.ok) {
          setError("Invitația nu a fost găsită.");
          return;
        }

        const guestData: GuestData = await guestRes.json();
        setGuest(guestData);

        let settingsData: WeddingSettings | null = null;
        if (settingsRes.ok) {
          settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        // Generate QR code pointing to the guest's public page
        if (guestData.slug) {
          const qrColor = settingsData?.color_text || "#2c2c2c";
          const url = `${SITE_URL}/${guestData.slug}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 512,
            margin: 2,
            color: { dark: qrColor, light: "#ffffff" },
          });
          setQrDataUrl(dataUrl);
        }
      } catch {
        setError("A apărut o eroare. Vă rugăm încercați din nou.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>
        Se incarca...
      </div>
    );
  }

  if (error || !guest || !settings) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>
        {error || "Invitația nu a fost găsită."}
      </div>
    );
  }

  const partner = guest.partner;

  return (
    <div className="card-page-root">
      <style>{buildStyles(settings)}</style>

      <div className="print-page">
        <div className="cards-container">
          <CardFront guest={guest} partner={partner} settings={settings} qrDataUrl={qrDataUrl} />
          <CardBack guest={guest} partner={partner} settings={settings} />
        </div>
      </div>
    </div>
  );
}
