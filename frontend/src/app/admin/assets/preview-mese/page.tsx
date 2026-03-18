"use client";

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { safeToPng } from "@/utils/safari-png";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

interface Guest {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  partner_id: number | null;
  children: { id?: number; nume: string; prenume: string }[];
}

interface TableAssignment {
  guest_id: number;
  table_number: number;
}

interface ServiceAssignment {
  service_id: number;
  table_number: number;
  nume: string;
  numar_persoane: number;
}

interface WeddingSettings {
  nume_mire: string;
  nume_mireasa: string;
  numar_mese: number | null;
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

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount / 100;
  return `#${Math.round(r * f).toString(16).padStart(2, "0")}${Math.round(g * f).toString(16).padStart(2, "0")}${Math.round(b * f).toString(16).padStart(2, "0")}`;
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

function PreviewMeseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTable = parseInt(searchParams.get("table") || "1");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const [tableNumber, setTableNumber] = useState(initialTable);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalTables = settings?.numar_mese || 0;

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [guestsRes, assignRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/guests`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/table-assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);
        if (guestsRes.ok) setGuests(await guestsRes.json());
        if (assignRes.ok) {
          const data = await assignRes.json();
          setAssignments(data.guests || []);
          setServiceAssignments(data.services || []);
        }
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const tableGuests = useMemo(() => {
    const guestIds = new Set(assignments.filter((a) => a.table_number === tableNumber).map((a) => a.guest_id));
    const partnerIds = new Set(guests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
    return guests
      .filter((g) => guestIds.has(g.id) && !partnerIds.has(g.id))
      .map((g) => {
        const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
        const name = partner
          ? `${g.prenume} & ${partner.prenume} ${g.nume}${g.nume !== partner.nume ? ` / ${partner.nume}` : ""}`
          : `${g.prenume} ${g.nume}`;
        return { id: g.id, name, children: g.children || [] };
      });
  }, [guests, assignments, tableNumber]);

  const tableServices = useMemo(() => {
    return serviceAssignments.filter((sa) => sa.table_number === tableNumber);
  }, [serviceAssignments, tableNumber]);

  const handleSavePng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await safeToPng(cardRef.current);
      const link = document.createElement("a");
      link.download = `masa-${tableNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    }
  }, [tableNumber]);

  const goLeft = useCallback(() => {
    setTableNumber((prev) => (prev > 1 ? prev - 1 : totalTables));
  }, [totalTables]);

  const goRight = useCallback(() => {
    setTableNumber((prev) => (prev < totalTables ? prev + 1 : 1));
  }, [totalTables]);

  if (loading) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;
  if (!settings || !tableNumber) return <p className="text-sm text-text-muted text-center py-8">Date indisponibile.</p>;

  const bg = settings.color_main || "#FDFBF8";
  const text = settings.color_text || "#2C2622";
  const accent = settings.color_button || "#C4B5A0";
  const ornament = accent;
  const muted = lighten(text, 40);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Inapoi
        </button>
        <button onClick={handleSavePng}
          className="bg-button text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Salveaza PNG
        </button>
      </div>

      {/* Navigation info */}
      <p className="text-xs text-text-muted text-center mb-4">
        Masa {tableNumber} din {totalTables}
      </p>

      {/* Card Preview with navigation arrows */}
      <div className="flex items-center justify-center gap-3">
        {/* Left arrow */}
        <button onClick={goLeft}
          className="shrink-0 w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:text-text-heading hover:border-button/40 transition-colors cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={cardRef}
          style={{
            width: 400,
            minHeight: 500,
            background: bg,
            color: text,
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            position: "relative",
            padding: "40px 32px",
            borderRadius: 0,
          }}
        >
          {/* Corner ornaments */}
          <CornerOrnament style={{ top: 8, left: 8 }} color={ornament} />
          <CornerOrnament style={{ top: 8, right: 8, transform: "scaleX(-1)" }} color={ornament} />
          <CornerOrnament style={{ bottom: 8, left: 8, transform: "scaleY(-1)" }} color={ornament} />
          <CornerOrnament style={{ bottom: 8, right: 8, transform: "scale(-1)" }} color={ornament} />

          {/* Border */}
          <div style={{
            position: "absolute", inset: 14, border: `0.5px solid ${lighten(ornament, 30)}`, pointerEvents: "none",
          }} />

          {/* Content */}
          <div style={{ textAlign: "center", position: "relative" }}>
            {/* Title */}
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: muted, marginBottom: 8 }}>
              Masa
            </p>
            <p style={{
              fontFamily: '"Alex Brush", cursive',
              fontSize: 52,
              color: text,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {tableNumber}
            </p>

            <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 20px" }}>
              <Flourish width={200} color={ornament} />
            </div>

            {/* Guest list */}
            <div style={{ marginTop: 4 }}>
              {tableGuests.map((g) => (
                <div key={g.id} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: text }}>
                    {g.name}
                  </p>
                  {g.children.length > 0 && (
                    <p style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                      {g.children.map((c) => `${c.prenume}`).join(", ")}
                    </p>
                  )}
                </div>
              ))}
              {tableServices.map((s) => (
                <div key={`svc-${s.service_id}`} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 14, fontStyle: "italic", color: muted }}>
                    {s.nume} ({s.numar_persoane}p)
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom flourish */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <Flourish width={140} color={ornament} />
            </div>

            {/* Couple names */}
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

        {/* Right arrow */}
        <button onClick={goRight}
          className="shrink-0 w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:text-text-heading hover:border-button/40 transition-colors cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
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
