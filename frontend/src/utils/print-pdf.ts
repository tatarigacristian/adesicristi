import { jsPDF } from "jspdf";

// A4 dimensions in mm
const A4_SHORT_MM = 210;
const A4_LONG_MM = 297;

// Card body: 9cm × 5.5cm landscape (no padding)
const CARD_RAW_W_MM = 90;
const CARD_RAW_H_MM = 55;
const CARD_ASPECT = CARD_RAW_H_MM / CARD_RAW_W_MM; // ~0.611

// 2×2 grid on landscape A4: width-constrained (cards touch left/right edges).
const CARD_W_MM = A4_LONG_MM / 2; // 148.5
const CARD_H_MM = CARD_W_MM * CARD_ASPECT; // ~90.75
const CARDS_GRID_H_MM = 2 * CARD_H_MM; // ~181.5
const CARDS_X0_MM = 0;
const CARDS_Y0_MM = (A4_SHORT_MM - CARDS_GRID_H_MM) / 2; // ~14.25

// Front layout positions (col, row) for 4 cards
const FRONT_POSITIONS: [number, number][] = [
  [0, 0], // TL
  [1, 0], // TR
  [0, 1], // BL
  [1, 1], // BR
];

// Back page swaps columns (TL↔TR, BL↔BR) so each card's verso lines up with
// its front after the xerox's duplex flip. PDF reading order on back: 2,1,4,3.
const BACK_FOR_FRONT_INDEX = [1, 0, 3, 2];

// PC invitation (15cm × 30cm) rotated 90° = 30cm × 15cm landscape, ratio 30/15 = 2
const PC_RATIO = 30 / 15;
const PC_TOP_BOTTOM_MARGIN_MM = 0;
const PC_PAGE_W_MM = A4_SHORT_MM;
const PC_PAGE_H_MM = A4_LONG_MM;
const PC_AVAILABLE_H_MM = PC_PAGE_H_MM - 2 * PC_TOP_BOTTOM_MARGIN_MM; // 297
const PC_PER_PAGE = 3;
const PC_H_MM = PC_AVAILABLE_H_MM / PC_PER_PAGE; // 99
const PC_W_MM = PC_H_MM * PC_RATIO; // 198
const PC_X_MM = (PC_PAGE_W_MM - PC_W_MM) / 2; // 6

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

async function rotatePngDataUrl(dataUrl: string, degrees: 90 | -90 | 180): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  if (degrees === 180) {
    canvas.width = img.width;
    canvas.height = img.height;
  } else {
    canvas.width = img.height;
    canvas.height = img.width;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas.toDataURL("image/png");
}

function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const expanded = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return [r, g, b];
}

function fillPageBackground(doc: jsPDF, hex: string | undefined, w: number, h: number) {
  if (!hex) return;
  const [r, g, b] = parseHexColor(hex);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, w, h, "F");
}

function drawCardIndex(doc: jsPDF, x: number, y: number, row: number, label: number) {
  const labelX = x + CARD_W_MM / 2;
  const labelY = row === 0 ? y - 2 : y + CARD_H_MM + 5;
  doc.setFontSize(6);
  doc.setTextColor(140, 140, 140);
  doc.text(`${label}`, labelX, labelY, { align: "center" });
}

export interface CardPair {
  frontPng: string;
  backPng: string;
}

export interface PdfBuildOptions {
  backgroundColor?: string;
}

export async function buildCardPdf(pairs: CardPair[], options: PdfBuildOptions = {}): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true });

  const numBatches = Math.ceil(pairs.length / 4);

  for (let batch = 0; batch < numBatches; batch++) {
    const start = batch * 4;
    const slice = pairs.slice(start, start + 4);

    const rotated = slice.map((p) => ({
      front: p.frontPng,
      back: p.backPng,
    }));

    // ── Front page
    if (batch > 0) doc.addPage();
    fillPageBackground(doc, options.backgroundColor, A4_LONG_MM, A4_SHORT_MM);
    for (let i = 0; i < rotated.length; i++) {
      const [col, row] = FRONT_POSITIONS[i];
      const x = CARDS_X0_MM + col * CARD_W_MM;
      const y = CARDS_Y0_MM + row * CARD_H_MM;
      doc.addImage(rotated[i].front, "PNG", x, y, CARD_W_MM, CARD_H_MM, undefined, "FAST");
      drawCardIndex(doc, x, y, row, i + 1);
    }

    // ── Back page (positions swap rows so each card's verso lines up with its front)
    doc.addPage();
    fillPageBackground(doc, options.backgroundColor, A4_LONG_MM, A4_SHORT_MM);
    for (let i = 0; i < rotated.length; i++) {
      const backIdx = BACK_FOR_FRONT_INDEX[i];
      const [col, row] = FRONT_POSITIONS[backIdx];
      const x = CARDS_X0_MM + col * CARD_W_MM;
      const y = CARDS_Y0_MM + row * CARD_H_MM;
      doc.addImage(rotated[i].back, "PNG", x, y, CARD_W_MM, CARD_H_MM, undefined, "FAST");
      drawCardIndex(doc, x, y, row, i + 1);
    }
  }

  return doc.output("blob");
}

// ─── Money envelope (plic de dar) ───────────────────────────────
// Unfolded DL envelope net (landscape): side flaps + top seal flap + bottom flap.
// Net bounding box in mm (see /admin/plic-bani SVG, same viewBox).
const ENV_NET_W_MM = 250;
const ENV_NET_H_MM = 231;
const ENV_MARGIN_MM = 6;

export interface EnvelopePdfOptions {
  format?: "a4" | "a3";
}

export async function buildEnvelopePdf(netPng: string, options: EnvelopePdfOptions = {}): Promise<Blob> {
  const format = options.format ?? "a4";
  const doc = new jsPDF({ unit: "mm", format, orientation: "landscape", compress: true });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - 2 * ENV_MARGIN_MM;
  const usableH = pageH - 2 * ENV_MARGIN_MM;

  // Fit the net inside the page; never upscale beyond true DL (scale ≤ 1).
  const scale = Math.min(usableW / ENV_NET_W_MM, usableH / ENV_NET_H_MM, 1);
  const w = ENV_NET_W_MM * scale;
  const h = ENV_NET_H_MM * scale;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  // No page fill — the net PNG carries its own paper color, so the surrounding
  // sheet stays white (less ink, clean cut edges show the colored envelope only).
  doc.addImage(netPng, "PNG", x, y, w, h, undefined, "FAST");

  return doc.output("blob");
}

// ─── Cort de masă (table tent) ──────────────────────────────────────
// Foaie A4 portret la dimensiune reală (full-bleed). Se tipărește la 100%,
// se îndoaie la mijloc pe orizontală și stă în picioare pe masă.
export async function buildTentPdf(sheetPng: string): Promise<Blob> {
  return buildA4Pdf([sheetPng]);
}

// Una sau mai multe foi A4 portret full-bleed, câte o pagină per PNG.
// Folosit pentru: toate mesele (paginate) și meniu+bar față-verso (2 pagini).
export async function buildA4Pdf(sheetPngs: string[]): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  sheetPngs.forEach((png, i) => {
    if (i > 0) doc.addPage();
    doc.addImage(png, "PNG", 0, 0, A4_SHORT_MM, A4_LONG_MM, undefined, "FAST");
  });
  return doc.output("blob");
}

export async function buildPersonalisatClassicPdf(invitationPngs: string[], options: PdfBuildOptions = {}): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const numPages = Math.ceil(invitationPngs.length / PC_PER_PAGE);

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    if (pageIdx > 0) doc.addPage();
    fillPageBackground(doc, options.backgroundColor, PC_PAGE_W_MM, PC_PAGE_H_MM);

    const start = pageIdx * PC_PER_PAGE;
    const slice = invitationPngs.slice(start, start + PC_PER_PAGE);

    const rotated = await Promise.all(slice.map((png) => rotatePngDataUrl(png, 90)));

    for (let i = 0; i < rotated.length; i++) {
      const y = PC_TOP_BOTTOM_MARGIN_MM + i * PC_H_MM;
      doc.addImage(rotated[i], "PNG", PC_X_MM, y, PC_W_MM, PC_H_MM, undefined, "FAST");
    }
  }

  return doc.output("blob");
}
