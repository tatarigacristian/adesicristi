"use client";

import { Church, Bus, Champagne } from "@phosphor-icons/react";
import { getInvitationAudience, getGreeting, getAlaturiLine, getDefaultIntroShort } from "@/utils/invitation-text";

export interface PCGuestData {
  id: number;
  nume: string;
  prenume: string;
  intro_short?: string | null;
  slug: string | null;
  sex: "M" | "F" | null;
  children?: { id: number; nume: string; prenume: string }[];
}

export interface PCPartnerData {
  nume: string;
  prenume: string;
}

export interface PCWeddingSettings {
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
  transport_ora: string | null;
  transport_adresa: string | null;
  petrecere_ora: string | null;
  petrecere_adresa: string | null;
  confirmare_pana_la: string | null;
  telefon_mireasa: string | null;
  telefon_mire: string | null;
  color_main: string | null;
  color_button: string | null;
  color_text: string | null;
}

function hexToRgb(hex: string) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
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

function buildPalette(settings: PCWeddingSettings) {
  const bg = settings.color_main || "#FDFBF8";
  const text = settings.color_text || "#2C2622";
  const accent = settings.color_button || "#C4B5A0";
  return { primary: text, secondary: lighten(text, 25), muted: lighten(text, 45), ornament: accent, bg, bgOuter: darken(bg, 5) };
}

function CornerOrnament({ style, color }: { style: React.CSSProperties; color: string }) {
  return (
    <svg style={{ position: "absolute", ...style }} viewBox="0 0 80 80" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L2 28 Q4 18, 12 12 Q18 8, 28 6 Q36 4, 40 2 Z" fill="none" stroke={color} strokeWidth="0.6" />
      <path d="M2 2 Q8 12, 16 18 Q22 24, 32 28" fill="none" stroke={color} strokeWidth="0.5" />
      <path d="M2 6 Q10 10, 14 16 Q18 22, 24 24" fill="none" stroke={color} strokeWidth="0.4" />
      <circle cx="8" cy="8" r="1.2" fill={color} />
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
    <svg viewBox="0 0 200 12" style={{ width: 168, height: 10 }} xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2="70" y2="6" stroke={color} strokeWidth="0.4" />
      <line x1="130" y1="6" x2="200" y2="6" stroke={color} strokeWidth="0.4" />
      <path d="M80 6 Q90 1, 100 6 Q110 11, 120 6" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="100" cy="6" r="1.5" fill={color} />
    </svg>
  );
}

export function PersonalisatClassicCard({ guest, partner, settings, generic = false }: { guest: PCGuestData; partner: PCPartnerData | null; settings: PCWeddingSettings; generic?: boolean }) {
  const mireasa = settings.nume_mireasa || "Ade";
  const mire = settings.nume_mire || "Cristi";
  const initialMireasa = mireasa.charAt(0).toUpperCase();
  const initialMire = mire.charAt(0).toUpperCase();

  const ceremonieDateObj = settings.ceremonie_data ? new Date(settings.ceremonie_data) : null;
  const dayOfWeek = ceremonieDateObj ? ceremonieDateObj.toLocaleDateString("ro-RO", { weekday: "long" }).toUpperCase() : "SÂMBĂTĂ";
  const dateFormatted = ceremonieDateObj ? `${String(ceremonieDateObj.getDate()).padStart(2, "0")}.${String(ceremonieDateObj.getMonth() + 1).padStart(2, "0")}` : "00.00";
  const year = ceremonieDateObj ? ceremonieDateObj.getFullYear().toString() : "2026";
  const confirmareDate = settings.confirmare_pana_la ? new Date(settings.confirmare_pana_la).toLocaleDateString("ro-RO", { day: "numeric", month: "long" }) : "";

  const c = buildPalette(settings);
  const audience = generic
    ? getInvitationAudience(true, null)
    : getInvitationAudience(!!partner || !!(guest.children && guest.children.length > 0), guest.sex ?? null);
  const f = { mont: "'Montserrat', sans-serif" as const, serif: "'Cormorant Garamond', serif" as const, script: "'Alex Brush', cursive" as const, upper: "uppercase" as const };

  const parintiMireasaNames = settings.tata_mireasa_prenume ? `${settings.mama_mireasa_prenume} și ${settings.tata_mireasa_prenume}` : null;
  const parintiMireasaFamilie = settings.tata_mireasa_nume || null;
  const parintiMireasaFallback = settings.parinti_mireasa;
  const parintiMireNames = settings.tata_mire_prenume ? `${settings.mama_mire_prenume} și ${settings.tata_mire_prenume}` : null;
  const parintiMireFamilie = settings.tata_mire_nume || null;
  const parintiMireFallback = settings.parinti_mire;
  const hasParinti = parintiMireasaNames || parintiMireasaFallback || parintiMireNames || parintiMireFallback;

  const nasiText = settings.nas_prenume && settings.nasa_prenume
    ? settings.nasa_nume === settings.nas_nume
      ? `${settings.nasa_prenume} și ${settings.nas_prenume} ${settings.nas_nume}`
      : `${settings.nasa_prenume} ${settings.nasa_nume} și ${settings.nas_prenume} ${settings.nas_nume}`
    : null;
  const hasNasi = !!nasiText;

  return (
    <div style={{ position: "relative", padding: "10px", background: "transparent", fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: "15cm", minHeight: "30cm", background: c.bg, padding: "0.3cm", position: "relative" }}>
        <div style={{ border: `1px solid ${c.ornament}`, padding: "1cm 0.6cm", minHeight: "calc(30cm - 0.6cm)", fontFamily: f.serif, color: c.primary, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.3cm", position: "relative" }}>
          <CornerOrnament color={c.ornament} style={{ top: -2, left: -2 }} />
          <CornerOrnament color={c.ornament} style={{ top: -2, right: -2, transform: "scaleX(-1)" }} />
          <CornerOrnament color={c.ornament} style={{ bottom: -2, left: -2, transform: "scaleY(-1)" }} />
          <CornerOrnament color={c.ornament} style={{ bottom: -2, right: -2, transform: "scale(-1, -1)" }} />
          <div style={{ marginBottom: "0.2cm", marginTop: "0.1cm" }}>
            <svg width="200" height="200" viewBox="0 0 160 160" style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="72" stroke={c.ornament} strokeWidth="0.6" fill="none" />
              <circle cx="80" cy="80" r="64" stroke={c.ornament} strokeWidth="0.4" fill="none" />
              <path d="M80 4 Q72 4, 64 9 Q58 13, 64 17 Q70 14, 76 10 Q78 8, 80 7 Q82 8, 84 10 Q90 14, 96 17 Q102 13, 96 9 Q88 4, 80 4Z" fill={c.ornament} />
              <path d="M80 156 Q72 156, 64 151 Q58 147, 64 143 Q70 146, 76 150 Q78 152, 80 153 Q82 152, 84 150 Q90 146, 96 143 Q102 147, 96 151 Q88 156, 80 156Z" fill={c.ornament} />
              <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fontFamily={f.serif} fontSize="44" fontWeight="500" fill={c.primary}>
                <tspan>{initialMireasa}</tspan>
                <tspan dx="4" fontFamily={f.script} fontSize="38" fontWeight="400" fill={c.muted}>&amp;</tspan>
                <tspan dx="4">{initialMire}</tspan>
              </text>
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "0.15cm" }}>
            <span style={{ display: "block", width: 40, height: 1, background: `linear-gradient(to right, transparent, ${c.ornament}, transparent)` }} />
            <svg viewBox="0 0 50 48" style={{ width: 20, height: 20 }} fill="none" stroke={c.ornament} xmlns="http://www.w3.org/2000/svg">
              <path d="M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z" strokeWidth="1.2" fill={c.ornament} />
            </svg>
            <span style={{ display: "block", width: 40, height: 1, background: `linear-gradient(to right, transparent, ${c.ornament}, transparent)` }} />
          </div>
          <div style={{ textAlign: "center", marginBottom: "0.15cm" }}>
            <p style={{ fontFamily: f.serif, fontSize: "1.81rem", fontWeight: 700, color: c.primary, letterSpacing: "0.03em", margin: 0 }}>
              {getGreeting(audience, true, guest.slug)}{generic ? "" : ","}
            </p>
            {!generic && (
              <p style={{ fontFamily: f.serif, fontSize: "1.81rem", fontWeight: 700, color: c.primary, letterSpacing: "0.03em", margin: 0 }}>
                {(() => {
                  const childNames = guest.children && guest.children.length > 0 ? guest.children.map((cc) => cc.prenume) : [];
                  if (partner) {
                    const same = guest.nume === partner.nume;
                    const allNames = [guest.prenume, partner.prenume, ...childNames];
                    const last = allNames.pop()!;
                    return same ? `${allNames.join(", ")} și ${last} ${guest.nume}` : `${allNames.join(", ")} și ${last}`;
                  }
                  return `${guest.prenume} ${guest.nume}`;
                })()}
              </p>
            )}
          </div>
          {(hasNasi || hasParinti) && (
            <div style={{ textAlign: "center", marginBottom: "0.1cm", width: "100%" }}>
              <p style={{ fontSize: "0.85rem", fontFamily: f.mont, letterSpacing: "0.2em", textTransform: f.upper, fontWeight: 700, color: c.muted, marginBottom: "0.15cm" }}>
                {hasNasi && hasParinti ? "ALĂTURI DE NAȘI ȘI PĂRINȚI" : hasNasi ? "ALĂTURI DE NAȘII" : "ÎMPREUNĂ CU PĂRINȚII"}
              </p>
              {hasNasi && (
                <p style={{ fontFamily: f.serif, fontSize: "1.25rem", fontWeight: 700, fontStyle: "italic", color: c.secondary, margin: "0 0 0.15cm 0" }}>{nasiText}</p>
              )}
              {hasParinti && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", gap: "0.6cm", fontFamily: f.serif, fontSize: "1.1rem", fontWeight: 700, fontStyle: "italic", color: c.secondary }}>
                  {(parintiMireasaNames || parintiMireasaFallback) && (
                    <div style={{ flex: "0 1 auto", textAlign: "center" }}>
                      {parintiMireasaNames ? (
                        <>
                          <div>{parintiMireasaNames}</div>
                          {parintiMireasaFamilie && <div>{parintiMireasaFamilie}</div>}
                        </>
                      ) : (
                        <div>{parintiMireasaFallback}</div>
                      )}
                    </div>
                  )}
                  {(parintiMireNames || parintiMireFallback) && (
                    <div style={{ flex: "0 1 auto", textAlign: "center" }}>
                      {parintiMireNames ? (
                        <>
                          <div>{parintiMireNames}</div>
                          {parintiMireFamilie && <div>{parintiMireFamilie}</div>}
                        </>
                      ) : (
                        <div>{parintiMireFallback}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <p style={{ fontFamily: f.serif, fontSize: "1.81rem", fontWeight: 700, color: c.primary, letterSpacing: "0.03em", marginTop: "0.2cm", margin: "0.2cm 0 0 0" }}>{getAlaturiLine(audience)}</p>
          {!generic && (
            <div>
              {(guest.intro_short || getDefaultIntroShort(audience)).split("\n").filter((l) => l.trim()).map((line, i) => (
                <p key={i} style={{ fontSize: "1.4rem", fontFamily: f.serif, fontWeight: 600, fontStyle: "italic", color: c.secondary, letterSpacing: "0.02em", margin: 0, lineHeight: 1.4 }}>{line}</p>
              ))}
            </div>
          )}
          <div style={{ marginBottom: "0.1cm", marginTop: "0.1cm" }}><Flourish width={252} color={c.ornament} /></div>
          <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingBottom: "5px" }}>
            <svg width="336" height="28" viewBox="0 0 240 20" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", overflow: "visible" }}>
              <text x="90" y="15" textAnchor="end" fontFamily={f.mont} fontSize="12" fontWeight="900" style={{ letterSpacing: "0.3em" }} fill={c.primary}>{dayOfWeek}</text>
              <line x1="103" y1="5" x2="103" y2="17" stroke={c.ornament} strokeWidth="1" />
              <text x="140" y="15" textAnchor="middle" fontFamily={f.mont} fontSize="12" fontWeight="900" style={{ letterSpacing: "0.2em" }} fill={c.primary}>{dateFormatted}</text>
              <line x1="178" y1="5" x2="178" y2="17" stroke={c.ornament} strokeWidth="1" />
              <text x="190" y="15" textAnchor="start" fontFamily={f.mont} fontSize="12" fontWeight="900" style={{ letterSpacing: "0.2em" }} fill={c.primary}>{year}</text>
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.6cm", marginTop: "0.3cm", width: "100%" }}>
            {settings.ceremonie_ora && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.1cm" }}>
                <Church size={44} weight="duotone" color={c.muted} />
                <p style={{ fontSize: "1.2rem", fontFamily: f.mont, fontWeight: 800, color: c.primary, letterSpacing: "0.05em", marginTop: "0.08cm" }}>ora {settings.ceremonie_ora}</p>
                {settings.ceremonie_adresa && <p style={{ fontSize: "0.82rem", fontFamily: f.mont, fontWeight: 600, color: c.muted, textAlign: "center" }}>{settings.ceremonie_adresa}</p>}
              </div>
            )}
            {settings.transport_ora && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.1cm" }}>
                <Bus size={44} weight="duotone" color={c.muted} />
                <p style={{ fontSize: "1.2rem", fontFamily: f.mont, fontWeight: 800, color: c.primary, letterSpacing: "0.05em", marginTop: "0.08cm" }}>ora {settings.transport_ora}</p>
                {settings.transport_adresa && <p style={{ fontSize: "0.82rem", fontFamily: f.mont, fontWeight: 600, color: c.muted, textAlign: "center" }}>{settings.transport_adresa}</p>}
              </div>
            )}
            {settings.petrecere_ora && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.1cm" }}>
                <Champagne size={44} weight="duotone" color={c.muted} />
                <p style={{ fontSize: "1.2rem", fontFamily: f.mont, fontWeight: 800, color: c.primary, letterSpacing: "0.05em", marginTop: "0.08cm" }}>ora {settings.petrecere_ora}</p>
                {settings.petrecere_adresa && <p style={{ fontSize: "0.82rem", fontFamily: f.mont, fontWeight: 600, color: c.muted, textAlign: "center" }}>{settings.petrecere_adresa}</p>}
              </div>
            )}
          </div>
          {confirmareDate && (
            <p style={{ fontSize: "0.7rem", fontFamily: f.mont, letterSpacing: "0.15em", textTransform: f.upper, fontWeight: 700, color: c.muted, marginTop: "0.3cm" }}>
              {audience.hasPartner ? "Vă rugăm să confirmați" : "Te rugăm să confirmi"} până la {confirmareDate}
            </p>
          )}
          {(settings.telefon_mireasa || settings.telefon_mire) && (
            <div style={{ marginTop: "0.15cm", paddingTop: "5px", width: "80%" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.1cm" }}><SmallFlourish color={c.ornament} /></div>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.6cm" }}>
                {settings.telefon_mireasa && <p style={{ fontSize: "0.78rem", fontFamily: f.mont, letterSpacing: "0.1em", fontWeight: 700, color: c.muted }}>{mireasa}: {settings.telefon_mireasa}</p>}
                {settings.telefon_mire && <p style={{ fontSize: "0.78rem", fontFamily: f.mont, letterSpacing: "0.1em", fontWeight: 700, color: c.muted }}>{mire}: {settings.telefon_mire}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
