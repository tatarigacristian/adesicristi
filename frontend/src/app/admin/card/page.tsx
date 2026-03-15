"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro: string | null;
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
  ceremonie_data: string | null;
  ceremonie_ora: string | null;
  ceremonie_adresa: string | null;
  ceremonie_descriere: string | null;
  transport_ora: string | null;
  transport_adresa: string | null;
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
  const dateDisplay = settings.ceremonie_data
    ? formatDate(settings.ceremonie_data)
    : "4 Iulie 2026";

  return (
    <div className="card-face card-front">
      <div className="card-inner">
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        <p className="card-label">Ne căsătorim!</p>

        <h1 className="card-couple-names">{mireasa} & {mire}</h1>

        <div className="card-divider">
          <span className="card-divider-line" />
          <span className="card-divider-heart">&#9829;</span>
          <span className="card-divider-line" />
        </div>

        <div className="card-qr">
          <img src={qrDataUrl} alt="QR Code" />
        </div>

        <p className="card-guest-name">
          {partner
            ? guest.nume === partner.nume
              ? `${guest.prenume} & ${partner.prenume} ${guest.nume}`
              : `${guest.prenume} ${guest.nume} & ${partner.prenume} ${partner.nume}`
            : `${guest.prenume} ${guest.nume}`}
        </p>

        <p className="card-date">{dateDisplay}</p>
      </div>
    </div>
  );
}

function CardEventIcon({ icon }: { icon: "church" | "transport" | "party" }) {
  const size = 14;
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "church":
      return (
        <svg {...props}>
          <path d="M18 22V8l-6-6-6 6v14" />
          <path d="M2 22h20" />
          <path d="M12 2v4" />
          <path d="M10 4h4" />
          <path d="M9 22v-5a3 3 0 0 1 6 0v5" />
        </svg>
      );
    case "transport":
      return (
        <svg {...props}>
          <path d="M5 17H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1l2-4h10l2 4h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M9 17h6" />
        </svg>
      );
    case "party":
      return (
        <svg {...props}>
          <path d="M5.8 11.3L2 22l10.7-3.8" />
          <path d="M4 3h.01" />
          <path d="M22 8h.01" />
          <path d="M15 2h.01" />
          <path d="M22 20h.01" />
          <path d="M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
          <path d="M22 13l-1.34-.45a2.9 2.9 0 0 0-3.12 1.96v0c-.3.86-1.2 1.35-2.08 1.08l-.36-.12c-.82-.27-1.7.17-1.98.98L13 17" />
          <path d="M11 2l.33 1.34a2.9 2.9 0 0 1-1.96 3.12v0c-.86.3-1.35 1.2-1.08 2.08l.12.36c.27.82-.17 1.7-.98 1.98L6 11" />
        </svg>
      );
  }
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

  const guestNames = partner
    ? `${guest.prenume} & ${partner.prenume}`
    : guest.prenume;

  const introText = guest.intro
    ? guest.intro
    : `Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială.`;

  const events = [
    {
      icon: "church" as const,
      label: settings.ceremonie_ora ? `ora ${settings.ceremonie_ora}` : "",
      address: settings.ceremonie_adresa || "",
    },
    {
      icon: "transport" as const,
      label: settings.transport_ora ? `ora ${settings.transport_ora}` : "",
      address: settings.transport_adresa || "",
    },
    {
      icon: "party" as const,
      label: settings.petrecere_ora ? `ora ${settings.petrecere_ora}` : "",
      address: settings.petrecere_adresa || "",
    },
  ];

  return (
    <div className="card-face card-back">
      <div className="card-inner">
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        <p className="card-label">Invitație</p>

        <div className="card-divider card-divider-sm">
          <span className="card-divider-line" />
          <span className="card-divider-heart">&#9829;</span>
          <span className="card-divider-line" />
        </div>

        <p className="card-greeting">
          {partner ? "Dragii noștri" : "Dragă"} {guestNames},
        </p>

        {(settings.nas_prenume || settings.nasa_prenume) && (
          <p className="card-nasi">
            împreună cu nașii {settings.nasa_prenume} & {settings.nas_prenume}{" "}
            {settings.nasa_nume === settings.nas_nume
              ? settings.nasa_nume
              : `${settings.nasa_nume} & ${settings.nas_nume}`}
          </p>
        )}

        <p className="card-message">{introText}</p>

        <div className="card-events-row">
          {events.map((ev) => (
            <div key={ev.icon} className="card-event-item">
              <CardEventIcon icon={ev.icon} />
              {ev.label && <span className="card-event-time">{ev.label}</span>}
              {ev.address && <span className="card-event-address">{ev.address}</span>}
            </div>
          ))}
        </div>

        <div className="card-back-footer">
          <p className="card-back-couple">Cu drag,</p>
          <p className="card-back-names">{mireasa} & {mire}</p>
        </div>
      </div>
    </div>
  );
}

function buildStyles(s: WeddingSettings | null) {
  const main = s?.color_main || "#FDF8F7";
  const second = s?.color_second || "#C4A484";
  const button = s?.color_button || "#C4A484";
  const text = s?.color_text || "#3A3A3A";

  return `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Alex+Brush&family=Montserrat:wght@300;400;500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: ${main};
      font-family: 'Montserrat', sans-serif;
    }

    .print-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      gap: 2rem;
    }

    .print-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .print-btn {
      padding: 0.5rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-family: 'Montserrat', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .print-btn-primary {
      background: ${button};
      color: white;
    }
    .print-btn-primary:hover { filter: brightness(0.9); }

    .print-btn-secondary {
      background: white;
      color: ${text};
      border: 1px solid ${second};
    }
    .print-btn-secondary:hover { filter: brightness(0.97); }

    .cards-container {
      display: flex;
      gap: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .card-face {
      width: 9cm;
      height: 5.5cm;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      position: relative;
      border: 1px solid ${second};
    }

    .card-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.6cm 0.8cm;
      position: relative;
    }

    /* Corner ornaments */
    .corner-ornament {
      position: absolute;
      width: 18px;
      height: 18px;
    }
    .corner-ornament.top-left     { top: 8px; left: 8px; border-top: 1px solid ${button}60; border-left: 1px solid ${button}60; }
    .corner-ornament.top-right    { top: 8px; right: 8px; border-top: 1px solid ${button}60; border-right: 1px solid ${button}60; }
    .corner-ornament.bottom-left  { bottom: 8px; left: 8px; border-bottom: 1px solid ${button}60; border-left: 1px solid ${button}60; }
    .corner-ornament.bottom-right { bottom: 8px; right: 8px; border-bottom: 1px solid ${button}60; border-right: 1px solid ${button}60; }

    /* Front card */
    .card-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.4rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${button};
      font-weight: 500;
      margin-bottom: 0.15cm;
    }

    .card-couple-names {
      font-family: 'Alex Brush', cursive;
      font-size: 1.5rem;
      color: ${text};
      font-weight: 400;
      line-height: 1.1;
      margin-bottom: 0.1cm;
    }

    .card-divider {
      display: flex;
      align-items: center;
      gap: 0.3cm;
      margin-bottom: 0.15cm;
    }
    .card-divider-sm {
      margin-bottom: 0.2cm;
    }
    .card-divider-line {
      display: block;
      width: 1.2cm;
      height: 1px;
      background: linear-gradient(to right, transparent, ${button}80, transparent);
    }
    .card-divider-heart {
      font-size: 0.5rem;
      color: ${button};
    }

    .card-qr {
      margin-bottom: 0.1cm;
    }
    .card-qr img {
      width: 1.6cm;
      height: 1.6cm;
      display: block;
    }

    .card-guest-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.55rem;
      color: ${text};
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 0.05cm;
    }

    .card-date {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.5rem;
      color: ${text}99;
      font-weight: 300;
      letter-spacing: 0.08em;
    }

    /* Back card */
    .card-back {
      background: #fff;
    }

    .card-greeting {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.55rem;
      color: ${text};
      font-weight: 600;
      margin-bottom: 0.05cm;
    }
    .card-nasi {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.42rem;
      color: ${text}99;
      font-weight: 400;
      font-style: italic;
      margin-bottom: 0.1cm;
    }

    .card-message {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.48rem;
      color: ${text}cc;
      font-weight: 300;
      font-style: italic;
      line-height: 1.6;
      text-align: center;
      max-width: 7cm;
      margin-bottom: 0.2cm;
    }

    .card-events-row {
      display: flex;
      gap: 0.4cm;
      margin-bottom: 0.2cm;
    }
    .card-event-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.06cm;
      flex: 1;
    }
    .card-event-item svg {
      color: ${button};
      flex-shrink: 0;
    }
    .card-event-time {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.35rem;
      font-weight: 500;
      color: ${text};
    }
    .card-event-address {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.3rem;
      color: ${text}80;
      text-align: center;
      line-height: 1.3;
    }

    .card-back-footer {
      text-align: center;
    }
    .card-back-couple {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.35rem;
      color: ${text}80;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.05cm;
    }
    .card-back-names {
      font-family: 'Alex Brush', cursive;
      font-size: 0.9rem;
      color: ${text};
    }

    /* Print styles */
    @media print {
      body { background: white; }
      .print-actions { display: none !important; }
      .print-page { padding: 0; gap: 0; }

      .cards-container {
        gap: 0;
        flex-direction: column;
        align-items: center;
      }

      .card-face {
        box-shadow: none;
        border-radius: 0;
        page-break-inside: avoid;
      }

      .card-front {
        margin-bottom: 0.5cm;
      }
    }
  `;
}

export default function CardPage() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get("guestId");
  const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [allGuests, setAllGuests] = useState<GuestData[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

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
          Se încarcă...
        </p>
      </div>
    );
  }

  if (!guest || !settings) {
    return (
      <div className="print-page">
        <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>
          Invitatul nu a fost găsit.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{buildStyles(settings)}</style>

      <div className="print-page">
        <div className="print-actions">
          <button className="print-btn print-btn-primary" onClick={() => window.print()}>
            Printează
          </button>
          <button className="print-btn print-btn-secondary" onClick={() => window.close()}>
            Închide
          </button>
        </div>

        <div className="cards-container" ref={printRef}>
          <CardFront guest={guest} partner={partner} settings={settings} qrDataUrl={qrDataUrl} />
          <CardBack guest={guest} partner={partner} settings={settings} />
        </div>
      </div>
    </>
  );
}
