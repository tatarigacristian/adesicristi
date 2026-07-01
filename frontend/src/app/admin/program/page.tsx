"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders } from "../_shared";
import { PROGRAM_ICONS, programIcon } from "@/utils/program-icons";
import { PencilSimple, Trash } from "@phosphor-icons/react";

interface ProgramItem {
  id: number;
  titlu: string;
  ora: string;
  descriere: string | null;
  iconita: string;
  ordine: number;
}

// ─── Form modal ─────────────────────────────────────────
function ProgramFormModal({
  editItem,
  onClose,
  onSave,
  saving,
}: {
  editItem: ProgramItem | null;
  onClose: () => void;
  onSave: (data: { titlu: string; ora: string; descriere: string; iconita: string }) => void;
  saving: boolean;
}) {
  const [titlu, setTitlu] = useState(editItem?.titlu ?? "");
  // ora vine din DB ca "HH:MM:SS" (TIME); input-ul type=time folosește "HH:MM".
  const [ora, setOra] = useState((editItem?.ora ?? "").slice(0, 5));
  const [descriere, setDescriere] = useState(editItem?.descriere ?? "");
  const [iconita, setIconita] = useState(editItem?.iconita ?? "star");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ titlu, ora, descriere, iconita });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="p-5 pb-3">
          <h3 className="serif-font text-lg text-text-heading">
            {editItem ? "Editează momentul" : "Moment nou"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 overflow-y-auto flex-1 space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Ora</label>
              <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Titlu</label>
              <input type="text" value={titlu} onChange={(e) => setTitlu(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Descriere (opțional)</label>
              <textarea value={descriere} onChange={(e) => setDescriere(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Iconiță</label>
              <div className="grid grid-cols-6 gap-1.5">
                {PROGRAM_ICONS.map(({ key, label, Icon }) => (
                  <button key={key} type="button" title={label} onClick={() => setIconita(key)}
                    className={`aspect-square flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                      iconita === key ? "border-button bg-button/10 text-button" : "border-border-light text-text-muted hover:text-text-heading"
                    }`}>
                    <Icon size={18} weight="fill" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-5 pt-3 border-t border-border-light flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-button text-white py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? "Se salvează..." : "Salvează"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProgramPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ProgramItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ProgramItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/program-items`, { headers: authHeaders(token) });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const handleSave = useCallback(async (data: { titlu: string; ora: string; descriere: string; iconita: string }) => {
    setSaving(true);
    try {
      const method = editItem ? "PUT" : "POST";
      const url = editItem ? `${API_URL}/api/admin/program-items/${editItem.id}` : `${API_URL}/api/admin/program-items`;
      await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(data) });
      setShowForm(false);
      setEditItem(null);
      await load();
    } finally {
      setSaving(false);
    }
  }, [editItem, token, load]);

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/program-items/${deleteItem.id}`, { method: "DELETE", headers: authHeaders(token) });
      setDeleteItem(null);
      await load();
    } finally {
      setSaving(false);
    }
  }, [deleteItem, token, load]);

  return (
    <div>
      <h1 className="script-font text-3xl text-text-heading mb-1">Programul serii</h1>
      <p className="text-sm text-text-muted mb-6">
        Momentele afișate pe pagina publică <span className="font-mono text-xs">/program</span>. Fiecare are oră, titlu, descriere opțională și o iconiță.
      </p>

      <button onClick={() => { setEditItem(null); setShowForm(true); }}
        className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer mb-4">
        + Adaugă moment
      </button>

      {loading ? (
        <p className="text-sm text-text-muted py-8">Se încarcă...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted py-8">Niciun moment încă. Adaugă primul.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = programIcon(item.iconita);
            return (
              <li key={item.id} className="family-card flex items-center gap-3 px-4 py-3">
                <span className="w-9 h-9 rounded-full border border-accent flex items-center justify-center shrink-0 text-accent-rose">
                  <Icon size={18} weight="fill" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-accent-rose" style={{ fontVariantNumeric: "tabular-nums" }}>{item.ora}</div>
                  <div className="serif-font text-lg text-text-heading leading-snug truncate">{item.titlu}</div>
                  {item.descriere && item.descriere.trim() && (
                    <div className="text-xs text-text-muted truncate">{item.descriere}</div>
                  )}
                </div>
                <button onClick={() => { setEditItem(item); setShowForm(true); }}
                  className="p-2 text-text-muted hover:text-text-heading transition-colors cursor-pointer" title="Editează">
                  <PencilSimple size={17} weight="bold" />
                </button>
                <button onClick={() => setDeleteItem(item)}
                  className="p-2 text-text-muted hover:text-red-600 transition-colors cursor-pointer" title="Șterge">
                  <Trash size={17} weight="bold" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showForm && (
        <ProgramFormModal
          editItem={editItem}
          saving={saving}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-xs p-5">
            <h3 className="serif-font text-lg text-text-heading mb-2">Ștergi momentul?</h3>
            <p className="text-sm text-text-muted mb-5">„{deleteItem.titlu}" ({deleteItem.ora}) va fi eliminat definitiv.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                {saving ? "Se șterge..." : "Șterge"}
              </button>
              <button onClick={() => setDeleteItem(null)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
