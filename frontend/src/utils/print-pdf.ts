import { jsPDF } from "jspdf";

// A4 portrait dimensions in mm
const A4_W_MM = 210;
const A4_H_MM = 297;

// Convert CSS pixels (1px = 1/96 inch) to mm
const PX_TO_MM = 25.4 / 96;

// Card body: 9cm × 5.5cm landscape, plus 10px padding on each side (cropmark area)
const CARD_PAD_MM = 10 * PX_TO_MM;
const CARD_RAW_LANDSCAPE_W_MM = 90 + 2 * CARD_PAD_MM; // ~95.29
const CARD_RAW_LANDSCAPE_H_MM = 55 + 2 * CARD_PAD_MM; // ~60.29
const CARD_PORTRAIT_ASPECT = CARD_RAW_LANDSCAPE_H_MM / CARD_RAW_LANDSCAPE_W_MM; // ~0.633

// Maximize cards in 2×2 grid: constrained by A4 height with small vertical margin.
const CARD_PAGE_V_MARGIN_MM = 5;
const CARD_PORTRAIT_H_MM = (A4_H_MM - 2 * CARD_PAGE_V_MARGIN_MM) / 2; // 143.5
const CARD_PORTRAIT_W_MM = CARD_PORTRAIT_H_MM * CARD_PORTRAIT_ASPECT; // ~90.79
const CARDS_GRID_W_MM = 2 * CARD_PORTRAIT_W_MM;
const CARDS_X0_MM = (A4_W_MM - CARDS_GRID_W_MM) / 2; // ~14.21
const CARDS_Y0_MM = CARD_PAGE_V_MARGIN_MM;

// Front layout positions (col, row) for 4 cards
const FRONT_POSITIONS: [number, number][] = [
  [0, 0], // TL
  [1, 0], // TR
  [0, 1], // BL
  [1, 1], // BR
];

// Long-edge duplex flip mirrors columns within rows: 0↔1, 2↔3
const BACK_FOR_FRONT_INDEX = [1, 0, 3, 2];

// PC invitation (15cm × 21cm) rotated 90° = 21cm × 15cm landscape, ratio 21/15 = 1.4
const PC_RATIO = 21 / 15;
const PC_TOP_BOTTOM_MARGIN_MM = 5;
const PC_AVAILABLE_H_MM = A4_H_MM - 2 * PC_TOP_BOTTOM_MARGIN_MM; // 287
const PC_PER_PAGE = 3;
const PC_H_MM = PC_AVAILABLE_H_MM / PC_PER_PAGE; // ~95.67
const PC_W_MM = PC_H_MM * PC_RATIO; // ~133.93
const PC_X_MM = (A4_W_MM - PC_W_MM) / 2; // ~38.04

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

async function rotatePngDataUrl(dataUrl: string, degrees: 90 | -90): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.height;
  canvas.height = img.width;
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

function fillPageBackground(doc: jsPDF, hex: string | undefined) {
  if (!hex) return;
  const [r, g, b] = parseHexColor(hex);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, A4_W_MM, A4_H_MM, "F");
}

export interface CardPair {
  frontPng: string;
  backPng: string;
}

export interface PdfBuildOptions {
  backgroundColor?: string;
}

export async function buildCardPdf(pairs: CardPair[], options: PdfBuildOptions = {}): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const numBatches = Math.ceil(pairs.length / 4);

  for (let batch = 0; batch < numBatches; batch++) {
    const start = batch * 4;
    const slice = pairs.slice(start, start + 4);

    const rotated = await Promise.all(
      slice.map(async (p) => ({
        front: await rotatePngDataUrl(p.frontPng, 90),
        back: await rotatePngDataUrl(p.backPng, 90),
      })),
    );

    // ── Front page
    if (batch > 0) doc.addPage();
    fillPageBackground(doc, options.backgroundColor);
    for (let i = 0; i < rotated.length; i++) {
      const [col, row] = FRONT_POSITIONS[i];
      const x = CARDS_X0_MM + col * CARD_PORTRAIT_W_MM;
      const y = CARDS_Y0_MM + row * CARD_PORTRAIT_H_MM;
      doc.addImage(rotated[i].front, "PNG", x, y, CARD_PORTRAIT_W_MM, CARD_PORTRAIT_H_MM, undefined, "FAST");
    }

    // ── Back page (long-edge duplex flip → mirror columns within rows)
    doc.addPage();
    fillPageBackground(doc, options.backgroundColor);
    for (let i = 0; i < rotated.length; i++) {
      const backIdx = BACK_FOR_FRONT_INDEX[i];
      const [col, row] = FRONT_POSITIONS[backIdx];
      const x = CARDS_X0_MM + col * CARD_PORTRAIT_W_MM;
      const y = CARDS_Y0_MM + row * CARD_PORTRAIT_H_MM;
      doc.addImage(rotated[i].back, "PNG", x, y, CARD_PORTRAIT_W_MM, CARD_PORTRAIT_H_MM, undefined, "FAST");
    }
  }

  return doc.output("blob");
}

export async function buildPersonalisatClassicPdf(invitationPngs: string[], options: PdfBuildOptions = {}): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const numPages = Math.ceil(invitationPngs.length / PC_PER_PAGE);

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    if (pageIdx > 0) doc.addPage();
    fillPageBackground(doc, options.backgroundColor);

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
