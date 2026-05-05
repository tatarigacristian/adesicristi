"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal, flushSync } from "react-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { Printer, Users, MagnifyingGlass, ArrowSquareRight, ArrowSquareLeft, Warning, CheckCircle } from "@phosphor-icons/react";

import { safeToPng } from "@/utils/safari-png";
import { sanitizeForFilename } from "@/utils/slug-sanitize";
import { buildCardPdf, buildPersonalisatClassicPdf } from "@/utils/print-pdf";
import { CardFront, CardBack, buildCardStyles, type CardGuestData, type CardPartnerData, type CardWeddingSettings } from "@/components/print/CardCanvas";
import { PersonalisatClassicCard, type PCGuestData, type PCPartnerData, type PCWeddingSettings } from "@/components/print/PersonalisatClassicCanvas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://adesicristi.vercel.app";

type DesignKey = "card" | "classic_personalizat" | "classic";
type FormatKey = "png" | "pdf";

interface GuestRecord {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  partner_id: number | null;
  sex: "M" | "F" | null;
  children?: { id: number; nume: string; prenume: string }[];
}

type FullSettings = CardWeddingSettings & PCWeddingSettings;

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}_${pad(d.getHours())}_${pad(d.getMinutes())}`;
}

async function dataUrlToUint8(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new Uint8Array(await blob.arrayBuffer());
}

export default function PrintPage() {
  const [token, setToken] = useState<string | null>(null);
  const [allGuests, setAllGuests] = useState<GuestRecord[]>([]);
  const [settings, setSettings] = useState<FullSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [design, setDesign] = useState<DesignKey>("card");
  const [format, setFormat] = useState<FormatKey>("png");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchAvail, setSearchAvail] = useState("");
  const [searchSel, setSearchSel] = useState("");
  const [classicCount, setClassicCount] = useState(1);

  const [printing, setPrinting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const renderRef = useRef<HTMLDivElement>(null);
  const [renderTarget, setRenderTarget] = useState<{ guest: GuestRecord; partner: GuestRecord | null; qrDataUrl: string } | null>(null);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [guestsRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/guests`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/wedding-settings`),
        ]);
        if (cancelled) return;
        if (guestsRes.ok) setAllGuests(await guestsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const partnerById = useMemo(() => {
    const m = new Map<number, GuestRecord>();
    for (const g of allGuests) m.set(g.id, g);
    return m;
  }, [allGuests]);

  // Filter out partner rows (they show inline with their main guest, who carries the personalized message)
  const mainGuests = useMemo(() => {
    const partnerIds = new Set(allGuests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
    return allGuests.filter((g) => !partnerIds.has(g.id));
  }, [allGuests]);

  const available = useMemo(() => mainGuests.filter((g) => !selectedIds.has(g.id)), [mainGuests, selectedIds]);
  const selected = useMemo(() => mainGuests.filter((g) => selectedIds.has(g.id)), [mainGuests, selectedIds]);

  const matches = (g: GuestRecord, q: string) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return `${g.prenume} ${g.nume}`.toLowerCase().includes(needle) || (g.slug ?? "").toLowerCase().includes(needle);
  };

  const availableFiltered = useMemo(() => available.filter((g) => matches(g, searchAvail)), [available, searchAvail]);
  const selectedFiltered = useMemo(() => selected.filter((g) => matches(g, searchSel)), [selected, searchSel]);

  function moveToSelected(g: GuestRecord) {
    setSelectedIds((prev) => new Set(prev).add(g.id));
  }
  function moveToAvailable(g: GuestRecord) {
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(g.id); return n; });
  }
  function selectAllVisible() {
    setSelectedIds((prev) => { const n = new Set(prev); for (const g of availableFiltered) n.add(g.id); return n; });
  }
  function deselectAllVisible() {
    setSelectedIds((prev) => { const n = new Set(prev); for (const g of selectedFiltered) n.delete(g.id); return n; });
  }

  const handlePrint = useCallback(async () => {
    if (!settings || printing) return;
    if (design === "classic") {
      if (classicCount < 1) return;
    } else if (selected.length === 0) {
      return;
    }
    setPrinting(true);
    setErrors([]);
    setDone(null);

    const zip = format === "png" ? new JSZip() : null;
    const cardPairs: { frontPng: string; backPng: string }[] = [];
    const pcPngs: string[] = [];
    const failed: string[] = [];

    if (design === "classic") {
      setProgress({ current: 0, total: 1 });
      try {
        const fakeGuest: GuestRecord = { id: 0, nume: "", prenume: "", plus_one: true, intro_short: null, intro_long: null, slug: null, partner_id: null, sex: null };
        flushSync(() => { setRenderTarget(null); });
        flushSync(() => { setRenderTarget({ guest: fakeGuest, partner: null, qrDataUrl: "" }); });
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        await new Promise((r) => setTimeout(r, 250));

        const root = renderRef.current?.querySelector<HTMLElement>(".pc-root");
        if (!root) throw new Error("Invitation not rendered");
        const png = await safeToPng(root);

        const stamp = nowStamp();
        if (format === "png") {
          const blob = await (await fetch(png)).blob();
          saveAs(blob, `print_classic_${stamp}.png`);
          setDone(`Fișierul print_classic_${stamp}.png a fost generat.`);
        } else {
          for (let i = 0; i < classicCount; i++) pcPngs.push(png);
          const pdfOptions = { backgroundColor: settings.color_main || "#FDF8F7" };
          const blob = await buildPersonalisatClassicPdf(pcPngs, pdfOptions);
          const filename = `print_classic_${stamp}.pdf`;
          saveAs(blob, filename);
          setDone(`Fișierul ${filename} a fost generat (${classicCount} invitații).`);
        }
        setProgress({ current: 1, total: 1 });
      } catch (err) {
        failed.push(`Classic generation failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setRenderTarget(null);
      }
      setErrors(failed);
      setPrinting(false);
      return;
    }

    setProgress({ current: 0, total: selected.length });
    for (let i = 0; i < selected.length; i++) {
      const guest = selected[i];
      const partner = guest.partner_id ? partnerById.get(guest.partner_id) ?? null : null;
      const slug = sanitizeForFilename(guest.slug || `${guest.prenume}-${guest.nume}-${guest.id}`);

      try {
        let qrDataUrl = "";
        if (design === "card") {
          const url = `${SITE_URL}/${guest.slug || ""}`;
          const qrColor = settings.color_text || "#2c2c2c";
          qrDataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: qrColor, light: "#ffffff" } });
        }

        // Force a synchronous unmount of the previous guest's render before
        // mounting the next one. The two-step (null → guest) plus flushSync
        // guarantees React has committed a fresh DOM tree before we capture.
        flushSync(() => { setRenderTarget(null); });
        flushSync(() => { setRenderTarget({ guest, partner, qrDataUrl }); });
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        await new Promise((r) => setTimeout(r, 250));

        if (!renderRef.current) throw new Error("Render container missing");

        if (design === "card") {
          const front = renderRef.current.querySelector<HTMLElement>(".card-front");
          const back = renderRef.current.querySelector<HTMLElement>(".card-back");
          if (!front || !back) throw new Error("Card faces not rendered");
          const frontPng = await safeToPng(front);
          const backPng = await safeToPng(back);
          if (zip) {
            const folder = zip.folder(`${slug}_card`);
            if (!folder) throw new Error("Could not create zip folder");
            folder.file(`${slug}_card_fata.png`, await dataUrlToUint8(frontPng));
            folder.file(`${slug}_card_verso.png`, await dataUrlToUint8(backPng));
          } else {
            cardPairs.push({ frontPng, backPng });
          }
        } else {
          const root = renderRef.current.querySelector<HTMLElement>(".pc-root");
          if (!root) throw new Error("Invitation not rendered");
          const png = await safeToPng(root);
          if (zip) {
            zip.file(`${slug}_classic_personalizat.png`, await dataUrlToUint8(png));
          } else {
            pcPngs.push(png);
          }
        }
      } catch (err) {
        failed.push(`${guest.prenume} ${guest.nume}${err instanceof Error ? ` (${err.message})` : ""}`);
      } finally {
        setProgress({ current: i + 1, total: selected.length });
        setRenderTarget(null);
      }
    }

    try {
      const stamp = nowStamp();
      if (zip) {
        const blob = await zip.generateAsync({ type: "blob" });
        const filename = `print_${design}_${stamp}.zip`;
        saveAs(blob, filename);
        setDone(`Arhiva ${filename} a fost generată${failed.length ? ` (${failed.length} erori)` : ""}.`);
      } else {
        const pdfOptions = { backgroundColor: settings.color_main || "#FDF8F7" };
        const blob = design === "card"
          ? await buildCardPdf(cardPairs, pdfOptions)
          : await buildPersonalisatClassicPdf(pcPngs, pdfOptions);
        const filename = `print_${design}_${stamp}.pdf`;
        saveAs(blob, filename);
        setDone(`Fișierul ${filename} a fost generat${failed.length ? ` (${failed.length} erori)` : ""}.`);
      }
    } catch (err) {
      failed.push(`${format.toUpperCase()} generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    setErrors(failed);
    setPrinting(false);
  }, [settings, selected, printing, design, format, partnerById, classicCount]);

  if (loading) return <div className="p-8 text-text-muted">Se încarcă...</div>;
  if (!settings) return <div className="p-8 text-text-muted">Setările nu au fost încărcate.</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Printer size={22} weight="duotone" className="text-button" />
        <h1 className="text-xl font-semibold text-text-heading">Print invitații</h1>
      </div>

      {/* Design + format selectors */}
      <div className="family-card mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-2 tracking-wide uppercase">Design</label>
          <select
            value={design}
            onChange={(e) => setDesign(e.target.value as DesignKey)}
            disabled={printing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
          >
            <option value="card">Card (față + verso)</option>
            <option value="classic_personalizat">Classic Personalizat</option>
            <option value="classic">Classic (general)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-2 tracking-wide uppercase">Format</label>
          <div className="flex gap-2">
            {(["png", "pdf"] as FormatKey[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                disabled={printing}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors cursor-pointer disabled:opacity-50 ${
                  format === f
                    ? "border-button bg-button text-white"
                    : "border-gray-300 bg-white text-text-heading hover:border-button"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Classic generic: just a copy count */}
      {design === "classic" && (
        <div className="family-card">
          <label className="block text-xs text-text-muted mb-2 tracking-wide uppercase">Număr invitații</label>
          <input
            type="number"
            min={1}
            max={500}
            value={classicCount}
            onChange={(e) => setClassicCount(Math.max(1, Math.min(500, parseInt(e.target.value || "1", 10) || 1)))}
            disabled={printing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
          />
          <p className="mt-2 text-xs text-text-muted">
            Cardul classic se generează identic, în versiune plural (fără nume), și se așază tot 3 pe pagina A4.
          </p>
        </div>
      )}

      {/* Two sections */}
      {design !== "classic" && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available */}
        <div className="family-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users size={16} weight="duotone" className="text-text-muted" />
              <h2 className="text-sm font-medium text-text-heading">Disponibili ({availableFiltered.length})</h2>
            </div>
            <button onClick={selectAllVisible} disabled={printing || availableFiltered.length === 0}
              className="text-xs text-button hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1">
              <ArrowSquareRight size={14} weight="duotone" /> Selectează toți
            </button>
          </div>
          <div className="relative mb-2">
            <MagnifyingGlass size={14} className="absolute left-2 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchAvail}
              onChange={(e) => setSearchAvail(e.target.value)}
              placeholder="Caută..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-accent"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-md">
            {availableFiltered.length === 0 ? (
              <p className="p-3 text-xs text-text-muted text-center">Niciun invitat disponibil.</p>
            ) : (
              <ul>
                {availableFiltered.map((g) => (
                  <li key={g.id}>
                    <button onClick={() => moveToSelected(g)} disabled={printing}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-background-soft cursor-pointer text-left disabled:opacity-50">
                      <span>
                        <span className="text-text-heading">{g.prenume} {g.nume}</span>
                        {g.slug && <span className="text-[10px] text-text-muted ml-2">/{g.slug}</span>}
                      </span>
                      <ArrowSquareRight size={16} className="text-text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Selected */}
        <div className="family-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} weight="duotone" className="text-button" />
              <h2 className="text-sm font-medium text-text-heading">Selectați ({selectedFiltered.length})</h2>
            </div>
            <button onClick={deselectAllVisible} disabled={printing || selectedFiltered.length === 0}
              className="text-xs text-text-muted hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1">
              <ArrowSquareLeft size={14} weight="duotone" /> Deselectează toți
            </button>
          </div>
          <div className="relative mb-2">
            <MagnifyingGlass size={14} className="absolute left-2 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchSel}
              onChange={(e) => setSearchSel(e.target.value)}
              placeholder="Caută..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-accent"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-md">
            {selectedFiltered.length === 0 ? (
              <p className="p-3 text-xs text-text-muted text-center">Niciun invitat selectat.</p>
            ) : (
              <ul>
                {selectedFiltered.map((g) => (
                  <li key={g.id}>
                    <button onClick={() => moveToAvailable(g)} disabled={printing}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-background-soft cursor-pointer text-left disabled:opacity-50">
                      <span className="flex items-center gap-2">
                        <ArrowSquareLeft size={16} className="text-text-muted" />
                        <span className="text-text-heading">{g.prenume} {g.nume}</span>
                        {g.slug && <span className="text-[10px] text-text-muted">/{g.slug}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Print bar */}
      <div className="family-card mt-4 sticky bottom-2 z-10 bg-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-text-heading">
            {design === "classic" ? (
              <><strong>{classicCount}</strong> invitații</>
            ) : (
              <><strong>{selected.length}</strong> invitați selectați</>
            )}
            {printing && <span className="ml-3 text-text-muted">{progress.current}/{progress.total} generate...</span>}
          </p>
          <button onClick={handlePrint} disabled={printing || (design === "classic" ? classicCount < 1 : selected.length === 0)}
            className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2">
            <Printer size={16} weight="duotone" />
            {printing ? "Se generează..." : design === "classic" ? `Print ${classicCount} invitații` : `Print ${selected.length} invitați`}
          </button>
        </div>
        {printing && progress.total > 0 && (
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-button transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        )}
      </div>

      {done && !errors.length && (
        <div className="family-card mt-3 flex items-start gap-2 border-l-4 border-l-green-500">
          <CheckCircle size={18} weight="duotone" className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-heading">{done}</p>
        </div>
      )}
      {errors.length > 0 && (
        <div className="family-card mt-3 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-2 mb-2">
            <Warning size={18} weight="duotone" className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-heading">{done || `Erori la ${errors.length} invitați:`}</p>
          </div>
          <ul className="text-xs text-text-muted ml-7 space-y-0.5">
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Off-screen render container (mounted via portal so it lives outside the page layout) */}
      {typeof window !== "undefined" && createPortal(
        <div ref={renderRef} style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none", zIndex: -1 }} aria-hidden>
          {renderTarget && design === "card" && (
            <div key={`card-${renderTarget.guest.id}`} className="card-page-root">
              <style>{buildCardStyles(settings)}</style>
              <div className="cards-container" lang="ro" style={{ background: settings.color_main || "#FDF8F7", padding: 5, fontSynthesis: "none", textRendering: "geometricPrecision" }}>
                <CardFront guest={renderTarget.guest as CardGuestData} partner={renderTarget.partner as CardPartnerData | null} settings={settings as CardWeddingSettings} qrDataUrl={renderTarget.qrDataUrl} />
                <CardBack guest={renderTarget.guest as CardGuestData} partner={renderTarget.partner as CardPartnerData | null} settings={settings as CardWeddingSettings} />
              </div>
            </div>
          )}
          {renderTarget && (design === "classic_personalizat" || design === "classic") && (
            <div key={`pc-${design}-${renderTarget.guest.id}`} className="pc-root" lang="ro" style={{ fontSynthesis: "none", textRendering: "geometricPrecision" }}>
              <PersonalisatClassicCard guest={renderTarget.guest as PCGuestData} partner={renderTarget.partner as PCPartnerData | null} settings={settings as PCWeddingSettings} generic={design === "classic"} />
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
