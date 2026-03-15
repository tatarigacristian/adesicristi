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
