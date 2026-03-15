const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export interface WeddingSettings {
  id: number;
  nume_mire: string;
  nume_mireasa: string;
  ceremonie_data: string | null;
  ceremonie_ora: string | null;
  ceremonie_adresa: string | null;
  ceremonie_google_maps: string | null;
  ceremonie_descriere: string | null;
  transport_data: string | null;
  transport_ora: string | null;
  transport_adresa: string | null;
  transport_google_maps: string | null;
  transport_descriere: string | null;
  petrecere_data: string | null;
  petrecere_ora: string | null;
  petrecere_adresa: string | null;
  petrecere_google_maps: string | null;
  petrecere_descriere: string | null;
  link_youtube_video: string | null;
  color_main: string;
  color_second: string;
  color_button: string;
  color_text: string;
  updated_at: string;
}

export async function fetchWeddingSettings(): Promise<WeddingSettings | null> {
  try {
    const res = await fetch(`${API_URL}/api/wedding-settings`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getWeddingDateISO(settings: WeddingSettings | null): string {
  if (settings?.ceremonie_data) {
    // ceremonie_data comes as ISO from MySQL (e.g. "2026-07-03T21:00:00.000Z")
    // Extract just the date part YYYY-MM-DD
    const datePart = settings.ceremonie_data.split("T")[0];
    const time = settings.ceremonie_ora || "11:00";
    return `${datePart}T${time}:00`;
  }
  return "2026-07-04T11:00:00";
}

export function getCoupleNames(settings: WeddingSettings | null): { mire: string; mireasa: string; display: string } {
  const mireasa = settings?.nume_mireasa || "Ade";
  const mire = settings?.nume_mire || "Cristi";
  return { mire, mireasa, display: `${mireasa} & ${mire}` };
}

// ─── Color utilities ─────────────────────────────────────

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function lighten(hex: string, amount: number): string {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

function desaturate(hex: string, amount: number): string {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex(h, Math.max(0, s - amount), l);
}

export function applyThemeColors(settings: WeddingSettings | null): void {
  // Use defaults if settings is null (API failed)
  if (!settings) {
    settings = {
      color_main: "#FDF8F7",
      color_second: "#C4A484",
      color_button: "#C4A484",
      color_text: "#3A3A3A",
    } as WeddingSettings;
  }

  const main = settings.color_main || "#FDF8F7";
  const second = settings.color_second || "#C4A484";
  const button = settings.color_button || "#C4A484";
  const text = settings.color_text || "#3A3A3A";

  const root = document.documentElement;

  // Main color (background)
  root.style.setProperty("--color-background-soft", main);
  root.style.setProperty("--color-background", lighten(main, 5));

  // Second color (accent / decorative elements)
  root.style.setProperty("--color-accent", second);
  root.style.setProperty("--color-accent-light", lighten(second, 8));

  // Button color
  root.style.setProperty("--color-button", button);
  root.style.setProperty("--color-button-hover", lighten(button, 8));

  // Button color (also used for accent-rose elements)
  root.style.setProperty("--color-accent-rose", button);
  root.style.setProperty("--color-accent-rose-light", lighten(button, 10));

  // Text color
  root.style.setProperty("--color-text-heading", text);
  root.style.setProperty("--color-foreground", lighten(text, 15));
  root.style.setProperty("--color-text-muted", lighten(text, 25));
  root.style.setProperty("--color-dark", text);

  // Border colors derived from second color
  root.style.setProperty("--color-border", lighten(desaturate(second, 20), 30));
  root.style.setProperty("--color-border-light", lighten(desaturate(second, 25), 35));
}
