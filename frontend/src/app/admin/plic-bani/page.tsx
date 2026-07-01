"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { safeToPng } from "@/utils/safari-png";
import { buildEnvelopePdf } from "@/utils/print-pdf";
import { FilePdf, Image as ImageIcon } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  ceremonie_data: string | null;
  color_main: string | null;
  color_second: string | null;
  color_button: string | null;
  color_text: string | null;
}

/* ─── Color utilities (same approach as the classic invitation page) ─── */
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
  };
}

/* ─── Net geometry (mm, viewBox 0 0 210 297 — A4 PORTRAIT sheet) ───
   3 EQUAL horizontal sections. Top & bottom fold over the middle → the finished
   envelope is read in LANDSCAPE (≈ 198 × 95) and holds the gift money. The top and
   bottom sections are drawn ROTATED 180° so they read upright once folded over.
   SUS    (rotit 180°): y 6..101   — monogramă „A & C" + „Vă mulțumim că ați fost alături de noi"
   MIJLOC (normal)    : y 101..196 — „Familia" + linie de completat
   JOS    (rotit 180°): y 196..291 — inimioara (sigiliul) */
const F = {
  serif: "'Cormorant Garamond', serif",
  script: "'Alex Brush', cursive",
  mont: "'Montserrat', sans-serif",
};

const FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Alex+Brush&family=Montserrat:wght@400;500;600;700&display=swap');";

const HEART_PATH =
  "M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z";

interface NetProps {
  c: ReturnType<typeof buildPalette>;
  iM: string;
  iC: string;
}

/* The full envelope net, rendered as a single SVG (shapes + text) so html2canvas
   captures it consistently — same reason the cards use SVG <text> for the monogram. */
function EnvelopeNet({ c, iM, iC }: NetProps) {
  return (
    <svg
      width={420}
      height={594}
      viewBox="0 0 210 297"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* paper fill — full bleed: the colour fills the whole A4 page */}
      <rect x={0} y={0} width={210} height={297} fill={c.bg} />

      {/* ── SUS section: printed UPSIDE-DOWN (180°) so it reads after folding down.
            On this flat sheet: monogram bottom-left, thank-you top-right (as asked). ── */}
      {/* monogram — centered */}
      <g transform="rotate(180 105 63)">
        <circle cx={105} cy={63} r={20} fill="none" stroke={c.ornament} strokeWidth={0.6} />
        <circle cx={105} cy={63} r={17} fill="none" stroke={c.ornament} strokeWidth={0.35} />
        <text x={105} y={68} textAnchor="middle" fontFamily={F.serif} fontSize={13.5} fontWeight={600} fill={c.primary}>
          <tspan>{iM}</tspan>
          <tspan dx={1.9} fontFamily={F.script} fontSize={8.5} fill={c.ornament}>&amp;</tspan>
          <tspan dx={1.9}>{iC}</tspan>
        </text>
      </g>
      {/* thank-you — centered, two lines (raised for more gap from the monogram) */}
      <g transform="rotate(180 105 21)">
        <text x={105} y={15} textAnchor="middle" fontFamily={F.serif} fontSize={8} fontStyle="italic" fill={c.primary}>Vă mulțumim</text>
        <text x={105} y={27} textAnchor="middle" fontFamily={F.serif} fontSize={8} fontStyle="italic" fill={c.primary}>că ați fost alături de noi</text>
      </g>

      {/* ── MIJLOC: front face — „Familia ____" (upright) ── */}
      <text x={105} y={132} textAnchor="middle" fontFamily={F.serif} fontSize={18} fontWeight={500} fill={c.primary}>Familia</text>
      <line x1={62} y1={176} x2={148} y2={176} stroke={c.ornament} strokeWidth={0.5} opacity={0.85} />

      {/* ── JOS: heart alone, centered. ROTATED 180° (reads upright once folded up). ── */}
      <g transform="rotate(180 105 247.5)">
        <g transform="translate(105 247.5) scale(0.32) translate(-25 -22)">
          <path d={HEART_PATH} fill={c.ornament} opacity={0.9} />
        </g>
      </g>
    </svg>
  );
}

export default function PlicBaniPage() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<"a4" | "a3">("a4");
  const [busy, setBusy] = useState(false);
  const netRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/wedding-settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((s) => setSettings(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSavePng = useCallback(async () => {
    if (!netRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await safeToPng(netRef.current);
      const link = document.createElement("a");
      link.download = "plic-de-dar.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!netRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await safeToPng(netRef.current);
      const blob = await buildEnvelopePdf(dataUrl, { format });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `plic-de-dar-${format}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build PDF:", err);
    } finally {
      setBusy(false);
    }
  }, [format]);

  if (loading) {
    return <p style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</p>;
  }

  const safe: WeddingSettings = settings ?? {
    nume_mire: "Cristi",
    nume_mireasa: "Ade",
    ceremonie_data: null,
    color_main: null,
    color_second: null,
    color_button: null,
    color_text: null,
  };

  const c = buildPalette(safe);
  const mireasa = safe.nume_mireasa || "Ade";
  const mire = safe.nume_mire || "Cristi";
  const iM = mireasa.charAt(0).toUpperCase();
  const iC = mire.charAt(0).toUpperCase();

  // Live finished dimensions (must mirror buildEnvelopePdf). Full-bleed A4 sheet
  // folded in 3 horizontal sections → finished envelope is landscape (full page
  // width × one third of the height).
  const page = format === "a3" ? { w: 297, h: 420 } : { w: 210, h: 297 };
  const finishedW = page.w;
  const finishedH = Math.round(page.h / 3);

  return (
    <div style={{ fontFamily: F.mont }}>
      <style>{`
        ${FONTS_IMPORT}
        .plic-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; font-family: 'Montserrat', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: ${c.secondary}; color: #fff; display: inline-flex; align-items: center; gap: 6px; }
        .plic-btn:hover:not(:disabled) { background: ${c.primary}; }
        .plic-btn:disabled { opacity: 0.5; cursor: default; }
        .plic-btn-secondary { background: ${c.bg}; color: ${c.secondary}; border: 1px solid ${c.ornament}; }
        .plic-select { padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8rem; font-family: 'Montserrat', sans-serif; font-weight: 500; border: 1px solid ${c.ornament}; background: ${c.bg}; color: ${c.secondary}; cursor: pointer; }
      `}</style>

      <h1 className="script-font text-3xl text-text-heading mb-1">Plic de dar</h1>
      <p className="text-sm text-text-muted mb-6">
        Template pe A4 portret, full-bleed (culoarea umple toată pagina), în 3 secțiuni orizontale. Sus (monogramă + „Vă mulțumim...") și jos (inimioara) sunt
        rotite 180°, ca să se citească drept după ce se pliază peste mijloc („Familia ____"). Plicul finit se citește în landscape și ține banii. Pliază în trei și lipește.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: c.secondary }}>
          Format hârtie:
          <select className="plic-select" value={format} onChange={(e) => setFormat(e.target.value as "a4" | "a3")}>
            <option value="a4">A4 portret (încape pe o pagină)</option>
            <option value="a3">A3 (plic mai mare)</option>
          </select>
        </label>
        <button className="plic-btn" onClick={handleDownloadPdf} disabled={busy}>
          <FilePdf size={16} weight="bold" /> Descarcă PDF
        </button>
        <button className="plic-btn plic-btn-secondary" onClick={handleSavePng} disabled={busy}>
          <ImageIcon size={16} weight="bold" /> Salvează PNG
        </button>
        <span style={{ fontSize: "0.75rem", color: c.muted }}>
          Plic finit: <strong>{finishedW} × {finishedH} mm</strong>
          {format === "a3" ? " (A3, landscape)" : " (landscape)"}
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Preview */}
        <div style={{ overflowX: "auto", padding: "1rem", background: "#fff", borderRadius: 12, border: `1px solid ${lighten(c.ornament, 40)}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div ref={netRef} style={{ display: "inline-block", background: "transparent" }}>
            <EnvelopeNet c={c} iM={iM} iC={iC} />
          </div>
        </div>

        {/* Legend + instructions */}
        <div style={{ flex: "1 1 220px", minWidth: 220, fontSize: "0.82rem", color: c.secondary, lineHeight: 1.7 }}>
          <p style={{ fontWeight: 700, color: c.primary, marginBottom: 8, fontFamily: F.mont, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.72rem" }}>Asamblare</p>
          <ol style={{ paddingLeft: "1.1rem", margin: 0 }}>
            <li>Tipărește pagina întreagă (full-bleed) și, la nevoie, taie marginea albă lăsată de imprimantă.</li>
            <li>Pliază secțiunea de jos (inimioara) în sus, peste mijloc — inimioara se va citi drept.</li>
            <li>Pune banii de dar.</li>
            <li>Pliază secțiunea de sus (monogramă + „Vă mulțumim") în jos, peste mijloc, și lipește marginile laterale — textul se va citi drept.</li>
          </ol>

          <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: c.muted }}>
            Plicul finit se ține în landscape: pe față rămâne „Familia ____", iar deasupra/dedesubt monograma, mesajul și inimioara (de aceea sus și jos sunt tipărite rotite 180°). Recomandare: tipărește pe carton (160–250 g/m²).
          </p>
        </div>
      </div>
    </div>
  );
}
