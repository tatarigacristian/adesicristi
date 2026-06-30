"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { safeToPng } from "@/utils/safari-png";
import { buildEnvelopePdf } from "@/utils/print-pdf";
import { FilePdf, Image as ImageIcon, Scissors } from "@phosphor-icons/react";

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

/* ─── Net geometry (mm, viewBox 0 0 250 231 — landscape DL) ───
   FACE   : x 15..235, y 55..165  (220 × 110 finished = DL)
   TOP flap (seal) : y 0..55,  folds down to the back to close
   BOTTOM flap     : y 165..231, folds up to form the back panel
   SIDE flaps      : x 0..15 and 235..250, fold in (glued under bottom flap)   */
const F = {
  serif: "'Cormorant Garamond', serif",
  script: "'Alex Brush', cursive",
  mont: "'Montserrat', sans-serif",
};

const FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Alex+Brush&family=Montserrat:wght@400;500;600;700&display=swap');";

const HEART_PATH =
  "M25,42 C25,42 4,29 4,15 C4,7 11,3 18,7 C21,9 25,14 25,14 C25,14 29,9 32,7 C39,3 46,7 46,15 C46,29 25,42 25,42 Z";

/* Outer cut contour, clockwise from the seal-flap tip */
const CONTOUR =
  "M118,8 L132,8 L235,55 L248,63 L248,157 L235,165 L228,231 L22,231 L15,165 L2,157 L2,63 L15,55 Z";

interface NetProps {
  c: ReturnType<typeof buildPalette>;
  iM: string;
  iC: string;
  dateStr: string;
}

/* The full envelope net, rendered as a single SVG (shapes + text) so html2canvas
   captures it consistently — same reason the cards use SVG <text> for the monogram. */
function EnvelopeNet({ c, iM, iC, dateStr }: NetProps) {
  const cut = c.ornament;
  const fold = c.ornament;
  return (
    <svg
      width={500}
      height={462}
      viewBox="0 0 250 231"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* 1 ─ paper fill (everything inside the cut line is the envelope paper color) */}
      <path d={CONTOUR} fill={c.bg} stroke="none" />

      {/* 2 ─ subtle inner frame on the face */}
      <rect x={21} y={61} width={208} height={98} rx={2} fill="none" stroke={c.ornament} strokeWidth={0.3} opacity={0.5} />

      {/* 3 ─ seal-flap ornament (a small heart, drawn upside-down so it reads
              upright on the back once the flap is folded down) */}
      <g transform="rotate(180 125 30)">
        <g transform="translate(125 30) scale(0.13) translate(-25 -24)">
          <path d={HEART_PATH} fill={c.ornament} opacity={0.85} />
        </g>
      </g>

      {/* 5 ─ FACE decoration (front of the finished envelope) */}
      {/* monogram — initials sized to sit inside the inner circle (Ø28); baseline
          placed explicitly (no dominant-baseline) so it centers identically in the
          browser and in html2canvas/PDF */}
      <circle cx={125} cy={84} r={16} fill="none" stroke={c.ornament} strokeWidth={0.45} />
      <circle cx={125} cy={84} r={14} fill="none" stroke={c.ornament} strokeWidth={0.28} />
      <text x={125} y={87.4} textAnchor="middle" fontFamily={F.serif} fontSize={10} fontWeight={600} fill={c.primary}>
        <tspan>{iM}</tspan>
        <tspan dx={1.2} fontFamily={F.script} fontSize={6} fill={c.ornament}>&amp;</tspan>
        <tspan dx={1.2}>{iC}</tspan>
      </text>

      {/* date — moved up into the spot the heart used to occupy */}
      <text x={125} y={117} textAnchor="middle" fontFamily={F.mont} fontSize={4.5} fontWeight={600} letterSpacing={1} fill={c.secondary}>{dateStr}</text>

      {/* thank-you message */}
      <text x={125} y={132} textAnchor="middle" fontFamily={F.serif} fontSize={6.2} fontStyle="italic" fill={c.primary}>Mulțumim că ați fost alături de noi</text>

      {/* "din partea" — label and writing line on the same baseline (fill-in field) */}
      <text x={68} y={151} textAnchor="start" fontFamily={F.mont} fontSize={3} fontWeight={600} letterSpacing={0.6} fill={c.muted}>DIN PARTEA</text>
      <line x1={102} y1={151} x2={182} y2={151} stroke={c.ornament} strokeWidth={0.3} opacity={0.7} />

      {/* 6 ─ fold lines (dashed) — the four edges of the face, kept barely visible */}
      <g stroke={fold} strokeWidth={0.25} strokeDasharray="1.5 2.5" opacity={0.15} fill="none">
        <line x1={15} y1={55} x2={235} y2={55} />
        <line x1={15} y1={165} x2={235} y2={165} />
        <line x1={15} y1={55} x2={15} y2={165} />
        <line x1={235} y1={55} x2={235} y2={165} />
      </g>

      {/* 7 ─ cut contour (solid, on top so it stays crisp) */}
      <path d={CONTOUR} fill="none" stroke={cut} strokeWidth={0.6} strokeLinejoin="round" />
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
  const dObj = safe.ceremonie_data ? new Date(safe.ceremonie_data) : null;
  const dateStr = dObj
    ? `${String(dObj.getDate()).padStart(2, "0")}.${String(dObj.getMonth() + 1).padStart(2, "0")}.${dObj.getFullYear()}`
    : "04.07.2026";

  // Live finished dimensions (must mirror buildEnvelopePdf).
  const NET_W = 250, NET_H = 231, MARGIN = 6;
  const page = format === "a3" ? { w: 420, h: 297 } : { w: 297, h: 210 };
  const scale = Math.min((page.w - 2 * MARGIN) / NET_W, (page.h - 2 * MARGIN) / NET_H, 1);
  const finishedW = Math.round(220 * scale);
  const finishedH = Math.round(110 * scale);

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
        Template desfășurat de plic DL, în culorile site-ului. Descarcă, taie pe conturul continuu, pliază pe liniile punctate și lipește.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: c.secondary }}>
          Format hârtie:
          <select className="plic-select" value={format} onChange={(e) => setFormat(e.target.value as "a4" | "a3")}>
            <option value="a4">A4 (încape pe o pagină)</option>
            <option value="a3">A3 (plic la dimensiune DL reală)</option>
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
          {format === "a3" ? " (DL real)" : " (~A4)"}
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Preview */}
        <div style={{ overflowX: "auto", padding: "1rem", background: "#fff", borderRadius: 12, border: `1px solid ${lighten(c.ornament, 40)}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div ref={netRef} style={{ display: "inline-block", background: "transparent" }}>
            <EnvelopeNet c={c} iM={iM} iC={iC} dateStr={dateStr} />
          </div>
        </div>

        {/* Legend + instructions */}
        <div style={{ flex: "1 1 220px", minWidth: 220, fontSize: "0.82rem", color: c.secondary, lineHeight: 1.7 }}>
          <p style={{ fontWeight: 700, color: c.primary, marginBottom: 8, fontFamily: F.mont, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.72rem" }}>Legendă</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem 0" }}>
            <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Scissors size={15} weight="bold" color={c.ornament} />
              <span><strong>Linie continuă</strong> — taie</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 18, borderTop: `1px dashed ${c.ornament}`, opacity: 0.5 }} />
              <span><strong>Linie punctată fină</strong> — pliază</span>
            </li>
          </ul>

          <p style={{ fontWeight: 700, color: c.primary, marginBottom: 8, fontFamily: F.mont, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.72rem" }}>Asamblare</p>
          <ol style={{ paddingLeft: "1.1rem", margin: 0 }}>
            <li>Taie plicul pe conturul continuu.</li>
            <li>Pliază cele 2 clape laterale spre interior.</li>
            <li>Aplică lipici pe clapele laterale și pliază clapa de jos peste ele — se formează buzunarul.</li>
            <li>Introdu darul în plic.</li>
            <li>Pliază clapa de sus și închide cu lipici sau autocolant.</li>
          </ol>

          <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: c.muted }}>
            Recomandare: tipărește pe carton (160–250 g/m²) pentru un plic rigid. Fața decorată (monogramă, dată, mesaj) rămâne în exterior; clapele sunt ascunse pe spate.
          </p>
        </div>
      </div>
    </div>
  );
}
