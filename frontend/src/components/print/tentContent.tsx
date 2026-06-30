"use client";

import React from "react";
import { FONT_SCRIPT, FONT_SANS, darken, type TentColors } from "./TentCard";

export interface MenuItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "aperitiv" | "fel_principal" | "fel_secundar" | "desert";
  ordine: number;
}

export interface BarItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "alcoolic" | "non_alcoolic";
  ordine: number;
}

const CATEGORY_LABELS: Record<MenuItem["categorie"], string> = {
  aperitiv: "Aperitive",
  fel_principal: "Fel principal",
  fel_secundar: "Gustare caldă",
  desert: "Desert",
};
const CATEGORY_ORDER: MenuItem["categorie"][] = ["aperitiv", "fel_principal", "fel_secundar", "desert"];

const BAR_CAT_LABEL: Record<BarItem["categorie"], string> = {
  alcoolic: "Bauturi alcoolice",
  non_alcoolic: "Bauturi non-alcoolice",
};
const BAR_CAT_ORDER: Record<BarItem["categorie"], number> = { alcoolic: 0, non_alcoolic: 1 };

// Spargem `descriere` la newline și colapsăm spațierea internă → linii curate.
export function splitLines(s: string | null): string[] {
  return (s || "")
    .split(/\r?\n/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
export function isRealTitle(t: string | null): boolean {
  const v = (t || "").trim();
  return v.length > 0 && v !== ".";
}

// Spațiul dintre titlul mare (Meniu/Bar) și primele preparate (px).
const TITLE_GAP = 20;

// Cardul = titlu (script, centrat) + content, ca grup vertical centrat în aria
// cardului. Mult content → grupul umple aria, titlul stă sus; puțin content →
// grupul e mic și centrat, titlul coboară în spațiul liber.
//
// Centrarea o facem cu `paddingTop` în px (flux normal), NU cu poziționare
// absolută/flex/table/transform: html2canvas 1.4.1 randează fidel doar fluxul
// normal de blocuri (absolute/flex/table-cell/translate erau poziționate greșit
// în PDF, deși în browser arătau corect). Măsurăm înălțimea conținutului față de
// aria cardului și împingem grupul cu jumătate din spațiul liber (0 dacă
// depășește → ancorat sus). ResizeObserver + fonts.ready reiau măsurarea.
function CardShell({ title, colors, children }: { title: string; colors: TentColors; children: React.ReactNode }) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [padTop, setPadTop] = React.useState(0);

  // Fără deps: remăsoară la fiecare render (după ce se încarcă datele/fonturile,
  // CardShell se re-randează → măsurarea se reface). setPadTop cu aceeași valoare
  // e no-op în React, deci converge fără buclă.
  React.useEffect(() => {
    const measure = () => {
      const outer = outerRef.current;
      const content = contentRef.current;
      if (!outer || !content) return;
      // clientHeight include paddingTop, deci e constantă (= înălțimea cardului)
      // → măsurarea nu intră în buclă.
      const free = outer.clientHeight - content.offsetHeight;
      setPadTop(free > 0 ? Math.round(free / 2) : 0);
    };
    measure();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  });

  return (
    <div ref={outerRef} style={{ width: "100%", height: "100%", boxSizing: "border-box", paddingTop: padTop, overflow: "hidden" }}>
      <div ref={contentRef}>
        <p style={{ margin: `0 0 ${TITLE_GAP}px`, fontFamily: FONT_SCRIPT, fontSize: 34, color: colors.text, lineHeight: 1, textAlign: "center" }}>
          {title}
        </p>
        <div style={{ textAlign: "left" }}>{children}</div>
      </div>
    </div>
  );
}

// Categoriile: sans bold real (Montserrat 700) — clar mai bold decât textul
// serif. (Cormorant nu are 700/800 încărcat, deci faux-bold-ul nu se vedea.)
const labelStyle = (colors: TentColors): React.CSSProperties => ({
  fontFamily: FONT_SANS,
  fontSize: 8.5,
  letterSpacing: 1.8,
  textTransform: "uppercase",
  color: darken(colors.ornament, 28),
  fontWeight: 700,
  marginBottom: 3,
});
// Descrierea: fiecare linie din `descriere` pe rândul ei (un preparat/o băutură
// per rând). margin:0 ca <p>-urile consecutive să nu primească marginile default.
const descStyle = (colors: TentColors): React.CSSProperties => ({
  margin: 0,
  fontSize: 9,
  fontWeight: 600,
  color: colors.text,
  lineHeight: 1.5,
});

export function MenuCard({ items, colors }: { items: MenuItem[]; colors: TentColors }) {
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: items.filter((i) => i.categorie === cat) }))
    .filter((g) => g.items.length > 0);
  return (
    <CardShell title="Meniu" colors={colors}>
      {grouped.map((group, idx) => {
        // Afișăm doar descrierile preparatelor; titlul itemului (de regulă
        // numele categoriei) ar dubla header-ul de secțiune.
        const parts = group.items.flatMap((item) => splitLines(item.descriere));
        return (
          <div key={group.cat} style={{ marginBottom: idx === grouped.length - 1 ? 0 : 10 }}>
            <p style={labelStyle(colors)}>{CATEGORY_LABELS[group.cat]}</p>
            {parts.map((part, i) => (
              <p key={i} style={descStyle(colors)}>{part}</p>
            ))}
          </div>
        );
      })}
      {grouped.length === 0 && <p style={{ ...descStyle(colors), fontStyle: "italic", color: colors.muted }}>Niciun preparat adaugat inca.</p>}
    </CardShell>
  );
}

export function BarCard({ items, colors }: { items: BarItem[]; colors: TentColors }) {
  const sorted = [...items].sort((a, b) => BAR_CAT_ORDER[a.categorie] - BAR_CAT_ORDER[b.categorie]);
  return (
    <CardShell title="Bar" colors={colors}>
      {sorted.map((item, idx) => {
        const header = isRealTitle(item.titlu) ? item.titlu : BAR_CAT_LABEL[item.categorie];
        return (
          <div key={item.id} style={{ marginBottom: idx === sorted.length - 1 ? 0 : 10 }}>
            <p style={labelStyle(colors)}>{header}</p>
            {splitLines(item.descriere).map((line, i) => (
              <p key={i} style={descStyle(colors)}>{line}</p>
            ))}
          </div>
        );
      })}
      {sorted.length === 0 && <p style={{ ...descStyle(colors), fontStyle: "italic", color: colors.muted }}>Nicio bautura adaugata inca.</p>}
    </CardShell>
  );
}
