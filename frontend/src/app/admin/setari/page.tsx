"use client";

import { useState, useEffect, FormEvent } from "react";
import { applyThemeColors } from "@/utils/settings";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders, forceAdminTextColors } from "../_shared";

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
  updated_at: string;
}

// ─── Helper Components ───────────────────────────────────

function ColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-border-light cursor-pointer p-0.5"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-text-muted mb-1 tracking-wide">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-mono
                     focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1 tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="family-card">
      <h3 className="serif-font text-lg text-text-heading mb-4">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

// ─── Settings Page ───────────────────────────────────────

export default function SetariPage() {
  const { token, onUnauth } = useAdminAuth();
  const [settings, setSettings] = useState<WeddingSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-6">
        <h2 className="serif-font text-2xl text-text-heading">Setari eveniment</h2>
        {settings && (
          <p className="text-xs text-text-muted">
            Ultima actualizare: {new Date(settings.updated_at).toLocaleDateString("ro-RO", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Couple names */}
        <SettingsSection title="Cuplu">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Nume mireasa" value={form.nume_mireasa} onChange={updateForm("nume_mireasa")} placeholder="Ade" />
            <SettingsInput label="Nume mire" value={form.nume_mire} onChange={updateForm("nume_mire")} placeholder="Cristi" />
          </div>
        </SettingsSection>

        {/* Nasi */}
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

        {/* Ceremonie */}
        <SettingsSection title="Cununia Religioasa">
          <SettingsInput label="Descriere / Titlu" value={form.ceremonie_descriere} onChange={updateForm("ceremonie_descriere")} placeholder="Cununia Religioasa" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.ceremonie_data} onChange={updateForm("ceremonie_data")} type="date" />
            <SettingsInput label="Ora" value={form.ceremonie_ora} onChange={updateForm("ceremonie_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.ceremonie_adresa} onChange={updateForm("ceremonie_adresa")} placeholder="Adresa locatiei" />
          <SettingsInput label="Link Google Maps" value={form.ceremonie_google_maps} onChange={updateForm("ceremonie_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Transport */}
        <SettingsSection title="Transport">
          <SettingsInput label="Descriere / Titlu" value={form.transport_descriere} onChange={updateForm("transport_descriere")} placeholder="Transport" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.transport_data} onChange={updateForm("transport_data")} type="date" />
            <SettingsInput label="Ora" value={form.transport_ora} onChange={updateForm("transport_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.transport_adresa} onChange={updateForm("transport_adresa")} placeholder="Adresa locatiei" />
          <SettingsInput label="Link Google Maps" value={form.transport_google_maps} onChange={updateForm("transport_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Petrecere */}
        <SettingsSection title="Petrecerea">
          <SettingsInput label="Descriere / Titlu" value={form.petrecere_descriere} onChange={updateForm("petrecere_descriere")} placeholder="Petrecerea" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.petrecere_data} onChange={updateForm("petrecere_data")} type="date" />
            <SettingsInput label="Ora" value={form.petrecere_ora} onChange={updateForm("petrecere_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.petrecere_adresa} onChange={updateForm("petrecere_adresa")} placeholder="Adresa locatiei" />
          <SettingsInput label="Link Google Maps" value={form.petrecere_google_maps} onChange={updateForm("petrecere_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Parinti mireasa */}
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

        {/* Parinti mire */}
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

        {/* Confirmare */}
        <SettingsSection title="Confirmare invitatie">
          <SettingsInput label="Confirmare pana la" value={form.confirmare_pana_la} onChange={updateForm("confirmare_pana_la")} type="date" />
          <div className="grid grid-cols-2 gap-4">
            <SettingsInput label="Telefon mireasa" value={form.telefon_mireasa} onChange={updateForm("telefon_mireasa")} placeholder="0755 776 372" />
            <SettingsInput label="Telefon mire" value={form.telefon_mire} onChange={updateForm("telefon_mire")} placeholder="0747 340 944" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-wide">Info contact (pentru invitatie)</label>
            <textarea
              value={form.contact_info}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_info: e.target.value }))}
              rows={3}
              placeholder={"Vasile Pop: 0744 486 168 | Alexandru Budai: 0745 123 456"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </SettingsSection>

        {/* YouTube */}
        <SettingsSection title="Video">
          <SettingsInput
            label="Link YouTube (embed format)"
            value={form.link_youtube_video}
            onChange={updateForm("link_youtube_video")}
            placeholder="https://www.youtube.com/embed/..."
          />
        </SettingsSection>

        {/* Colors */}
        <SettingsSection title="Culori tema">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker label="Culoare principala (fundal)" value={form.color_main} onChange={updateForm("color_main")} />
            <ColorPicker label="Culoare secundara (accent)" value={form.color_second} onChange={updateForm("color_second")} />
            <ColorPicker label="Culoare butoane" value={form.color_button} onChange={updateForm("color_button")} />
            <ColorPicker label="Culoare text" value={form.color_text} onChange={updateForm("color_text")} />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 rounded-lg h-12 border border-border-light" style={{ backgroundColor: form.color_main }} />
            <div className="flex-1 rounded-lg h-12 border border-border-light" style={{ backgroundColor: form.color_second }} />
            <div className="flex-1 rounded-lg h-12 border border-border-light" style={{ backgroundColor: form.color_button }} />
            <div className="flex-1 rounded-lg h-12 border border-border-light" style={{ backgroundColor: form.color_text }} />
          </div>
        </SettingsSection>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-button text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer"
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
