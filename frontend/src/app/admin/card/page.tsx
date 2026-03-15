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
  ceremonie_data: string | null;
  ceremonie_ora: string | null;
  ceremonie_adresa: string | null;
  ceremonie_descriere: string | null;
  petrecere_adresa: string | null;
  petrecere_descriere: string | null;
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
        {/* Top ornament */}
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        <p className="card-label">Ne casatorim!</p>

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
          {guest.prenume} {guest.nume}
          {partner && <> & {partner.prenume} {partner.nume}</>}
        </p>

        <p className="card-date">{dateDisplay}</p>
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

  // Build intro message
  const guestNames = partner
    ? `${guest.prenume} & ${partner.prenume}`
    : guest.prenume;

  const introText = guest.intro
    ? guest.intro
    : `Ne-ar face o deosebita placere sa fiti alaturi de noi in aceasta zi speciala.`;

  const locationLine = settings.petrecere_adresa || settings.ceremonie_adresa || "";

  return (
    <div className="card-face card-back">
      <div className="card-inner">
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <div className="corner-ornament bottom-left" />
        <div className="corner-ornament bottom-right" />

        <p className="card-label">Invitatie</p>

        <div className="card-divider card-divider-sm">
          <span className="card-divider-line" />
          <span className="card-divider-heart">&#9829;</span>
          <span className="card-divider-line" />
        </div>

        <p className="card-greeting">
          {partner ? "Dragii nostri" : "Draga"} {guestNames},
        </p>

        <p className="card-message">{introText}</p>

        {locationLine && (
          <div className="card-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{locationLine}</span>
          </div>
        )}

        <div className="card-back-footer">
          <p className="card-back-couple">Cu drag,</p>
          <p className="card-back-names">{mireasa} & {mire}</p>
        </div>
      </div>
    </div>
  );
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

        if (guestsRes.ok) {
          const guests: GuestData[] = await guestsRes.json();
          setAllGuests(guests);
          const found = guests.find((g) => g.id === parseInt(guestId!));
          if (found) {
            setGuest(found);

            if (found.slug) {
              const url = `${SITE_URL}/${found.slug}`;
              const dataUrl = await QRCode.toDataURL(url, {
                width: 512,
                margin: 2,
                color: { dark: "#2c2c2c", light: "#ffffff" },
              });
              setQrDataUrl(dataUrl);
            }
          }
        }

        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Alex+Brush&family=Montserrat:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #f5f3f0;
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
          background: #c9a87c;
          color: white;
        }
        .print-btn-primary:hover { background: #b8946a; }

        .print-btn-secondary {
          background: white;
          color: #555;
          border: 1px solid #ddd;
        }
        .print-btn-secondary:hover { background: #f9f7f5; }

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
        .corner-ornament.top-left     { top: 8px; left: 8px; border-top: 1px solid #c9a87c40; border-left: 1px solid #c9a87c40; }
        .corner-ornament.top-right    { top: 8px; right: 8px; border-top: 1px solid #c9a87c40; border-right: 1px solid #c9a87c40; }
        .corner-ornament.bottom-left  { bottom: 8px; left: 8px; border-bottom: 1px solid #c9a87c40; border-left: 1px solid #c9a87c40; }
        .corner-ornament.bottom-right { bottom: 8px; right: 8px; border-bottom: 1px solid #c9a87c40; border-right: 1px solid #c9a87c40; }

        /* Front card */
        .card-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.4rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #c9a87c;
          font-weight: 500;
          margin-bottom: 0.15cm;
        }

        .card-couple-names {
          font-family: 'Alex Brush', cursive;
          font-size: 1.5rem;
          color: #2c2c2c;
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
          background: linear-gradient(to right, transparent, #c9a87c60, transparent);
        }
        .card-divider-heart {
          font-size: 0.5rem;
          color: #c9a87c80;
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
          color: #2c2c2c;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 0.05cm;
        }

        .card-date {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.5rem;
          color: #888;
          font-weight: 300;
          letter-spacing: 0.08em;
        }

        /* Back card */
        .card-back {
          background: #fdfcfa;
        }

        .card-greeting {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.55rem;
          color: #2c2c2c;
          font-weight: 600;
          margin-bottom: 0.15cm;
        }

        .card-message {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.48rem;
          color: #555;
          font-weight: 300;
          font-style: italic;
          line-height: 1.6;
          text-align: center;
          max-width: 7cm;
          margin-bottom: 0.2cm;
        }

        .card-location {
          display: flex;
          align-items: center;
          gap: 0.15cm;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.38rem;
          color: #888;
          margin-bottom: 0.25cm;
          padding: 0.12cm 0.4cm;
          background: #f5f3f0;
          border-radius: 4px;
        }
        .card-location svg {
          flex-shrink: 0;
          color: #c9a87c;
        }

        .card-back-footer {
          text-align: center;
        }
        .card-back-couple {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.35rem;
          color: #aaa;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 0.05cm;
        }
        .card-back-names {
          font-family: 'Alex Brush', cursive;
          font-size: 0.9rem;
          color: #2c2c2c;
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
            border: 1px solid #eee;
            border-radius: 0;
            page-break-inside: avoid;
          }

          .card-front {
            margin-bottom: 0.5cm;
          }
        }
      `}</style>

      <div className="print-page">
        <div className="print-actions">
          <button className="print-btn print-btn-primary" onClick={() => window.print()}>
            Printeaza
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
    </>
  );
}
