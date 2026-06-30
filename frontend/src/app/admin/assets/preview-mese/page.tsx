"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { safeToPng } from "@/utils/safari-png";
import { buildA4Pdf } from "@/utils/print-pdf";
import {
  TentA4Sheet,
  MasaFace,
  lighten,
  type TentColors,
  type TentSpec,
} from "@/components/print/TentCard";
import { CaretLeft, CaretRight, DownloadSimple, FilePdf } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  numar_mese: number | null;
  color_main: string | null;
  color_second: string | null;
  color_button: string | null;
  color_text: string | null;
}

function PreviewMeseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTable = parseInt(searchParams.get("table") || "1");

  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupIdx, setGroupIdx] = useState(() => Math.floor((Math.max(1, initialTable) - 1) / 2));
  const visibleRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalTables = settings?.numar_mese || 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/wedding-settings`);
        if (res.ok) setSettings(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;
  if (!settings || !totalTables) return <p className="text-sm text-text-muted text-center py-8">Date indisponibile.</p>;

  const colors: TentColors = {
    bg: settings.color_main || "#FDFBF8",
    text: settings.color_text || "#2C2622",
    ornament: settings.color_button || "#C4B5A0",
    muted: lighten(settings.color_text || "#2C2622", 40),
  };

  // Grupuri de câte 2 mese (2 coloane / foaie).
  const groups: number[][] = [];
  for (let n = 1; n <= totalTables; n += 2) {
    groups.push([n, n + 1].filter((x) => x <= totalTables));
  }
  const safeIdx = Math.min(groupIdx, groups.length - 1);
  const currentGroup = groups[safeIdx] || [];

  const tentsFor = (group: number[]): (TentSpec | null)[] =>
    [0, 1].map((i) => {
      const n = group[i];
      if (!n) return null;
      return {
        front: <MasaFace number={n} colors={colors} numeMireasa={settings.nume_mireasa} numeMire={settings.nume_mire} />,
        back: <MasaFace number={n} colors={colors} numeMireasa={settings.nume_mireasa} numeMire={settings.nume_mire} rotated />,
        frontJustify: "center",
      };
    });

  const downloadAllPdf = async () => {
    setSaving(true);
    try {
      const pngs: string[] = [];
      for (let gi = 0; gi < groups.length; gi++) {
        const el = groupRefs.current[gi];
        if (el) pngs.push(await safeToPng(el, { pixelRatio: 5 }));
      }
      const blob = await buildA4Pdf(pngs);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `corturi-mese-toate.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build PDF:", err);
    } finally {
      setSaving(false);
    }
  };

  const downloadPng = async () => {
    if (!visibleRef.current) return;
    setSaving(true);
    try {
      const a = currentGroup[0];
      const b = currentGroup[currentGroup.length - 1];
      const dataUrl = await safeToPng(visibleRef.current);
      const link = document.createElement("a");
      link.download = `corturi-mese-${a}-${b}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer flex items-center gap-1">
          <CaretLeft size={16} weight="bold" />
          Inapoi
        </button>
        <div className="flex items-center gap-2">
          <button onClick={downloadPng} disabled={saving}
            className="border border-border-light text-text-heading px-4 py-2 rounded-lg text-sm font-medium hover:border-button/50 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
            <DownloadSimple size={16} weight="bold" />
            PNG (pagina)
          </button>
          <button onClick={downloadAllPdf} disabled={saving}
            className="bg-button text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
            <FilePdf size={16} weight="bold" />
            {saving ? "Se genereaza..." : "Descarca PDF (toate mesele)"}
          </button>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center mb-1">
        {currentGroup.length > 1 ? `Mesele ${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}` : `Masa ${currentGroup[0]}`} din {totalTables} · pagina {safeIdx + 1}/{groups.length}
      </p>
      <p className="text-[0.7rem] text-text-muted/80 text-center mb-5 max-w-md mx-auto leading-relaxed">
        2 corturi pe foaie A4. Taie pe verticala, indoaie fiecare pe orizontala si aseaza pe masa.
        Numarul mesei apare identic pe ambele parti. PDF-ul contine toate mesele.
      </p>

      {/* Sheet preview with navigation arrows */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setGroupIdx((p) => Math.max(0, Math.min(p, groups.length - 1) - 1))} disabled={safeIdx <= 0}
          className="shrink-0 w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:text-text-heading hover:border-button/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default">
          <CaretLeft size={20} weight="bold" />
        </button>

        <div style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
          <TentA4Sheet ref={visibleRef} colors={colors} cols={2} tents={tentsFor(currentGroup)} />
        </div>

        <button onClick={() => setGroupIdx((p) => Math.min(groups.length - 1, Math.min(p, groups.length - 1) + 1))} disabled={safeIdx >= groups.length - 1}
          className="shrink-0 w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:text-text-heading hover:border-button/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default">
          <CaretRight size={20} weight="bold" />
        </button>
      </div>

      {/* Foi ascunse pentru PDF — toate grupurile (capturate la export) */}
      <div style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none" }} aria-hidden>
        {groups.map((g, gi) => (
          <TentA4Sheet key={gi} ref={(el) => { groupRefs.current[gi] = el; }} colors={colors} cols={2} tents={tentsFor(g)} />
        ))}
      </div>
    </div>
  );
}

export default function PreviewMesePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</div>}>
      <PreviewMeseContent />
    </Suspense>
  );
}
