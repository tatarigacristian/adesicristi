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
  petrecere_ora: string | null;
  petrecere_adresa: string | null;
  petrecere_descriere: string | null;
  confirmare_pana_la: string | null;
  contact_info: string | null;
}

const defaultIntroLines = [
  "AVEM PLĂCEREA DE A VĂ INVITA SĂ FIȚI ALĂTURI DE NOI",
  "ÎN ZIUA ÎN CARE NE LEGĂM DESTINELE",
  "ȘI PĂȘIM ÎMPREUNĂ PE DRUMUL UNEI NOI VIEȚI.",
];

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
    return <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Se încarcă...</p>;
  }

  if (!guest || !settings) {
    return <p style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Invitatul nu a fost găsit.</p>;
  }

  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const initialMireasa = mireasa.charAt(0).toUpperCase();
  const initialMire = mire.charAt(0).toUpperCase();

  const ceremonieDateObj = settings.ceremonie_data ? new Date(settings.ceremonie_data) : null;
  const dayOfWeek = ceremonieDateObj
    ? ceremonieDateObj.toLocaleDateString("ro-RO", { weekday: "long" }).toUpperCase()
    : "SÂMBĂTĂ";
  const dateFormatted = ceremonieDateObj
    ? `${String(ceremonieDateObj.getDate()).padStart(2, "0")}/${String(ceremonieDateObj.getMonth() + 1).padStart(2, "0")}`
    : "00/00";
  const year = ceremonieDateObj ? ceremonieDateObj.getFullYear().toString() : "2026";

  const confirmareDate = settings.confirmare_pana_la
    ? new Date(settings.confirmare_pana_la).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : "";

  // Use guest intro_long or default text
  const introLines = guest.intro_long
    ? guest.intro_long.split("\n").filter((l) => l.trim())
    : defaultIntroLines;

  const guestDisplayName = partner
    ? guest.nume === partner.nume
      ? `${guest.prenume} și ${partner.prenume} ${guest.nume}`
      : `${guest.prenume} ${guest.nume} și ${partner.prenume} ${partner.nume}`
    : `${guest.prenume} ${guest.nume}`;

  const s = {
    mont: "'Montserrat', sans-serif" as const,
    upper: "uppercase" as const,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Alex+Brush&family=Montserrat:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f5f5f5; font-family: 'Montserrat', sans-serif; }
        .inv-page { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; gap: 1.5rem; }
        .inv-actions { display: flex; gap: 0.75rem; }
        .inv-btn { padding: 0.5rem 1.5rem; border-radius: 0.5rem; font-size: 0.85rem; font-family: 'Montserrat', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: #333; color: #fff; }
        .inv-btn:hover { background: #555; }
        .inv-btn-secondary { background: #fff; color: #333; border: 1px solid #999; }
        .inv-btn-secondary:hover { background: #f0f0f0; }
        @media print {
          body { background: white; }
          .inv-actions { display: none !important; }
          .inv-page { padding: 0; }
        }
      `}</style>

      <div className="inv-page">
        <div className="inv-actions">
          <button className="inv-btn" onClick={() => window.print()}>Printează</button>
          <button className="inv-btn inv-btn-secondary" onClick={() => window.close()}>Închide</button>
        </div>

        <div
          style={{
            width: "14cm",
            minHeight: "20cm",
            background: "#fff",
            border: "1px solid #333",
            padding: "1.8cm 1.5cm",
            fontFamily: "'Cormorant Garamond', serif",
            color: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "0.3cm",
          }}
        >
          {/* Monogram */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4cm", marginBottom: "0.2cm" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 300, letterSpacing: "0.1em" }}>{initialMireasa}</span>
            <span style={{ fontSize: "1.2rem", fontWeight: 300, color: "#666" }}>|</span>
            <span style={{ fontSize: "1.8rem", fontWeight: 300, letterSpacing: "0.1em" }}>{initialMire}</span>
          </div>

          {/* Intro */}
          <p style={{ fontSize: "0.55rem", fontFamily: s.mont, letterSpacing: "0.2em", textTransform: s.upper, fontWeight: 400, color: "#333" }}>
            CU INIMILE PLINI DE BUCURIE,
          </p>

          <p style={{ fontSize: "0.55rem", fontFamily: s.mont, letterSpacing: "0.15em", textTransform: s.upper, fontWeight: 500, color: "#1a1a1a", marginTop: "0.2cm" }}>
            ÎMPREUNĂ CU PĂRINȚII NOȘTRI,
          </p>

          {/* Parents */}
          {(() => {
            const parintiMireasa = settings.tata_mireasa_prenume
              ? `${settings.tata_mireasa_prenume} și ${settings.mama_mireasa_prenume} ${settings.tata_mireasa_nume}`
              : settings.parinti_mireasa;
            const parintiMire = settings.tata_mire_prenume
              ? `${settings.tata_mire_prenume} și ${settings.mama_mire_prenume} ${settings.tata_mire_nume}`
              : settings.parinti_mire;
            if (!parintiMireasa && !parintiMire) return null;
            return (
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5cm", width: "100%", marginTop: "0.1cm" }}>
                {parintiMireasa && (
                  <p style={{ fontSize: "0.5rem", fontFamily: s.mont, letterSpacing: "0.1em", textTransform: s.upper, fontWeight: 400, color: "#444" }}>
                    {parintiMireasa}
                  </p>
                )}
                {parintiMire && (
                  <p style={{ fontSize: "0.5rem", fontFamily: s.mont, letterSpacing: "0.1em", textTransform: s.upper, fontWeight: 400, color: "#444" }}>
                    {parintiMire}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Nasi */}
          {(settings.nas_prenume || settings.nasa_prenume) && (
            <>
              <p style={{ fontSize: "0.55rem", fontFamily: s.mont, letterSpacing: "0.15em", textTransform: s.upper, fontWeight: 500, color: "#1a1a1a", marginTop: "0.15cm" }}>
                ȘI ALĂTURI DE NAȘII,
              </p>
              <p style={{ fontSize: "0.5rem", fontFamily: s.mont, letterSpacing: "0.1em", textTransform: s.upper, fontWeight: 400, color: "#444" }}>
                {settings.nasa_prenume} ȘI {settings.nas_prenume} {settings.nasa_nume === settings.nas_nume ? settings.nas_nume : `${settings.nasa_nume} & ${settings.nas_nume}`},
              </p>
            </>
          )}

          {/* Guest-specific invitation text (from intro_long) */}
          <div style={{ marginTop: "0.3cm", lineHeight: 1.8 }}>
            {introLines.map((line, i) => (
              <p key={i} style={{ fontSize: "0.5rem", fontFamily: s.mont, letterSpacing: "0.12em", textTransform: s.upper, fontWeight: 400, color: "#333" }}>
                {line}
              </p>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "5cm", height: "1px", background: "linear-gradient(to right, transparent, #999, transparent)", margin: "0.3cm 0" }} />

          {/* Date */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3cm" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: s.mont, letterSpacing: "0.2em", fontWeight: 600 }}>{dayOfWeek}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 300, color: "#999" }}>|</span>
            <span style={{ fontSize: "0.65rem", fontFamily: s.mont, letterSpacing: "0.15em", fontWeight: 600 }}>{dateFormatted}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 300, color: "#999" }}>|</span>
            <span style={{ fontSize: "0.65rem", fontFamily: s.mont, letterSpacing: "0.15em", fontWeight: 600 }}>{year}</span>
          </div>

          {/* Events */}
          <div style={{ marginTop: "0.3cm", lineHeight: 2 }}>
            {settings.ceremonie_ora && (
              <>
                <p style={{ fontSize: "0.45rem", fontFamily: s.mont, letterSpacing: "0.15em", textTransform: s.upper, fontWeight: 500, color: "#1a1a1a" }}>
                  {settings.ceremonie_descriere || "CUNUNIA RELIGIOASĂ"} — ORA {settings.ceremonie_ora}
                </p>
                {settings.ceremonie_adresa && (
                  <p style={{ fontSize: "0.42rem", fontFamily: s.mont, letterSpacing: "0.1em", textTransform: s.upper, fontWeight: 300, color: "#555" }}>
                    {settings.ceremonie_adresa}
                  </p>
                )}
              </>
            )}
            {settings.petrecere_ora && (
              <>
                <p style={{ fontSize: "0.45rem", fontFamily: s.mont, letterSpacing: "0.15em", textTransform: s.upper, fontWeight: 500, color: "#1a1a1a", marginTop: "0.15cm" }}>
                  {settings.petrecere_descriere || "PETRECEREA"} — ORA {settings.petrecere_ora}
                </p>
                {settings.petrecere_adresa && (
                  <p style={{ fontSize: "0.42rem", fontFamily: s.mont, letterSpacing: "0.1em", textTransform: s.upper, fontWeight: 300, color: "#555" }}>
                    {settings.petrecere_adresa}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Script closing */}
          <p style={{ fontFamily: "'Alex Brush', cursive", fontSize: "1.4rem", color: "#1a1a1a", marginTop: "0.4cm" }}>
            Vă așteptăm cu drag!
          </p>

          {/* RSVP */}
          {confirmareDate && (
            <div style={{ marginTop: "0.2cm" }}>
              <p style={{ fontSize: "0.4rem", fontFamily: s.mont, letterSpacing: "0.12em", textTransform: s.upper, fontWeight: 400, color: "#555" }}>
                VĂ RUGĂM SĂ NE CONFIRMAȚI PREZENȚA DUMNEAVOASTRĂ
              </p>
              <p style={{ fontSize: "0.4rem", fontFamily: s.mont, letterSpacing: "0.12em", textTransform: s.upper, fontWeight: 400, color: "#555" }}>
                PÂNĂ ÎN DATA DE {confirmareDate.toUpperCase()}.
              </p>
            </div>
          )}

          {/* Contact info */}
          {settings.contact_info && (
            <div style={{ marginTop: "0.3cm", borderTop: "1px solid #ddd", paddingTop: "0.2cm", width: "100%" }}>
              {settings.contact_info.split("\n").map((line, i) => (
                <p key={i} style={{ fontSize: "0.35rem", fontFamily: s.mont, letterSpacing: "0.08em", fontWeight: 400, color: "#666" }}>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function InvitatiePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif", color: "#999" }}>Se încarcă...</div>}>
      <InvitatieContent />
    </Suspense>
  );
}
