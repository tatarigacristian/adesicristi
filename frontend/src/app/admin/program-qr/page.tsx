"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { safeToPng } from "@/utils/safari-png";
import { buildA4Pdf } from "@/utils/print-pdf";
import { SHEET_W, SHEET_H, FONT_SCRIPT, FONT_SANS, lighten, type TentColors } from "@/components/print/TentCard";
import { fetchWeddingSettings, getCoupleNames, type WeddingSettings } from "@/utils/settings";
import { CaretLeft, DownloadSimple, FilePdf } from "@phosphor-icons/react";

// 3×3 = 9 QR-uri pe o foaie A4 portret. Toate identice (trimit la aceeași pagină
// publică /program), se taie în 9 și se pun pe mese / se dau invitaților.
const COLS = 3;
const ROWS = 3;
const CW = SHEET_W / COLS; // 180
const CH = SHEET_H / ROWS; // ~254.7

interface QrSheetProps {
  colors: TentColors;
  qrDataUrl: string;
  names: string;
}

const QrSheet = forwardRef<HTMLDivElement, QrSheetProps>(function QrSheet({ colors, qrDataUrl, names }, ref) {
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS) }));
  return (
    <div
      ref={ref}
      style={{
        width: SHEET_W,
        height: SHEET_H,
        background: colors.bg,
        color: colors.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {cells.map(({ c, r }, i) => (
        <div key={i} style={{ position: "absolute", left: c * CW, top: r * CH, width: CW, height: CH }}>
          {/* conținut — centrare orizontală prin text-align + inline-block (fiabil în html2canvas) */}
          <div style={{ position: "absolute", inset: 0, boxSizing: "border-box", paddingTop: 30, textAlign: "center" }}>
            <div style={{ fontFamily: FONT_SCRIPT, fontSize: 22, fontWeight: 700, color: colors.ornament, lineHeight: 1 }}>{names}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="" style={{ width: 112, height: 112, display: "inline-block", marginTop: 12, marginBottom: 12 }} />
            <div style={{ fontFamily: FONT_SANS, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: colors.muted, lineHeight: 1.4 }}>
              Scanează pentru
              <br />
              mai multe detalii
            </div>
          </div>
        </div>
      ))}

      {/* Ghidaje de tăiere — aproape invizibile */}
      {Array.from({ length: COLS - 1 }).map((_, i) => (
        <div key={`v${i}`} style={{ position: "absolute", top: 0, left: (i + 1) * CW, height: SHEET_H, borderLeft: `1px dashed ${lighten(colors.ornament, 76)}` }} />
      ))}
      {Array.from({ length: ROWS - 1 }).map((_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", left: 0, top: (i + 1) * CH, width: SHEET_W, borderTop: `1px dashed ${lighten(colors.ornament, 76)}` }} />
      ))}
    </div>
  );
});

export default function ProgramQrPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [programUrl, setProgramUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const url = `${window.location.origin}/program`;
      setProgramUrl(url);
      try {
        const [s, qr] = await Promise.all([
          fetchWeddingSettings(),
          QRCode.toDataURL(url, {
            width: 600,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: "#2C2622", light: "#ffffff" },
          }),
        ]);
        setSettings(s);
        setQrDataUrl(qr);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      const png = await safeToPng(sheetRef.current, { pixelRatio: 5 });
      const blob = await buildA4Pdf([png]);
      const link = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      link.download = "program-qr.pdf";
      link.href = objUrl;
      link.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error("Failed to build PDF:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;
  if (!qrDataUrl) return <p className="text-sm text-text-muted text-center py-8">Nu s-a putut genera codul QR.</p>;

  const colors: TentColors = {
    bg: settings?.color_main || "#FDFBF8",
    text: settings?.color_text || "#2C2622",
    ornament: settings?.color_button || "#C4B5A0",
    muted: lighten(settings?.color_text || "#2C2622", 40),
  };
  const names = getCoupleNames(settings).display;

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer flex items-center gap-1">
          <CaretLeft size={16} weight="bold" />
          Inapoi
        </button>
        <button onClick={downloadPdf} disabled={saving}
          className="bg-button text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
          <FilePdf size={16} weight="bold" />
          {saving ? "Se genereaza..." : "Descarca PDF"}
        </button>
      </div>

      <h1 className="script-font text-3xl text-text-heading text-center mb-1">Program — coduri QR</h1>
      <p className="text-[0.7rem] text-text-muted/80 text-center mb-2 max-w-md mx-auto leading-relaxed">
        9 coduri QR pe foaie A4. Se taie in 9 si se aseaza pe mese. Fiecare cod trimite catre pagina cu programul serii.
      </p>
      <p className="text-[0.65rem] text-text-muted/70 text-center mb-5 flex items-center justify-center gap-1.5">
        <DownloadSimple size={12} weight="bold" />
        Codurile trimit catre:&nbsp;<span className="font-mono">{programUrl}</span>
      </p>

      {/* Preview */}
      <div className="flex justify-center">
        <div style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
          <QrSheet ref={sheetRef} colors={colors} qrDataUrl={qrDataUrl} names={names} />
        </div>
      </div>
    </div>
  );
}
