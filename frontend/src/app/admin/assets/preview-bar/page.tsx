"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { safeToPng } from "@/utils/safari-png";
import { buildA4Pdf } from "@/utils/print-pdf";
import { FlatCardSheet, lighten, type TentColors } from "@/components/print/TentCard";
import { MenuCard, BarCard, type MenuItem, type BarItem } from "@/components/print/tentContent";
import { CaretLeft, DownloadSimple, FilePdf } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  color_main: string | null;
  color_second: string | null;
  color_button: string | null;
  color_text: string | null;
}

function PreviewBarContent() {
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const visibleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [menuRes, barRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/menu-items`),
          fetch(`${API_URL}/api/bar-items`),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (barRes.ok) setBarItems(await barRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadDuplexPdf = useCallback(async () => {
    if (!menuRef.current || !barRef.current) return;
    setSaving(true);
    try {
      const menuPng = await safeToPng(menuRef.current);
      const barPng = await safeToPng(barRef.current);
      const blob = await buildA4Pdf([menuPng, barPng]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "meniu-bar-fata-verso.pdf";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build PDF:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const downloadPng = useCallback(async () => {
    if (!visibleRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await safeToPng(visibleRef.current);
      const link = document.createElement("a");
      link.download = "bar.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;
  if (!settings) return <p className="text-sm text-text-muted text-center py-8">Date indisponibile.</p>;

  const colors: TentColors = {
    bg: settings.color_main || "#FDFBF8",
    text: settings.color_text || "#2C2622",
    ornament: settings.color_button || "#C4B5A0",
    muted: lighten(settings.color_text || "#2C2622", 40),
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
            PNG (bar)
          </button>
          <button onClick={downloadDuplexPdf} disabled={saving}
            className="bg-button text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
            <FilePdf size={16} weight="bold" />
            {saving ? "Se genereaza..." : "Descarca PDF (fata-verso)"}
          </button>
        </div>
      </div>

      <p className="text-[0.7rem] text-text-muted/80 text-center mb-5 max-w-md mx-auto leading-relaxed">
        2 carduri pe foaie A4 (2 coloane, 100px padding sus/jos). Se printeaza fata-verso: meniul pe o fata,
        barul pe verso. Se taie in 2 coloane si se pune cate un card in farfurie. PDF-ul are pagina 1 = meniu, pagina 2 = bar.
      </p>

      {/* Preview — verso cu barul */}
      <div className="flex justify-center">
        <div style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
          <FlatCardSheet ref={visibleRef} colors={colors} card={<BarCard items={barItems} colors={colors} />} />
        </div>
      </div>

      {/* Foi ascunse pentru PDF fata-verso */}
      <div style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none" }} aria-hidden>
        <FlatCardSheet ref={menuRef} colors={colors} card={<MenuCard items={menuItems} colors={colors} />} />
        <FlatCardSheet ref={barRef} colors={colors} card={<BarCard items={barItems} colors={colors} />} />
      </div>
    </div>
  );
}

export default function PreviewBarPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</div>}>
      <PreviewBarContent />
    </Suspense>
  );
}
