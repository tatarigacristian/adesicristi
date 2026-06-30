"use client";

import React, { forwardRef } from "react";

// ─── Geometrie: 3 corturi de masă pe o foaie A4 ────────────────────────
// Foaie A4 portret (210 × 297 mm). O împărțim în 3 COLOANE egale (una lângă
// alta) → 3 corturi per foaie. Fiecare coloană = 70 × 297 mm și se îndoaie la
// mijloc pe orizontală → cort care stă pe masă, cu fețe de 70 × 148.5 mm.
// Jumătatea de sus a fiecărei coloane = spatele, tipărit rotit 180° ca să fie
// drept după îndoire.
export const SHEET_W = 540; // 210 mm
export const SHEET_H = 764; // 297 mm
export const COL_W = SHEET_W / 3; // 180 px ≈ 70 mm
export const FACE_H = SHEET_H / 2; // 382 px ≈ 148.5 mm
export const PX_PER_MM = SHEET_W / 210;

export interface TentColors {
  bg: string;
  text: string;
  ornament: string;
  muted: string;
}

// Fonturi prin variabilele next/font (rezolvate de getComputedStyle → captate
// corect de html2canvas). Fallback-uri literale + generice pentru siguranță.
export const FONT_SERIF = "var(--font-cormorant), 'Cormorant Garamond', 'Georgia', serif";
export const FONT_SCRIPT = "var(--font-script), 'Alex Brush', cursive";
export const FONT_SANS = "var(--font-montserrat), 'Montserrat', 'Arial', sans-serif";

// ─── Color helpers (partajate de paginile de preview) ──────────────────
export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = amount / 100;
  return `#${Math.min(255, Math.round(r + (255 - r) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(g + (255 - g) * f)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(b + (255 - b) * f)).toString(16).padStart(2, "0")}`;
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount / 100;
  return `#${Math.round(r * f).toString(16).padStart(2, "0")}${Math.round(g * f).toString(16).padStart(2, "0")}${Math.round(b * f).toString(16).padStart(2, "0")}`;
}

// ─── Flourish minimalist (folosit de fețele meniu/bar) ─────────────────
export function SmallFlourish({ width = 80, color }: { width?: number; color: string }) {
  return (
    <svg viewBox="0 0 200 12" style={{ width, height: width * 0.06, display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2="78" y2="6" stroke={color} strokeWidth="0.8" />
      <line x1="122" y1="6" x2="200" y2="6" stroke={color} strokeWidth="0.8" />
      <circle cx="100" cy="6" r="2" fill={color} />
      <path d="M88 6 L100 1.5 L112 6 L100 10.5Z" fill="none" stroke={color} strokeWidth="0.7" />
    </svg>
  );
}

// ─── Monograma (spatele meniu/bar), desenată complet în SVG ────────────
// Rotită 180° intern (în <g>), NU prin CSS transform — așa html2canvas o
// rasterizează fiabil. Sub monogramă: numele cuplului + eticheta tipului.
export function Monogram({
  colors,
  numeMireasa,
  numeMire,
  label,
}: {
  colors: TentColors;
  numeMireasa: string;
  numeMire: string;
  label?: string;
}) {
  const { ornament, text, muted } = colors;
  const iM = (numeMireasa || "A").trim().charAt(0).toUpperCase() || "A";
  const iC = (numeMire || "C").trim().charAt(0).toUpperCase() || "C";
  const VB_W = 340;
  const VB_H = 330;
  const cx = VB_W / 2;
  const ringCy = 118;
  const heart = (y: number) =>
    `M${cx} ${y + 2} C${cx} ${y - 1} ${cx - 3} ${y - 3} ${cx - 5} ${y - 1} C${cx - 7} ${y + 1} ${cx - 7} ${y + 4} ${cx} ${y + 9} C${cx + 7} ${y + 4} ${cx + 7} ${y + 1} ${cx + 5} ${y - 1} C${cx + 3} ${y - 3} ${cx} ${y - 1} ${cx} ${y + 2}Z`;

  return (
    <svg width={144} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <g transform={`rotate(180 ${cx} ${VB_H / 2})`}>
        <circle cx={cx} cy={ringCy} r={70} stroke={ornament} strokeWidth="1.2" fill="none" />
        <circle cx={cx} cy={ringCy} r={64} stroke={ornament} strokeWidth="0.7" fill="none" />
        <path d={heart(ringCy - 70)} fill={ornament} />
        <path d={heart(ringCy + 61)} fill={ornament} />
        <text x={cx} y={ringCy} textAnchor="middle" dominantBaseline="central" fontFamily={FONT_SERIF} fontSize="58" fontWeight="300" fill={text}>
          <tspan>{iM}</tspan>
          <tspan dx="6" fontFamily={FONT_SCRIPT} fontSize="36" fill={muted}>
            &amp;
          </tspan>
          <tspan dx="6">{iC}</tspan>
        </text>
        <text x={cx} y={248} textAnchor="middle" fontFamily={FONT_SCRIPT} fontSize="32" fill={ornament}>
          {numeMireasa || "Ade"} &amp; {numeMire || "Cristi"}
        </text>
        {label && (
          <text x={cx} y={284} textAnchor="middle" fontFamily={FONT_SANS} fontSize="17" letterSpacing="4" fontWeight="500" fill={muted}>
            {label.toUpperCase()}
          </text>
        )}
      </g>
    </svg>
  );
}

// ─── Fața de masă: doar numărul, centrat într-un oval (font minimalist),
// cu „Ade & Cristi" jos. Aceeași informație pe ambele fețe (back = rotat). ─
export function MasaFace({
  number,
  colors,
  numeMireasa,
  numeMire,
  rotated = false,
  fontUri = null,
}: {
  number: number;
  colors: TentColors;
  numeMireasa: string;
  numeMire: string;
  rotated?: boolean;
  fontUri?: string | null;
}) {
  const { text, ornament } = colors;
  // Ovalul + numărul ca SVG: `dominant-baseline="central"` centrează cifra
  // fiabil (browserul rasterizează SVG-ul corect; textul HTML era așezat ~37px
  // prea jos de html2canvas). Fontul Montserrat 700 e încorporat ca data-URI
  // (fontUri) fiindcă SVG-ul rasterizat n-are acces la fonturile paginii.
  // „Ade & Cristi" rămâne HTML, jos. Spatele rotit 180° via CSS.
  return (
    <div style={{ position: "absolute", inset: 14, transform: rotated ? "rotate(180deg)" : undefined }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={124} height={124} viewBox="0 0 124 124" style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
          {fontUri && (
            <defs>
              <style>{`@font-face{font-family:'masanum';src:url(${fontUri}) format('woff2');font-weight:700;}`}</style>
            </defs>
          )}
          <circle cx="62" cy="62" r="60" fill="none" stroke={ornament} strokeWidth="2" />
          <text x="62" y="62" textAnchor="middle" dominantBaseline="central" fontFamily="'masanum', 'Montserrat', sans-serif" fontSize="60" fontWeight="700" fill={text}>
            {number}
          </text>
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center" }}>
        <span style={{ fontFamily: FONT_SCRIPT, fontSize: 30, color: ornament, lineHeight: 1 }}>
          {numeMireasa || "Ade"} & {numeMire || "Cristi"}
        </span>
      </div>
    </div>
  );
}

// ─── O față (jumătate de coloană): cadru subțire + slot de conținut ────
function Face({
  colors,
  justify = "center",
  children,
}: {
  colors: TentColors;
  justify?: "center" | "flex-start";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justify,
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 8, border: `1px solid ${lighten(colors.ornament, 22)}`, pointerEvents: "none" }} />
      {children}
    </div>
  );
}

// ─── O coloană = un cort (spate sus rotit + îndoitură + față jos) ──────
function TentColumn({
  colors,
  front,
  back,
  frontJustify = "center",
}: {
  colors: TentColors;
  front: React.ReactNode;
  back: React.ReactNode;
  frontJustify?: "center" | "flex-start";
}) {
  return (
    <>
      {/* SPATE (sus) — conținut rotit 180° intern de către caller */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: FACE_H }}>
        <Face colors={colors} justify="center">
          {back}
        </Face>
      </div>

      {/* Linia de îndoire — aproape invizibilă */}
      <div style={{ position: "absolute", top: FACE_H, left: 0, width: "100%", borderTop: `1px dashed ${lighten(colors.ornament, 84)}` }} />

      {/* FAȚĂ (jos) — conținut drept */}
      <div style={{ position: "absolute", top: FACE_H, left: 0, width: "100%", height: FACE_H }}>
        <Face colors={colors} justify={frontJustify}>
          {front}
        </Face>
      </div>
    </>
  );
}

export interface TentSpec {
  front: React.ReactNode;
  back: React.ReactNode;
  frontJustify?: "center" | "flex-start";
}

// ─── Foaia A4 cu corturi pliabile (masă) — `cols` coloane ──────────────
export const TentA4Sheet = forwardRef<HTMLDivElement, { colors: TentColors; tents: (TentSpec | null | undefined)[]; cols?: number }>(
  function TentA4Sheet({ colors, tents, cols = 2 }, ref) {
    const colW = SHEET_W / cols;
    return (
      <div
        ref={ref}
        style={{
          width: SHEET_W,
          height: SHEET_H,
          background: colors.bg,
          color: colors.text,
          fontFamily: FONT_SERIF,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => {
          const t = tents[i];
          return (
            <div key={i} style={{ position: "absolute", left: i * colW, top: 0, width: colW, height: SHEET_H }}>
              {t && <TentColumn colors={colors} front={t.front} back={t.back} frontJustify={t.frontJustify} />}
            </div>
          );
        })}

        {/* Ghidaje de tăiere între coloane — aproape invizibile */}
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <div key={`cut-${i}`} style={{ position: "absolute", top: 0, left: (i + 1) * colW, height: SHEET_H, borderLeft: `1px dashed ${lighten(colors.ornament, 76)}` }} />
        ))}
      </div>
    );
  }
);

// ─── Foaia A4 cu 2 carduri plate (meniu/bar) — 2 coloane una lângă alta ─
// Cele 2 carduri sunt așezate orizontal (2 coloane egale, full-height minus
// CARD_PAD_Y sus/jos). Se printează față-verso (meniu pe o față, bar pe verso),
// se taie în 2 coloane și se pune câte un card în farfurie. Cardurile fiind
// copii identice, fețele se aliniază automat la duplex indiferent de ordine.
const FLAT_CARD_COLS = 2;
const CARD_PAD_Y = 100; // px padding sus/jos pe foaie (în spațiul 540×764)

export const FlatCardSheet = forwardRef<HTMLDivElement, { colors: TentColors; card: React.ReactNode }>(
  function FlatCardSheet({ colors, card }, ref) {
    const CW = SHEET_W / FLAT_CARD_COLS;
    const CH = SHEET_H - 2 * CARD_PAD_Y;
    return (
      <div
        ref={ref}
        style={{
          width: SHEET_W,
          height: SHEET_H,
          background: colors.bg,
          color: colors.text,
          fontFamily: FONT_SERIF,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: FLAT_CARD_COLS }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: i * CW, top: CARD_PAD_Y, width: CW, height: CH }}>
            {/* cadru subțire */}
            <div style={{ position: "absolute", inset: 8, border: `1px solid ${lighten(colors.ornament, 22)}`, pointerEvents: "none" }} />
            {/* aria cardului (înălțime explicită — html2canvas nu rezolvă bine
                înălțimea implicită din top+bottom, iar content-ul are nevoie de
                ea ca să se ancoreze jos) */}
            <div style={{ position: "absolute", top: 16, left: 16, width: CW - 32, height: CH - 32 }}>{card}</div>
          </div>
        ))}

        {/* Ghidaje de tăiere verticale între coloane — aproape invizibile */}
        {Array.from({ length: FLAT_CARD_COLS - 1 }).map((_, i) => (
          <div key={`cut-${i}`} style={{ position: "absolute", top: 0, left: (i + 1) * CW, height: SHEET_H, borderLeft: `1px dashed ${lighten(colors.ornament, 76)}` }} />
        ))}
      </div>
    );
  }
);
