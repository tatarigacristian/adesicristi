"use client";

import { useEffect, useState } from "react";
import { ForkKnife, Clock, Martini, type Icon } from "@phosphor-icons/react";
import { programIcon } from "@/utils/program-icons";
import { WeddingSettings, applyThemeColors, getCoupleNames } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface ProgramItem {
  id: number;
  titlu: string;
  ora: string;
  descriere: string | null;
  iconita: string;
  ordine: number;
}
interface MenuItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "aperitiv" | "fel_principal" | "fel_secundar" | "desert";
  ordine: number;
}
interface BarItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "alcoolic" | "non_alcoolic";
  ordine: number;
}

const MENU_CAT: { key: MenuItem["categorie"]; label: string }[] = [
  { key: "aperitiv", label: "Aperitive" },
  { key: "fel_principal", label: "Fel principal" },
  { key: "fel_secundar", label: "Gustare caldă" },
  { key: "desert", label: "Desert" },
];
const BAR_ORDER: Record<BarItem["categorie"], number> = { alcoolic: 0, non_alcoolic: 1 };

const TABS: { key: "program" | "meniu" | "bar"; label: string; Icon: Icon }[] = [
  { key: "program", label: "Program", Icon: Clock },
  { key: "meniu", label: "Meniu", Icon: ForkKnife },
  { key: "bar", label: "Bar", Icon: Martini },
];
type TabKey = (typeof TABS)[number]["key"];

function splitLines(s: string | null): string[] {
  return (s || "")
    .split(/\r?\n/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
function isRealTitle(t: string | null): boolean {
  const v = (t || "").trim();
  return v.length > 0 && v !== ".";
}

/* O secțiune de listă (categorie meniu / subcategorie bar): titlu mic + rânduri.
   `boldName` — la bar, numele băuturii (partea cu MAJUSCULE dinaintea „–") e negru. */
function ListSection({ title, lines, boldName = false }: { title: string; lines: string[]; boldName?: boolean }) {
  return (
    <div className="mb-9 last:mb-0">
      <h3
        className="text-accent-rose font-semibold text-xs uppercase tracking-[0.2em] mb-4 text-left"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </h3>
      <ul className="space-y-3">
        {lines.map((line, i) => {
          const dash = boldName ? line.indexOf("–") : -1;
          return (
            <li key={i} className="serif-font text-lg text-text-heading leading-snug text-left">
              {dash !== -1 ? (
                <>
                  <span className="text-black font-medium">{line.slice(0, dash).trim()}</span>{" "}
                  {line.slice(dash)}
                </>
              ) : (
                line
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ProgramPage() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [tab, setTab] = useState<TabKey>("program");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes, mRes, bRes] = await Promise.all([
          fetch(`${API_URL}/api/wedding-settings`),
          fetch(`${API_URL}/api/program-items`),
          fetch(`${API_URL}/api/menu-items`),
          fetch(`${API_URL}/api/bar-items`),
        ]);
        if (sRes.ok) {
          const s: WeddingSettings = await sRes.json();
          setSettings(s);
          applyThemeColors(s);
        } else {
          applyThemeColors(null);
        }
        if (pRes.ok) setProgramItems(await pRes.json());
        if (mRes.ok) setMenuItems(await mRes.json());
        if (bRes.ok) setBarItems(await bRes.json());
      } catch {
        applyThemeColors(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Până se aplică tema, variabilele CSS sunt albe (alb pe alb) → afișăm un
  // loader cu culori explicite ca să nu apară conținut invizibil.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDFBF8" }}>
        <span style={{ fontFamily: "var(--font-script), cursive", fontSize: 30, color: "#C4B5A0" }}>Ade &amp; Cristi</span>
      </div>
    );
  }

  const names = getCoupleNames(settings);

  const sortedBar = [...barItems].sort(
    (a, b) => (BAR_ORDER[a.categorie] - BAR_ORDER[b.categorie]) || a.ordine - b.ordine
  );

  return (
    <main className="min-h-screen bg-background-soft px-6 py-16 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="script-font text-5xl sm:text-6xl text-text-heading leading-none mb-4">{names.display}</h1>
          {/* Flourish */}
          <div className="flex items-center justify-center gap-3 mb-4" aria-hidden>
            <span className="h-px w-12 bg-border" />
            <span className="w-1.5 h-1.5 rotate-45 bg-accent" />
            <span className="h-px w-12 bg-border" />
          </div>
          <p className="text-[0.7rem] tracking-[0.35em] uppercase text-text-muted">Informații</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-6 mb-10" role="tablist">
          {TABS.map((t) => {
            const active = tab === t.key;
            const TabIcon = t.Icon;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 pb-1.5 text-xs uppercase tracking-[0.2em] border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "text-text-heading border-accent"
                    : "text-text-muted border-transparent hover:text-text-heading"
                }`}
                style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
              >
                <TabIcon size={15} weight="fill" className={active ? "text-accent-rose" : ""} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Program */}
        {tab === "program" && (
          <ol className="relative">
            {programItems.map((item, i) => {
              const ItemIcon = programIcon(item.iconita);
              return (
                <li key={item.id} className="relative pl-16 pb-9 last:pb-0">
                  {i < programItems.length - 1 && (
                    <span className="absolute left-6 -translate-x-1/2 top-[52px] -bottom-1 w-px bg-border-light" aria-hidden />
                  )}
                  <span
                    className="absolute left-0 top-0 w-12 h-12 rounded-full border border-accent bg-background-soft flex items-center justify-center"
                    aria-hidden
                  >
                    <ItemIcon size={24} weight="fill" className="text-accent-rose" />
                  </span>
                  <div className="min-h-12 flex flex-col justify-center">
                    <div
                      className="text-accent-rose font-semibold text-base leading-none mb-1"
                      style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
                    >
                      {(item.ora || "").slice(0, 5)}
                    </div>
                    <div className="serif-font text-2xl text-text-heading leading-snug">{item.titlu}</div>
                    {item.descriere && item.descriere.trim() && (
                      <div className="serif-font text-base text-text-muted leading-snug mt-1">{item.descriere}</div>
                    )}
                  </div>
                </li>
              );
            })}
            {programItems.length === 0 && (
              <p className="serif-font text-lg text-text-muted italic text-center">Programul va fi disponibil în curând.</p>
            )}
          </ol>
        )}

        {/* Meniu */}
        {tab === "meniu" && (
          <div>
            {MENU_CAT.map((cat) => {
              const items = menuItems.filter((i) => i.categorie === cat.key);
              const lines = items.flatMap((i) => splitLines(i.descriere));
              if (lines.length === 0) return null;
              return <ListSection key={cat.key} title={cat.label} lines={lines} />;
            })}
            {menuItems.length === 0 && (
              <p className="serif-font text-lg text-text-muted italic text-center">Meniul va fi disponibil în curând.</p>
            )}
          </div>
        )}

        {/* Bar */}
        {tab === "bar" && (
          <div>
            {sortedBar.map((item) => {
              const lines = splitLines(item.descriere);
              if (lines.length === 0) return null;
              const title = isRealTitle(item.titlu)
                ? item.titlu
                : item.categorie === "alcoolic"
                  ? "Băuturi alcoolice"
                  : "Băuturi non-alcoolice";
              return <ListSection key={item.id} title={title} lines={lines} boldName />;
            })}
            {sortedBar.length === 0 && (
              <p className="serif-font text-lg text-text-muted italic text-center">Barul va fi disponibil în curând.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
