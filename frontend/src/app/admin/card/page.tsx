"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { safeToPng } from "@/utils/safari-png";
import { getInvitationAudience, getGreetingShort, getDefaultIntroShort } from "@/utils/invitation-text";
import { ShareNetwork, ArrowSquareOut, Church, Bus, Champagne, CaretDown } from "@phosphor-icons/react";

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
            <p className="card-label" style={{ fontSize: "0.38rem", marginTop: "0.1cm" }}>Ne căsătorim!</p>
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

        <p className="card-label" style={{ marginBottom: "0.1cm" }}>Invitație</p>

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
              împreună cu nașii {settings.nasa_prenume} & {settings.nas_prenume}{" "}
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
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [allGuests, setAllGuests] = useState<GuestData[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pngMenuOpen, setPngMenuOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const pngMenuRef = useRef<HTMLDivElement>(null);

  const generatePngBlob = useCallback(async (): Promise<Blob | null> => {
    if (!printRef.current) return null;
    const dataUrl = await safeToPng(printRef.current);
    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  const handleSavePng = useCallback(async (target: "front" | "back" | "full" | "full-vertical") => {
    setPngMenuOpen(false);
    if (!printRef.current || !guest) return;

    let element: HTMLElement | null = null;
    let suffix = "";
    let stackVertical = false;

    if (target === "front") {
      element = printRef.current.querySelector<HTMLElement>(".card-front");
      suffix = "-fata";
    } else if (target === "back") {
      element = printRef.current.querySelector<HTMLElement>(".card-back");
      suffix = "-verso";
    } else if (target === "full-vertical") {
      element = printRef.current;
      suffix = "-vertical";
      stackVertical = true;
    } else {
      element = printRef.current;
    }
    if (!element) return;

    // Temporarily stack cards vertically for the vertical export
    let originalFlexDirection = "";
    if (stackVertical) {
      originalFlexDirection = element.style.flexDirection;
      element.style.flexDirection = "column";
      // Wait one frame so the browser applies the new layout before capture
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }

    try {
      const dataUrl = await safeToPng(element);
      const link = document.createElement("a");
      link.download = `card-${guest.prenume}-${guest.nume}${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    } finally {
      if (stackVertical) {
        element.style.flexDirection = originalFlexDirection;
      }
    }
  }, [guest]);

  useEffect(() => {
    if (!pngMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (pngMenuRef.current && !pngMenuRef.current.contains(e.target as Node)) {
        setPngMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pngMenuOpen]);

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
          <div ref={pngMenuRef} style={{ position: "relative", display: "inline-block" }}>
            <button
              className="print-btn print-btn-primary"
              onClick={() => setPngMenuOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              Salveaza ca PNG
              <CaretDown size={12} weight="bold" />
            </button>
            {pngMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  minWidth: "100%",
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 6,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  zIndex: 20,
                }}
              >
                <button
                  onClick={() => handleSavePng("front")}
                  style={{ display: "block", width: "100%", padding: "8px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "0.8rem", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Fața
                </button>
                <button
                  onClick={() => handleSavePng("back")}
                  style={{ display: "block", width: "100%", padding: "8px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "0.8rem", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Verso
                </button>
                <button
                  onClick={() => handleSavePng("full")}
                  style={{ display: "block", width: "100%", padding: "8px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "0.8rem", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Full (stânga / dreapta)
                </button>
                <button
                  onClick={() => handleSavePng("full-vertical")}
                  style={{ display: "block", width: "100%", padding: "8px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "0.8rem", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Full (sus / jos)
                </button>
              </div>
            )}
          </div>
          <button className="print-btn print-btn-secondary" onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShareNetwork size={16} weight="bold" />
            Share
          </button>
          {guest?.slug && (
            <button className="print-btn print-btn-secondary" onClick={() => window.open(`/card/${guest.slug}`, '_blank')} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowSquareOut size={16} weight="bold" />
              Pagina publica
            </button>
          )}
          <button className="print-btn print-btn-secondary" onClick={() => window.close()}>
            Inchide
          </button>
        </div>

        <div
          className="cards-container"
          ref={printRef}
          style={{ background: settings.color_main || "#FDF8F7", padding: "5px" }}
        >
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
