"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import { applyThemeColors } from "@/utils/settings";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders, forceAdminTextColors } from "../_shared";
import { useTabParam } from "@/hooks/useTabParam";

// ─── Types ───────────────────────────────────────────────

interface WeddingSettingsData {
  id: number;
  nume_mire: string;
  nume_mireasa: string;
  nas_nume: string | null;
  nas_prenume: string | null;
  nasa_nume: string | null;
  nasa_prenume: string | null;
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
  parinti_mireasa: string | null;
  parinti_mire: string | null;
  tata_mireasa_nume: string | null;
  tata_mireasa_prenume: string | null;
  mama_mireasa_nume: string | null;
  mama_mireasa_prenume: string | null;
  tata_mire_nume: string | null;
  tata_mire_prenume: string | null;
  mama_mire_nume: string | null;
  mama_mire_prenume: string | null;
  confirmare_pana_la: string | null;
  contact_info: string | null;
  color_main: string;
  color_second: string;
  color_button: string;
  color_text: string;
  telefon_mireasa: string | null;
  telefon_mire: string | null;
  numar_mese: number | null;
  min_persoane_masa: number | null;
  max_persoane_masa: number | null;
  numar_estimativ_invitati: number | null;
  numar_estimativ_staff: number | null;
  curs_euro: number | null;
  nr_minim_meniuri: number | null;
  procent_pret_meniu: number | null;
  updated_at: string;
}

// ─── Helper Components ───────────────────────────────────

function ColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-border-light cursor-pointer p-0.5"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className="block text-xs text-text-muted mb-1 tracking-wide">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs text-text-muted mb-1 tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors box-border"
      />
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="family-card min-w-0 overflow-hidden">
      <h3 className="serif-font text-lg text-text-heading mb-4 break-words">{title}</h3>
      <div className="space-y-3 min-w-0">
        {children}
      </div>
    </div>
  );
}

type TabId = "cuplu" | "program" | "familie" | "confirmare" | "aspect" | "logistica" | "bazadedate";

const TABS: { id: TabId; label: string }[] = [
  { id: "cuplu", label: "Cuplu & nași" },
  { id: "program", label: "Program eveniment" },
  { id: "familie", label: "Familie" },
  { id: "confirmare", label: "Confirmare & contact" },
  { id: "aspect", label: "Aspect" },
  { id: "logistica", label: "Mese & logistica" },
  { id: "bazadedate", label: "Baza de date" },
];

// ─── Settings Page ───────────────────────────────────────

function SetariContent() {
  const { token, onUnauth } = useAdminAuth();
  const [activeTab, setActiveTab] = useTabParam<TabId>("tab", "cuplu", ["cuplu", "program", "familie", "confirmare", "aspect", "logistica", "bazadedate"] as const);
  const [settings, setSettings] = useState<WeddingSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dumping, setDumping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    nume_mire: "",
    nume_mireasa: "",
    nas_nume: "",
    nas_prenume: "",
    nasa_nume: "",
    nasa_prenume: "",
    ceremonie_data: "",
    ceremonie_ora: "",
    ceremonie_adresa: "",
    ceremonie_google_maps: "",
    ceremonie_descriere: "",
    transport_data: "",
    transport_ora: "",
    transport_adresa: "",
    transport_google_maps: "",
    transport_descriere: "",
    petrecere_data: "",
    petrecere_ora: "",
    petrecere_adresa: "",
    petrecere_google_maps: "",
    petrecere_descriere: "",
    link_youtube_video: "",
    parinti_mireasa: "",
    parinti_mire: "",
    tata_mireasa_nume: "",
    tata_mireasa_prenume: "",
    mama_mireasa_nume: "",
    mama_mireasa_prenume: "",
    tata_mire_nume: "",
    tata_mire_prenume: "",
    mama_mire_nume: "",
    mama_mire_prenume: "",
    telefon_mireasa: "",
    telefon_mire: "",
    confirmare_pana_la: "",
    contact_info: "",
    color_main: "#FDF8F7",
    color_second: "#C4A484",
    color_button: "#C4A484",
    color_text: "#3A3A3A",
    numar_mese: "",
    min_persoane_masa: "",
    max_persoane_masa: "",
    numar_estimativ_invitati: "",
    numar_estimativ_staff: "",
    curs_euro: "",
    nr_minim_meniuri: "",
    procent_pret_meniu: "100",
  });

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wedding-settings`);
      if (res.ok) {
        const data: WeddingSettingsData = await res.json();
        setSettings(data);
        setForm({
          nume_mire: data.nume_mire || "",
          nume_mireasa: data.nume_mireasa || "",
          nas_nume: data.nas_nume || "",
          nas_prenume: data.nas_prenume || "",
          nasa_nume: data.nasa_nume || "",
          nasa_prenume: data.nasa_prenume || "",
          ceremonie_data: data.ceremonie_data ? data.ceremonie_data.split("T")[0] : "",
          ceremonie_ora: data.ceremonie_ora || "",
          ceremonie_adresa: data.ceremonie_adresa || "",
          ceremonie_google_maps: data.ceremonie_google_maps || "",
          ceremonie_descriere: data.ceremonie_descriere || "",
          transport_data: data.transport_data ? data.transport_data.split("T")[0] : "",
          transport_ora: data.transport_ora || "",
          transport_adresa: data.transport_adresa || "",
          transport_google_maps: data.transport_google_maps || "",
          transport_descriere: data.transport_descriere || "",
          petrecere_data: data.petrecere_data ? data.petrecere_data.split("T")[0] : "",
          petrecere_ora: data.petrecere_ora || "",
          petrecere_adresa: data.petrecere_adresa || "",
          petrecere_google_maps: data.petrecere_google_maps || "",
          petrecere_descriere: data.petrecere_descriere || "",
          link_youtube_video: data.link_youtube_video || "",
          parinti_mireasa: data.parinti_mireasa || "",
          parinti_mire: data.parinti_mire || "",
          tata_mireasa_nume: data.tata_mireasa_nume || "",
          tata_mireasa_prenume: data.tata_mireasa_prenume || "",
          mama_mireasa_nume: data.mama_mireasa_nume || "",
          mama_mireasa_prenume: data.mama_mireasa_prenume || "",
          tata_mire_nume: data.tata_mire_nume || "",
          tata_mire_prenume: data.tata_mire_prenume || "",
          mama_mire_nume: data.mama_mire_nume || "",
          mama_mire_prenume: data.mama_mire_prenume || "",
          telefon_mireasa: data.telefon_mireasa || "",
          telefon_mire: data.telefon_mire || "",
          confirmare_pana_la: data.confirmare_pana_la ? data.confirmare_pana_la.split("T")[0] : "",
          contact_info: data.contact_info || "",
          color_main: data.color_main || "#FDF8F7",
          color_second: data.color_second || "#C4A484",
          color_button: data.color_button || "#C4A484",
          color_text: data.color_text || "#3A3A3A",
          numar_mese: data.numar_mese != null ? String(data.numar_mese) : "",
          min_persoane_masa: data.min_persoane_masa != null ? String(data.min_persoane_masa) : "",
          max_persoane_masa: data.max_persoane_masa != null ? String(data.max_persoane_masa) : "",
          numar_estimativ_invitati: data.numar_estimativ_invitati != null ? String(data.numar_estimativ_invitati) : "",
          numar_estimativ_staff: data.numar_estimativ_staff != null ? String(data.numar_estimativ_staff) : "",
          curs_euro: data.curs_euro != null ? String(data.curs_euro) : "",
          nr_minim_meniuri: data.nr_minim_meniuri != null ? String(data.nr_minim_meniuri) : "",
          procent_pret_meniu: data.procent_pret_meniu != null ? String(data.procent_pret_meniu) : "100",
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSettings(); }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/wedding-settings`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      if (res.status === 401) { onUnauth(); return; }
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applyThemeColors(data);
        forceAdminTextColors();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  const updateForm = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-muted">Se incarca setarile...</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="serif-font text-xl sm:text-2xl text-text-heading break-words">Setari eveniment</h2>
        {settings && (
          <p className="text-xs text-text-muted shrink-0">
            Ultima actualizare: {new Date(settings.updated_at).toLocaleDateString("ro-RO", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Tab bar: pe mobil unul sub altul cu background activ, pe desktop orizontal */}
      <nav className="flex flex-col sm:flex-row sm:border-b sm:border-border-light gap-1 sm:gap-0 sm:mb-6 mb-4" aria-label="Setari">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full sm:w-auto text-left px-4 py-3 sm:py-3 sm:px-4 text-sm font-medium rounded-lg sm:rounded-none sm:rounded-t-lg border-l-4 sm:border-l-0 sm:border-b-2 transition-colors cursor-pointer
                ${isActive
                  ? "bg-background-soft border-button text-text-heading sm:border-button sm:-mb-px"
                  : "border-transparent text-text-muted hover:text-text-heading hover:bg-background-soft/50 sm:hover:bg-transparent sm:hover:border-border-light"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab: Cuplu & nași */}
        {activeTab === "cuplu" && (
          <div className="space-y-6">
            <SettingsSection title="Cuplu">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Nume mireasa" value={form.nume_mireasa} onChange={updateForm("nume_mireasa")} placeholder="Ade" />
                <SettingsInput label="Nume mire" value={form.nume_mire} onChange={updateForm("nume_mire")} placeholder="Cristi" />
              </div>
            </SettingsSection>
            <SettingsSection title="Nasii">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume nasa" value={form.nasa_prenume} onChange={updateForm("nasa_prenume")} placeholder="Prenume" />
                <SettingsInput label="Nume nasa" value={form.nasa_nume} onChange={updateForm("nasa_nume")} placeholder="Nume" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume nas" value={form.nas_prenume} onChange={updateForm("nas_prenume")} placeholder="Prenume" />
                <SettingsInput label="Nume nas" value={form.nas_nume} onChange={updateForm("nas_nume")} placeholder="Nume" />
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Tab: Program eveniment */}
        {activeTab === "program" && (
          <div className="space-y-6">
            <SettingsSection title="Cununia Religioasa">
              <SettingsInput label="Descriere / Titlu" value={form.ceremonie_descriere} onChange={updateForm("ceremonie_descriere")} placeholder="Cununia Religioasa" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Data" value={form.ceremonie_data} onChange={updateForm("ceremonie_data")} type="date" />
                <SettingsInput label="Ora" value={form.ceremonie_ora} onChange={updateForm("ceremonie_ora")} type="time" />
              </div>
              <SettingsInput label="Adresa" value={form.ceremonie_adresa} onChange={updateForm("ceremonie_adresa")} placeholder="Adresa locatiei" />
              <SettingsInput label="Link Google Maps" value={form.ceremonie_google_maps} onChange={updateForm("ceremonie_google_maps")} placeholder="https://maps.app.goo.gl/..." />
            </SettingsSection>
            <SettingsSection title="Transport">
              <SettingsInput label="Descriere / Titlu" value={form.transport_descriere} onChange={updateForm("transport_descriere")} placeholder="Transport" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Data" value={form.transport_data} onChange={updateForm("transport_data")} type="date" />
                <SettingsInput label="Ora" value={form.transport_ora} onChange={updateForm("transport_ora")} type="time" />
              </div>
              <SettingsInput label="Adresa" value={form.transport_adresa} onChange={updateForm("transport_adresa")} placeholder="Adresa locatiei" />
              <SettingsInput label="Link Google Maps" value={form.transport_google_maps} onChange={updateForm("transport_google_maps")} placeholder="https://maps.app.goo.gl/..." />
            </SettingsSection>
            <SettingsSection title="Petrecerea">
              <SettingsInput label="Descriere / Titlu" value={form.petrecere_descriere} onChange={updateForm("petrecere_descriere")} placeholder="Petrecerea" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Data" value={form.petrecere_data} onChange={updateForm("petrecere_data")} type="date" />
                <SettingsInput label="Ora" value={form.petrecere_ora} onChange={updateForm("petrecere_ora")} type="time" />
              </div>
              <SettingsInput label="Adresa" value={form.petrecere_adresa} onChange={updateForm("petrecere_adresa")} placeholder="Adresa locatiei" />
              <SettingsInput label="Link Google Maps" value={form.petrecere_google_maps} onChange={updateForm("petrecere_google_maps")} placeholder="https://maps.app.goo.gl/..." />
            </SettingsSection>
          </div>
        )}

        {/* Tab: Familie */}
        {activeTab === "familie" && (
          <div className="space-y-6">
            <SettingsSection title="Parintii miresei">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume tata" value={form.tata_mireasa_prenume} onChange={updateForm("tata_mireasa_prenume")} placeholder="Vasile" />
                <SettingsInput label="Nume tata" value={form.tata_mireasa_nume} onChange={updateForm("tata_mireasa_nume")} placeholder="Pop" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume mama" value={form.mama_mireasa_prenume} onChange={updateForm("mama_mireasa_prenume")} placeholder="Veronica" />
                <SettingsInput label="Nume mama" value={form.mama_mireasa_nume} onChange={updateForm("mama_mireasa_nume")} placeholder="Pop" />
              </div>
            </SettingsSection>
            <SettingsSection title="Parintii mirelui">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume tata" value={form.tata_mire_prenume} onChange={updateForm("tata_mire_prenume")} placeholder="Alexandru" />
                <SettingsInput label="Nume tata" value={form.tata_mire_nume} onChange={updateForm("tata_mire_nume")} placeholder="Budai" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Prenume mama" value={form.mama_mire_prenume} onChange={updateForm("mama_mire_prenume")} placeholder="Marieta" />
                <SettingsInput label="Nume mama" value={form.mama_mire_nume} onChange={updateForm("mama_mire_nume")} placeholder="Budai" />
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Tab: Confirmare & contact */}
        {activeTab === "confirmare" && (
          <SettingsSection title="Confirmare invitatie">
            <SettingsInput label="Confirmare pana la" value={form.confirmare_pana_la} onChange={updateForm("confirmare_pana_la")} type="date" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SettingsInput label="Telefon mireasa" value={form.telefon_mireasa} onChange={updateForm("telefon_mireasa")} placeholder="0755 776 372" />
              <SettingsInput label="Telefon mire" value={form.telefon_mire} onChange={updateForm("telefon_mire")} placeholder="0747 340 944" />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-text-muted mb-1 tracking-wide">Info contact (pentru invitatie)</label>
              <textarea
                value={form.contact_info}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_info: e.target.value }))}
                rows={3}
                placeholder={"Vasile Pop: 0744 486 168 | Alexandru Budai: 0745 123 456"}
                className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none box-border"
              />
            </div>
          </SettingsSection>
        )}

        {/* Tab: Aspect */}
        {activeTab === "aspect" && (
          <div className="space-y-6">
            <SettingsSection title="Video">
              <SettingsInput
                label="Link video (YouTube sau Vimeo)"
                value={form.link_youtube_video}
                onChange={updateForm("link_youtube_video")}
                placeholder="https://vimeo.com/123456789 sau https://youtube.com/watch?v=..."
              />
            </SettingsSection>
            <SettingsSection title="Culori tema">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPicker label="Culoare principala (fundal)" value={form.color_main} onChange={updateForm("color_main")} />
                <ColorPicker label="Culoare secundara (accent)" value={form.color_second} onChange={updateForm("color_second")} />
                <ColorPicker label="Culoare butoane" value={form.color_button} onChange={updateForm("color_button")} />
                <ColorPicker label="Culoare text" value={form.color_text} onChange={updateForm("color_text")} />
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg h-12 border border-border-light min-h-[3rem]" style={{ backgroundColor: form.color_main }} />
                <div className="rounded-lg h-12 border border-border-light min-h-[3rem]" style={{ backgroundColor: form.color_second }} />
                <div className="rounded-lg h-12 border border-border-light min-h-[3rem]" style={{ backgroundColor: form.color_button }} />
                <div className="rounded-lg h-12 border border-border-light min-h-[3rem]" style={{ backgroundColor: form.color_text }} />
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Tab: Mese & logistica */}
        {activeTab === "logistica" && (
          <div className="space-y-6">
            <SettingsSection title="Configurare mese">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SettingsInput label="Numar de mese" value={form.numar_mese} onChange={updateForm("numar_mese")} type="number" placeholder="20" />
                <SettingsInput label="Min persoane / masa" value={form.min_persoane_masa} onChange={updateForm("min_persoane_masa")} type="number" placeholder="8" />
                <SettingsInput label="Max persoane / masa" value={form.max_persoane_masa} onChange={updateForm("max_persoane_masa")} type="number" placeholder="12" />
              </div>
            </SettingsSection>
            <SettingsSection title="Estimari">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsInput label="Numar estimativ invitati" value={form.numar_estimativ_invitati} onChange={updateForm("numar_estimativ_invitati")} type="number" placeholder="200" />
                <SettingsInput label="Numar estimativ staff" value={form.numar_estimativ_staff} onChange={updateForm("numar_estimativ_staff")} type="number" placeholder="15" />
              </div>
            </SettingsSection>
            <SettingsSection title="Restaurant - meniuri minime">
              <SettingsInput label="Nr. minim meniuri restaurant" value={form.nr_minim_meniuri} onChange={updateForm("nr_minim_meniuri")} type="number" placeholder="150" />
              <p className="text-xs text-text-muted -mt-2">Daca numarul de invitati prezenti + personalul furnizorilor cu loc la masa este sub acest minim, diferenta va fi calculata ca un cost suplimentar.</p>
              <div>
                <label className="block text-xs text-text-muted mb-2">Procent pret meniu pentru diferenta: <span className="font-medium text-foreground">{form.procent_pret_meniu || 100}%</span></label>
                <input type="range" min="0" max="100" step="25"
                  value={form.procent_pret_meniu || "100"}
                  onChange={(e) => setForm({ ...form, procent_pret_meniu: e.target.value })}
                  className="w-full accent-accent" />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
            </SettingsSection>
            <SettingsSection title="Moneda">
              <SettingsInput label="Curs EUR/RON" value={form.curs_euro} onChange={updateForm("curs_euro")} type="number" placeholder="4.97" />
            </SettingsSection>
          </div>
        )}

        {/* Tab: Baza de date */}
        {activeTab === "bazadedate" && (
          <div className="space-y-6">
            <SettingsSection title="Export baza de date">
              <p className="text-xs text-text-muted">Descarca un fisier SQL cu toate datele din baza de date de productie. Util pentru sincronizare locala sau backup.</p>
              <button
                type="button"
                disabled={dumping}
                onClick={async () => {
                  setDumping(true);
                  try {
                    const res = await fetch(`${API_URL}/api/admin/db-dump`, {
                      headers: authHeaders(token),
                    });
                    if (res.status === 401) { onUnauth(); return; }
                    if (!res.ok) throw new Error("Export failed");
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const disposition = res.headers.get("Content-Disposition");
                    const filename = disposition?.match(/filename="(.+)"/)?.[1] || `dump_${new Date().toISOString().slice(0, 10)}.sql`;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    alert("Eroare la export.");
                  } finally {
                    setDumping(false);
                  }
                }}
                className="w-full sm:w-auto bg-button text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                {dumping ? "Se exporta..." : "Descarca SQL dump"}
              </button>
            </SettingsSection>

            <SettingsSection title="Import baza de date">
              <p className="text-xs text-text-muted">Importa un fisier SQL exportat anterior. Atentie: datele existente vor fi suprascrise!</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className="w-full sm:w-auto bg-button text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer text-center disabled:opacity-50">
                  {importing ? "Se importa..." : "Incarca fisier SQL"}
                  <input
                    type="file"
                    accept=".sql"
                    className="hidden"
                    disabled={importing}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!confirm("Esti sigur? Datele existente vor fi suprascrise cu cele din fisier.")) {
                        e.target.value = "";
                        return;
                      }
                      setImporting(true);
                      setImportStatus(null);
                      try {
                        const sql = await file.text();
                        const res = await fetch(`${API_URL}/api/admin/db-import`, {
                          method: "POST",
                          headers: { ...authHeaders(token), "Content-Type": "application/json" },
                          body: JSON.stringify({ sql }),
                        });
                        if (res.status === 401) { onUnauth(); return; }
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({ error: "Import failed" }));
                          setImportStatus(`Eroare: ${err.error}`);
                        } else {
                          const data = await res.json();
                          setImportStatus(`Import reusit! ${data.statements} instructiuni executate.`);
                          fetchSettings();
                        }
                      } catch {
                        setImportStatus("Eroare la import.");
                      } finally {
                        setImporting(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {importStatus && (
                  <span className={`text-sm font-medium ${importStatus.startsWith("Eroare") ? "text-red-600" : "text-green-600"}`}>
                    {importStatus}
                  </span>
                )}
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Save button - visible on all tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-button text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Se salveaza..." : "Salveaza setarile"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Salvat cu succes!</span>
          )}
        </div>
      </form>
    </div>
  );
}

export default function SetariPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</div>}>
      <SetariContent />
    </Suspense>
  );
}
