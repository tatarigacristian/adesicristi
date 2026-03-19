"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { safeToPng } from "@/utils/safari-png";
import { CaretLeft, DownloadSimple, Champagne, Coffee } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface BarItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "alcoolic" | "non_alcoolic";
  ordine: number;
}

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  color_main: string | null;
  color_second: string | null;
  color_button: string | null;
  color_text: string | null;
}

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

function CornerOrnament({ style, color }: { style: React.CSSProperties; color: string }) {
  return (
    <svg style={{ position: "absolute", ...style }} viewBox="0 0 80 80" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L2 28 Q4 18, 12 12 Q18 8, 28 6 Q36 4, 40 2 Z" fill="none" stroke={color} strokeWidth="0.6" />
      <path d="M2 2 Q8 12, 16 18 Q22 24, 32 28" fill="none" stroke={color} strokeWidth="0.5" />
      <path d="M2 6 Q10 10, 14 16 Q18 22, 24 24" fill="none" stroke={color} strokeWidth="0.4" opacity="0.6" />
      <circle cx="8" cy="8" r="1.2" fill={color} opacity="0.5" />
    </svg>
  );
}

function Flourish({ width = 180, color }: { width?: number; color: string }) {
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
    <svg viewBox="0 0 200 12" style={{ width: 100, height: 6 }} xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2="70" y2="6" stroke={color} strokeWidth="0.4" />
      <line x1="130" y1="6" x2="200" y2="6" stroke={color} strokeWidth="0.4" />
      <path d="M80 6 Q90 1, 100 6 Q110 11, 120 6" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="100" cy="6" r="1.5" fill={color} />
    </svg>
  );
}

// Category icons for the design card
function CocktailIcon({ color }: { color: string }) {
  return <Champagne size={20} weight="duotone" color={color} />;
}

function CupIcon({ color }: { color: string }) {
  return <Coffee size={20} weight="duotone" color={color} />;
}

function PreviewBarContent() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const [items, setItems] = useState<BarItem[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [itemsRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/bar-items`),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);
        if (itemsRes.ok) setItems(await itemsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSavePng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await safeToPng(cardRef.current);
      const link = document.createElement("a");
      link.download = "bar-menu.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    }
  }, []);

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;
  if (!settings) return <p className="text-sm text-text-muted text-center py-8">Date indisponibile.</p>;

  const bg = settings.color_main || "#FDFBF8";
  const text = settings.color_text || "#2C2622";
  const accent = settings.color_button || "#C4B5A0";
  const ornament = accent;
  const muted = lighten(text, 40);

  const alcoholic = items.filter((i) => i.categorie === "alcoolic");
  const nonAlcoholic = items.filter((i) => i.categorie === "non_alcoolic");

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer flex items-center gap-1">
          <CaretLeft size={16} weight="bold" />
          Inapoi
        </button>
        <button onClick={handleSavePng}
          className="bg-button text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer flex items-center gap-2">
          <DownloadSimple size={16} weight="bold" />
          Salveaza PNG
        </button>
      </div>

      {/* Card Preview */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          style={{
            width: 420,
            minHeight: 550,
            background: bg,
            color: text,
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            position: "relative",
            padding: "40px 36px",
          }}
        >
          {/* Corner ornaments */}
          <CornerOrnament style={{ top: 8, left: 8 }} color={ornament} />
          <CornerOrnament style={{ top: 8, right: 8, transform: "scaleX(-1)" }} color={ornament} />
          <CornerOrnament style={{ bottom: 8, left: 8, transform: "scaleY(-1)" }} color={ornament} />
          <CornerOrnament style={{ bottom: 8, right: 8, transform: "scale(-1)" }} color={ornament} />

          {/* Border */}
          <div style={{ position: "absolute", inset: 14, border: `0.5px solid ${lighten(ornament, 30)}`, pointerEvents: "none" }} />

          <div style={{ textAlign: "center", position: "relative" }}>
            {/* Title */}
            <p style={{ fontSize: 14, letterSpacing: 4, textTransform: "uppercase", color: muted, marginBottom: 6, fontWeight: 500 }}>
              Meniul de
            </p>

            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 10px" }}>
              <SmallFlourish color={ornament} />
            </div>

            <p style={{
              fontFamily: '"Alex Brush", cursive',
              fontSize: 46,
              color: text,
              lineHeight: 1,
              marginBottom: 4,
            }}>
              Bauturi
            </p>

            <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 24px" }}>
              <Flourish width={200} color={ornament} />
            </div>

            {/* Alcoholic section */}
            {alcoholic.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                  <CocktailIcon color={ornament} />
                  <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: ornament, fontWeight: 600 }}>
                    Bauturi alcoolice
                  </p>
                </div>
                {alcoholic.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: text }}>{item.titlu}</p>
                    {item.descriere && (
                      <p style={{ fontSize: 11, color: muted, fontStyle: "italic", marginTop: 1 }}>{item.descriere}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Separator */}
            {alcoholic.length > 0 && nonAlcoholic.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 20px" }}>
                <SmallFlourish color={ornament} />
              </div>
            )}

            {/* Non-alcoholic section */}
            {nonAlcoholic.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                  <CupIcon color={ornament} />
                  <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: ornament, fontWeight: 600 }}>
                    Bauturi non-alcoolice
                  </p>
                </div>
                {nonAlcoholic.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: text }}>{item.titlu}</p>
                    {item.descriere && (
                      <p style={{ fontSize: 11, color: muted, fontStyle: "italic", marginTop: 1 }}>{item.descriere}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Flourish width={140} color={ornament} />
            </div>
            <p style={{
              fontFamily: '"Alex Brush", cursive',
              fontSize: 18,
              color: ornament,
              marginTop: 16,
            }}>
              {settings.nume_mireasa || "Ade"} & {settings.nume_mire || "Cristi"}
            </p>
          </div>
        </div>
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
