"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { getInvitationAudience, getGreetingShort, getDefaultIntroShort } from "@/utils/invitation-text";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://adesicristi.vercel.app";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  partner_id: number | null;
  sex: "M" | "F" | null;
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

/* ─── SVG Corner Ornament (inline in CSS via background) ─── */
function cornerSvg(color: string) {
  const encoded = encodeURIComponent(
    `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L2 28 Q4 18, 12 12 Q18 8, 28 6 Q36 4, 40 2 Z" fill="none" stroke="${color}" stroke-width="0.8"/><path d="M2 2 Q8 12, 16 18 Q22 24, 32 28" fill="none" stroke="${color}" stroke-width="0.6"/><path d="M2 6 Q10 10, 14 16 Q18 22, 24 24" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.6"/><circle cx="8" cy="8" r="1.5" fill="${color}" opacity="0.5"/></svg>`
  );
  return `url("data:image/svg+xml,${encoded}")`;
}

function CardFront({
  guest,
  partner,
  settings,
  qrDataUrl,
}: {
  guest: GuestData;
  partner: GuestData | null;
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

  return (
    <div className="card-face card-front">
      <div className="card-inner" style={{ flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0.3cm 0.8cm", gap: 0 }}>
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        {/* Row: monogram + divider + QR */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", flex: 1, gap: "0.5cm" }}>

          {/* Left side - Monogram + text */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="80" r="72" stroke={accent} strokeWidth="0.7" fill="none" opacity="0.5" />
                <circle cx="80" cy="80" r="68" stroke={accent} strokeWidth="0.4" fill="none" opacity="0.3" />
                <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" fill={accent} opacity="0.5" />
                <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" fill={accent} opacity="0.5" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 300, color: text }}>{initialMireasa}</span>
                <span style={{ fontFamily: "'Alex Brush', cursive", fontSize: "0.8rem", color: muted }}>&amp;</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 300, color: text }}>{initialMire}</span>
              </div>
            </div>
            <p className="card-label" style={{ fontSize: "0.38rem", marginTop: "0.1cm" }}>Ne casatorim!</p>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: "60%", background: `linear-gradient(to bottom, transparent, ${accent}50, transparent)` }} />

          {/* Right side - QR + label below */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div className="card-qr">
              <img src={qrDataUrl} alt="QR Code" style={{ width: "2cm", height: "2cm" }} />
            </div>
            <p className="card-label" style={{ fontSize: "0.38rem", marginTop: "0.08cm" }}>
              Scanați codul
            </p>
          </div>

        </div>{/* end row */}

        {/* Heart icon centered */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "0.1cm" }}>
          <span style={{ display: "block", width: 30, height: 0.5, background: accent, opacity: 0.3 }} />
          <svg viewBox="0 0 50 48" style={{ width: 12, height: 12 }} fill="none" stroke={accent} xmlns="http://www.w3.org/2000/svg">
            <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={accent} fillOpacity="0.15" />
          </svg>
          <span style={{ display: "block", width: 30, height: 0.5, background: accent, opacity: 0.3 }} />
        </div>

        {/* Footer - date */}
        <p className="card-date" style={{ fontSize: "0.35rem", marginTop: "0.1cm" }}>{dateDisplay}</p>
      </div>
    </div>
  );
}

function CardBack({
  guest,
  partner,
  settings,
}: {
  guest: GuestData;
  partner: GuestData | null;
  settings: WeddingSettings;
}) {
  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const text = settings.color_text || "#344b30";
  const accent = settings.color_button || "#7f9f84";
  const muted = lightenHex(text, 45);

  const guestNames = partner
    ? `${guest.prenume} & ${partner.prenume}`
    : guest.prenume;

  const audience = getInvitationAudience(!!partner, guest.sex ?? null);
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
      <div className="card-inner" style={{ paddingBottom: "0.3cm" }}>
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        <p className="card-label" style={{ marginBottom: "0.1cm" }}>Invitatie</p>

        {/* Heart divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: "0.2cm" }}>
          <span style={{ display: "block", width: 25, height: 0.5, background: accent, opacity: 0.3 }} />
          <svg viewBox="0 0 50 48" style={{ width: 10, height: 10 }} fill="none" stroke={accent} xmlns="http://www.w3.org/2000/svg">
            <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={accent} fillOpacity="0.15" />
          </svg>
          <span style={{ display: "block", width: 25, height: 0.5, background: accent, opacity: 0.3 }} />
        </div>

        <p className="card-greeting">
          {getGreetingShort(audience)} {guestNames},
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
        <div className="card-back-footer" style={{ marginTop: "auto" }}>
          <p className="card-back-names">{mireasa} & {mire}</p>
          {(settings.nas_prenume || settings.nasa_prenume) && (
            <p className="card-nasi" style={{ marginBottom: 0, marginTop: "0.03cm" }}>
              impreuna cu nasii {settings.nasa_prenume} & {settings.nas_prenume}{" "}
              {settings.nasa_nume === settings.nas_nume
                ? settings.nasa_nume
                : `${settings.nasa_nume} & ${settings.nas_nume}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CardEventIcon({ icon, color }: { icon: "church" | "transport" | "party"; color: string }) {
  const size = 14;
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "church":
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="5" />
          <line x1="10" y1="3" x2="14" y2="3" />
          <path d="M7 10 L12 5 L17 10" />
          <rect x="6" y="10" width="12" height="11" />
          <path d="M10 21 L10 17 Q10 15, 12 15 Q14 15, 14 17 L14 21" />
          <circle cx="12" cy="12.5" r="1" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      );
    case "transport":
      return (
        <svg {...props}>
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
    case "party":
      return (
        <svg {...props}>
          {/* Bowl - wide at top, narrow at bottom */}
          <path d="M7 2 L7 4 C7 8, 9 10, 12 10 C15 10, 17 8, 17 4 L17 2" />
          {/* Stem */}
          <line x1="12" y1="10" x2="12" y2="18" />
          {/* Base */}
          <line x1="8" y1="18" x2="16" y2="18" />
          {/* Rim */}
          <line x1="7" y1="2" x2="17" y2="2" />
          {/* Liquid level */}
          <path d="M8 5 C9 4.5, 11 4.5, 12 5 C13 5.5, 15 5.5, 16 5" opacity="0.4" />
          {/* Bubbles */}
          <circle cx="10" cy="7" r="0.5" opacity="0.3" />
          <circle cx="13" cy="6" r="0.4" opacity="0.3" />
          <circle cx="11" cy="4" r="0.3" opacity="0.3" />
        </svg>
      );
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

  const cornerImg = cornerSvg(button);

  return `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Alex+Brush&family=Montserrat:wght@300;400;500;600&display=swap');

    .card-page-root {
      font-family: 'Montserrat', sans-serif;
    }

    .card-page-root .print-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      gap: 2rem;
    }

    .card-page-root .print-actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .card-page-root .print-btn {
      padding: 0.45rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-family: 'Montserrat', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .card-page-root .print-btn-primary {
      background: ${text};
      color: ${main};
    }
    .card-page-root .print-btn-primary:hover { filter: brightness(1.2); }

    .card-page-root .print-btn-secondary {
      background: ${bgCard};
      color: ${text};
      border: 1px solid ${button};
    }
    .card-page-root .print-btn-secondary:hover { filter: brightness(0.97); }

    .card-page-root .cards-container {
      display: flex;
      gap: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .card-page-root .card-face {
      width: 9cm;
      height: 5.5cm;
      background: ${bgCard};
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      overflow: hidden;
      position: relative;
      border: 0.5px solid ${button}60;
    }

    .card-page-root .card-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5cm 0.7cm;
      position: relative;
      border: 0.3px solid ${button}30;
      margin: 4px;
      width: calc(100% - 8px);
      height: calc(100% - 8px);
      border-radius: 2px;
    }

    /* Corner ornaments */
    .card-page-root .corner-ornament {
      position: absolute;
      width: 22px;
      height: 22px;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: ${cornerImg};
    }
    .card-page-root .corner-ornament.top-left     { top: 2px; left: 2px; }
    .card-page-root .corner-ornament.top-right    { top: 2px; right: 2px; transform: scaleX(-1); }
    .card-page-root .corner-ornament.bottom-left  { bottom: 2px; left: 2px; transform: scaleY(-1); }
    .card-page-root .corner-ornament.bottom-right { bottom: 2px; right: 2px; transform: scale(-1, -1); }

    /* Front card */
    .card-page-root .card-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.35rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${button};
      font-weight: 500;
      margin-bottom: 0.08cm;
    }

    .card-page-root .card-couple-names {
      font-family: 'Alex Brush', cursive;
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
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.5rem;
      color: ${text};
      font-weight: 500;
      letter-spacing: 0.08em;
      margin-bottom: 0.03cm;
    }

    .card-page-root .card-date {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.33rem;
      color: ${muted};
      font-weight: 400;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    /* Back card */
    .card-page-root .card-back {
      background: ${bgCard};
    }

    .card-page-root .card-greeting {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.5rem;
      color: ${text};
      font-weight: 500;
      margin-bottom: 0.05cm;
    }
    .card-page-root .card-nasi {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.38rem;
      color: ${muted};
      font-weight: 400;
      font-style: italic;
      margin-bottom: 0.08cm;
    }

    .card-page-root .card-message {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.42rem;
      color: ${lightenHex(text, 30)};
      font-weight: 300;
      font-style: italic;
      line-height: 1.6;
      text-align: center;
      max-width: 7cm;
      margin-bottom: 0.15cm;
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
      font-family: 'Montserrat', sans-serif;
      font-size: 0.3rem;
      font-weight: 500;
      color: ${text};
      letter-spacing: 0.05em;
    }
    .card-page-root .card-event-address {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.24rem;
      color: ${muted};
      text-align: center;
      line-height: 1.3;
      white-space: nowrap;
    }

    .card-page-root .card-back-footer {
      text-align: center;
    }
    .card-page-root .card-back-names {
      font-family: 'Alex Brush', cursive;
      font-size: 0.85rem;
      color: ${text};
    }

    /* Print styles */
    @media print {
      .card-page-root .print-actions { display: none !important; }
      .card-page-root .print-page { padding: 0; gap: 0; }

      .card-page-root .cards-container {
        gap: 0;
        flex-direction: column;
        align-items: center;
      }

      .card-page-root .card-face {
        box-shadow: none;
        border-radius: 0;
        page-break-inside: avoid;
      }

      .card-page-root .card-front {
        margin-bottom: 0.5cm;
      }
    }
  `;
}

function CardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const guestId = searchParams.get("guestId");
  const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [allGuests, setAllGuests] = useState<GuestData[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const generatePngBlob = useCallback(async (): Promise<Blob | null> => {
    if (!printRef.current) return null;
    const dataUrl = await toPng(printRef.current, { pixelRatio: 3 });
    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  const handleSavePng = useCallback(async () => {
    if (!printRef.current || !guest) return;
    try {
      const dataUrl = await toPng(printRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `card-${guest.prenume}-${guest.nume}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    }
  }, [guest]);

  const handleShare = useCallback(async () => {
    if (!guest) return;
    const fileName = `card-${guest.prenume}-${guest.nume}.png`;
    const inviteUrl = guest.slug ? `${SITE_URL}/${guest.slug}` : SITE_URL;
    const text = `Invitatie pentru ${guest.prenume} ${guest.nume}`;

    try {
      const blob = await generatePngBlob();
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: "image/png" });
        const shareData = { files: [file], text };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: text, text: `${text}\n${inviteUrl}`, url: inviteUrl });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert("Link copiat în clipboard.");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + inviteUrl)}`, "_blank");
    }
  }, [guest, generatePngBlob]);

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

        let settingsData: WeddingSettings | null = null;
        if (settingsRes.ok) {
          settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        if (guestsRes.ok) {
          const guests: GuestData[] = await guestsRes.json();
          setAllGuests(guests);
          const found = guests.find((g) => g.id === parseInt(guestId!));
          if (found) {
            setGuest(found);

            if (found.slug) {
              const qrColor = settingsData?.color_text || "#2c2c2c";
              const url = `${SITE_URL}/${found.slug}`;
              const dataUrl = await QRCode.toDataURL(url, {
                width: 512,
                margin: 2,
                color: { dark: qrColor, light: "#ffffff" },
              });
              setQrDataUrl(dataUrl);
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

  const partner = guest?.partner_id
    ? allGuests.find((g) => g.id === guest.partner_id) || null
    : null;

  if (loading) {
    return (
      <div className="print-page">
        <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>
          Se incarca...
        </p>
      </div>
    );
  }

  if (!guest || !settings) {
    return (
      <div className="print-page">
        <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>
          Invitatul nu a fost gasit.
        </p>
      </div>
    );
  }

  return (
    <div className="card-page-root">
      <style>{buildStyles(settings)}</style>

      <div className="print-page">
        <div className="print-actions">
          <select
            className="print-btn print-btn-secondary"
            value="card"
            onChange={(e) => router.push(`/admin/${e.target.value}?guestId=${guestId}`)}
          >
            <option value="card">Card</option>
            <option value="invitatie">Invitatie v1</option>
            <option value="invitatie-v2">Invitatie v2</option>
          </select>
          <button className="print-btn print-btn-primary" onClick={handleSavePng}>
            Salveaza ca PNG
          </button>
          <button className="print-btn print-btn-secondary" onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <button className="print-btn print-btn-secondary" onClick={() => window.close()}>
            Inchide
          </button>
        </div>

        <div className="cards-container" ref={printRef}>
          <CardFront guest={guest} partner={partner} settings={settings} qrDataUrl={qrDataUrl} />
          <CardBack guest={guest} partner={partner} settings={settings} />
        </div>
      </div>
    </div>
  );
}

export default function CardPage() {
  return (
    <Suspense fallback={<div className="print-page"><p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Se incarca...</p></div>}>
      <CardPageContent />
    </Suspense>
  );
}
