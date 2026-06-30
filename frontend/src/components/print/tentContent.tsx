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

const SEP = " · ";

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

// Cardul = două secțiuni: titlu (sus, centrat) + content (jos). Poziționare
// ABSOLUTĂ (nu flex) ca să fie respectată fiabil de html2canvas: titlul ancorat
// sus, content-ul ancorat la baza cardului. CardShell umple aria cardului (care
// e dimensionată de FlatCardSheet). 20px minim între titlu și content.
function CardShell({ title, colors, children }: { title: string; colors: TentColors; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <p style={{ position: "absolute", top: 0, left: 0, right: 0, margin: 0, fontFamily: FONT_SCRIPT, fontSize: 34, color: colors.text, lineHeight: 1, textAlign: "center" }}>
        {title}
      </p>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "left" }}>{children}</div>
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
// Descrierea: toate liniile înșirate una după alta, fără rânduri noi (separate
// prin „·"), curgând și ieșind pe rânduri doar natural (wrap).
const descStyle = (colors: TentColors): React.CSSProperties => ({
  fontSize: 9,
  fontWeight: 600,
  color: colors.text,
  lineHeight: 1.4,
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
            <p style={descStyle(colors)}>{parts.join(SEP)}</p>
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
            <p style={descStyle(colors)}>{splitLines(item.descriere).join(SEP)}</p>
          </div>
        );
      })}
      {sorted.length === 0 && <p style={{ ...descStyle(colors), fontStyle: "italic", color: colors.muted }}>Nicio bautura adaugata inca.</p>}
    </CardShell>
  );
}
