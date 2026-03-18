"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, PAGE_SIZE, Guest, authHeaders, Pagination, SearchInput, FilterButton } from "../_shared";

type GuestFilter = "all" | "plus_one" | "no_plus_one";

const DIN_PARTEA_LABELS: Record<string, string> = {
  mire: "Mire", mireasa: "Mireasa", nasi: "Nasi",
  parintii_mire: "Par. mire", parintii_mireasa: "Par. mireasa",
};

export default function GuestsPage() {
  const { token, onUnauth } = useAdminAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "", sex: "" as "" | "M" | "F", estimated_gift_min: "", estimated_gift_max: "", din_partea: "" as "" | "mire" | "mireasa" | "nasi" | "parintii_mire" | "parintii_mireasa", loc_pe_scaun: true, children: [] as { nume: string; prenume: string }[] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ message: string; field?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Guest | null>(null);
  const [invitatiePicker, setInvitatiePicker] = useState<Guest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GuestFilter>("all");
  const [page, setPage] = useState(1);

  async function fetchGuests() {
    const res = await fetch(`${API_URL}/api/admin/guests`, { headers: authHeaders(token) });
    if (res.status === 401) { onUnauth(); return; }
    setGuests(await res.json());
  }

  useEffect(() => { fetchGuests(); }, []);

  // Filter out partner rows (they show inline with their main guest)
  const mainGuests = useMemo(() => {
    const partnerIds = new Set(guests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
    return guests.filter((g) => !partnerIds.has(g.id));
  }, [guests]);

  // Filtered & searched data
  const filtered = useMemo(() => {
    let result = mainGuests;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) => {
        const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
        return (
          g.nume.toLowerCase().includes(q) ||
          g.prenume.toLowerCase().includes(q) ||
          (g.slug && g.slug.toLowerCase().includes(q)) ||
          (g.intro_short && g.intro_short.toLowerCase().includes(q)) ||
          (g.intro_long && g.intro_long.toLowerCase().includes(q)) ||
          (partner && (partner.nume.toLowerCase().includes(q) || partner.prenume.toLowerCase().includes(q)))
        );
      });
    }

    // Filter
    if (filter === "plus_one") result = result.filter((g) => g.plus_one);
    if (filter === "no_plus_one") result = result.filter((g) => !g.plus_one);

    return result;
  }, [mainGuests, guests, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filter]);

  const plusOneCount = mainGuests.filter((g) => g.plus_one).length;
  const noPlusOneCount = mainGuests.filter((g) => !g.plus_one).length;

  function openNew() {
    setEditGuest(null);
    setSaveError(null);
    setForm({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "", sex: "", estimated_gift_min: "", estimated_gift_max: "", din_partea: "", loc_pe_scaun: true, children: [] });
    setShowForm(true);
  }

  function openEdit(g: Guest) {
    setEditGuest(g);
    // Find partner data if exists
    const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
    setForm({
      nume: g.nume,
      prenume: g.prenume,
      plus_one: g.plus_one,
      intro_short: g.intro_short || "",
      intro_long: g.intro_long || "",
      slug: g.slug || "",
      partner_nume: partner?.nume || "",
      partner_prenume: partner?.prenume || "",
      sex: g.sex || "",
      estimated_gift_min: g.estimated_gift_min != null ? String(g.estimated_gift_min) : "",
      estimated_gift_max: g.estimated_gift_max != null ? String(g.estimated_gift_max) : "",
      din_partea: g.din_partea || "",
      loc_pe_scaun: g.loc_pe_scaun !== false,
      children: (g.children || []).map((c) => ({ nume: c.nume, prenume: c.prenume })),
    });
    setSaveError(null);
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const method = editGuest ? "PUT" : "POST";
    const url = editGuest ? `${API_URL}/api/admin/guests/${editGuest.id}` : `${API_URL}/api/admin/guests`;
    const payload = { ...form, sex: form.sex || null, estimated_gift_min: form.estimated_gift_min ? Number(form.estimated_gift_min) : null, estimated_gift_max: form.estimated_gift_max ? Number(form.estimated_gift_max) : null, din_partea: form.din_partea || null, children: form.children.filter((c) => c.nume && c.prenume) };
    const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
    let data: { error?: string; field?: string } = {};
    try {
      data = await res.json();
    } catch {
      /* empty */
    }
    if (res.status === 401) {
      onUnauth();
      setSaving(false);
      return;
    }
    if (!res.ok) {
      setSaveError({
        message: typeof data.error === "string" ? data.error : "Eroare la salvare.",
        field: data.field,
      });
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowForm(false);
    fetchGuests();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await fetch(`${API_URL}/api/admin/guests/${deleteConfirm.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(false);
    setDeleteConfirm(null);
    fetchGuests();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-font text-2xl text-text-heading">Invitati</h2>
        <button onClick={openNew}
          className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
          + Adauga invitat
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Cauta dupa nume, prenume sau notite..." />
        </div>
        <div className="flex items-center gap-2">
          <FilterButton label="Toti" active={filter === "all"} count={mainGuests.length} onClick={() => setFilter("all")} />
          <FilterButton label="Cu +1" active={filter === "plus_one"} count={plusOneCount} onClick={() => setFilter("plus_one")} />
          <FilterButton label="Fara +1" active={filter === "no_plus_one"} count={noPlusOneCount} onClick={() => setFilter("no_plus_one")} />
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3">
              <h3 className="serif-font text-lg text-text-heading">
                {editGuest ? "Editeaza invitat" : "Invitat nou"}
              </h3>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="px-5 overflow-y-auto flex-1 space-y-3">
            {saveError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                {saveError.message}
              </div>
            )}
              {/* Din partea */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Din partea</label>
                <select value={form.din_partea} onChange={(e) => setForm({ ...form, din_partea: e.target.value as typeof form.din_partea })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors appearance-none">
                  <option value="">Neselectat</option>
                  <option value="mire">Mirele</option>
                  <option value="mireasa">Mireasa</option>
                  <option value="nasi">Nasii</option>
                  <option value="parintii_mire">Parintii mirelui</option>
                  <option value="parintii_mireasa">Parintii miresei</option>
                </select>
              </div>

              {/* Checkboxes row: Plus one | Loc pe scaun | Plus copil */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="plus_one" checked={form.plus_one}
                    onChange={(e) => setForm({ ...form, plus_one: e.target.checked, ...(!e.target.checked ? { partner_nume: "", partner_prenume: "" } : {}) })}
                    className="w-4 h-4 accent-accent" />
                  <label htmlFor="plus_one" className="text-sm text-foreground">Plus one</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="loc_pe_scaun" checked={form.loc_pe_scaun}
                    onChange={(e) => setForm({ ...form, loc_pe_scaun: e.target.checked })}
                    className="w-4 h-4 accent-accent" />
                  <label htmlFor="loc_pe_scaun" className="text-sm text-foreground">Loc pe scaun</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="has_children" checked={form.children.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, children: [{ nume: "", prenume: "" }] });
                      } else {
                        setForm({ ...form, children: [] });
                      }
                    }}
                    className="w-4 h-4 accent-accent" />
                  <label htmlFor="has_children" className="text-sm text-foreground">Plus copil</label>
                </div>
              </div>

              {/* Names: plus_one checked = both partners, unchecked = single + sex */}
              {form.plus_one ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Nume</label>
                      <input type="text" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Prenume</label>
                      <input type="text" value={form.prenume} onChange={(e) => setForm({ ...form, prenume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Nume partener</label>
                      <input type="text" value={form.partner_nume} onChange={(e) => setForm({ ...form, partner_nume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Prenume partener</label>
                      <input type="text" value={form.partner_prenume} onChange={(e) => setForm({ ...form, partner_prenume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Nume</label>
                      <input type="text" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Prenume</label>
                      <input type="text" value={form.prenume} onChange={(e) => setForm({ ...form, prenume: e.target.value })}
                        required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Sex</label>
                    <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as "" | "M" | "F" })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors appearance-none">
                      <option value="">Selecteaz&#259;</option>
                      <option value="M">Masculin</option>
                      <option value="F">Feminin</option>
                    </select>
                  </div>
                </>
              )}

              {/* Children inputs */}
              {form.children.length > 0 && (
                <div className="pl-6 border-l-2 border-accent/20 space-y-2">
                  {form.children.map((child, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div>
                        {idx === 0 && <label className="block text-xs text-text-muted mb-1">Nume copil</label>}
                        <input type="text" value={child.nume} placeholder="Nume"
                          onChange={(e) => {
                            const updated = [...form.children];
                            updated[idx] = { ...updated[idx], nume: e.target.value };
                            setForm({ ...form, children: updated });
                          }}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                      </div>
                      <div>
                        {idx === 0 && <label className="block text-xs text-text-muted mb-1">Prenume copil</label>}
                        <input type="text" value={child.prenume} placeholder="Prenume"
                          onChange={(e) => {
                            const updated = [...form.children];
                            updated[idx] = { ...updated[idx], prenume: e.target.value };
                            setForm({ ...form, children: updated });
                          }}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                      </div>
                      <div className={idx === 0 ? "mt-5" : ""}>
                        <button type="button" onClick={() => {
                          const updated = form.children.filter((_, i) => i !== idx);
                          setForm({ ...form, children: updated.length === 0 ? [] : updated });
                        }}
                          className="p-2 text-foreground/40 hover:text-red-500 transition-colors cursor-pointer">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, children: [...form.children, { nume: "", prenume: "" }] })}
                    className="flex items-center gap-1 text-xs text-button hover:text-button-hover transition-colors cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Adauga inca un copil
                  </button>
                </div>
              )}

              {/* Slug */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Slug (unic)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value });
                    if (saveError?.field === "slug") setSaveError(null);
                  }}
                  placeholder="ex: ion-maria"
                  className={`w-full rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-colors ${
                    saveError?.field === "slug"
                      ? "border-2 border-red-500 focus:border-red-600"
                      : "border border-gray-300 focus:border-accent"
                  }`}
                />
                {saveError?.field === "slug" && (
                  <p className="text-xs text-red-600 mt-1">Slug-ul trebuie sa fie unic pentru fiecare invitat.</p>
                )}
              </div>

              {/* Intro */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Intro scurt (card QR)</label>
                <textarea value={form.intro_short} onChange={(e) => { if (e.target.value.length <= 200) setForm({ ...form, intro_short: e.target.value }); }}
                  maxLength={200}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
                <p className="text-xs text-text-muted text-right mt-1">{form.intro_short.length}/200</p>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Intro lung (pagina invitatie)</label>
                <textarea value={form.intro_long} onChange={(e) => { if (e.target.value.length <= 400) setForm({ ...form, intro_long: e.target.value }); }}
                  maxLength={400}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
                <p className="text-xs text-text-muted text-right mt-1">{form.intro_long.length}/400</p>
              </div>

              {/* Cadou estimat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Cadou estimat min (RON)</label>
                  <input type="number" value={form.estimated_gift_min} onChange={(e) => setForm({ ...form, estimated_gift_min: e.target.value })}
                    placeholder="ex: 300"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Cadou estimat max (RON)</label>
                  <input type="number" value={form.estimated_gift_max} onChange={(e) => setForm({ ...form, estimated_gift_max: e.target.value })}
                    placeholder="ex: 500"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              </div>
              <div className="sticky bottom-0 p-5 pt-3 bg-white border-t border-border-light rounded-b-xl flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-button text-white py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
                  {saving ? "Se salveaza..." : "Salveaza"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                  Anuleaza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-xs flex flex-col">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="serif-font text-lg text-text-heading mb-2">Sterge invitatul</h3>
              <p className="text-sm text-text-muted mb-1">
                Esti sigur ca vrei sa stergi invitatul
              </p>
              <p className="text-sm font-medium text-text-heading">
                {deleteConfirm.prenume} {deleteConfirm.nume}?
              </p>
            </div>
            <div className="p-5 pt-0 flex gap-3 border-t border-border-light">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer mt-3">
                Anuleaza
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer mt-3">
                {deleting ? "Se sterge..." : "Sterge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation type picker modal */}
      {invitatiePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-xs max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3 text-center">
              <h3 className="serif-font text-lg text-text-heading mb-1">Alege tipul invitatiei</h3>
              <p className="text-xs text-text-muted">
                {invitatiePicker.prenume} {invitatiePicker.nume}
              </p>
            </div>
            <div className="px-5 overflow-y-auto flex-1">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { window.open(`/admin/card?guestId=${invitatiePicker.id}`, '_blank'); setInvitatiePicker(null); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-heading">Carte de vizita cu QR</p>
                  <p className="text-xs text-text-muted">Format carte de vizita cu cod QR</p>
                </div>
              </button>
              <button
                onClick={() => { window.open(`/admin/invitatie?guestId=${invitatiePicker.id}`, '_blank'); setInvitatiePicker(null); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-heading">Invitatie clasica V1</p>
                  <p className="text-xs text-text-muted">Text personalizat per invitat</p>
                </div>
              </button>
              <button
                onClick={() => { window.open(`/admin/invitatie-v2?guestId=${invitatiePicker.id}`, '_blank'); setInvitatiePicker(null); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-heading">Invitatie clasica V2</p>
                  <p className="text-xs text-text-muted">Parinti si nasi, text generic</p>
                </div>
              </button>
              {invitatiePicker.slug && (
                <>
                  <p className="text-xs text-text-muted mt-2 mb-1 px-1">Pagini publice</p>
                  <button
                    onClick={() => { window.open(`/invitatie/${invitatiePicker.slug}`, '_blank'); setInvitatiePicker(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-text-heading">Invitatie V1 publica</p>
                      <p className="text-xs text-text-muted">/invitatie/{invitatiePicker.slug}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { window.open(`/invitatie-v2/${invitatiePicker.slug}`, '_blank'); setInvitatiePicker(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-text-heading">Invitatie V2 publica</p>
                      <p className="text-xs text-text-muted">/invitatie-v2/{invitatiePicker.slug}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { window.open(`/card/${invitatiePicker.slug}`, '_blank'); setInvitatiePicker(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-text-heading">Card QR public</p>
                      <p className="text-xs text-text-muted">/card/{invitatiePicker.slug}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { window.open(`/${invitatiePicker.slug}`, '_blank'); setInvitatiePicker(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-background-soft transition-colors cursor-pointer text-left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button flex-shrink-0">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-text-heading">Pagina principala</p>
                      <p className="text-xs text-text-muted">/{invitatiePicker.slug}</p>
                    </div>
                  </button>
                </>
              )}
            </div>
            </div>
            <div className="p-5 pt-3 border-t border-border-light rounded-b-xl">
              <button onClick={() => setInvitatiePicker(null)}
                className="w-full py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Inchide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      <div className="family-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search || filter !== "all" ? "Niciun rezultat gasit." : "Niciun invitat adaugat."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border-light/50">
              {paginated.map((g) => {
                const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                return (
                  <div key={g.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-text-heading font-medium">{g.nume}</span>{" "}
                        <span className="text-foreground/70">{g.prenume}</span>
                        {g.slug && (
                          <p className="text-xs text-foreground/50 font-mono mt-0.5">{g.slug}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(g)}
                          className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                          title="Editeaza">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {g.slug && (
                          <button onClick={() => setInvitatiePicker(g)}
                            className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                            title="Invitatii">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </button>
                        )}
                        {g.slug && (
                          <button onClick={() => window.open(`/${g.slug}`, '_blank')}
                            className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                            title="Pagina invitatie">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </button>
                        )}
                        {g.slug && (
                          <button onClick={() => {
                            fetch(`${API_URL}/api/admin/invitation-logs/${g.id}`, { method: "DELETE", headers: authHeaders(token) }).catch(() => {});
                          }}
                            className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                            title="Reseteaza vizualizari">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm(g)}
                          className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                          title="Sterge">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {partner && (
                      <p className="text-xs text-foreground/60">
                        <span className="text-text-muted">+1:</span> {partner.nume} {partner.prenume}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {g.din_partea && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{DIN_PARTEA_LABELS[g.din_partea]}</span>
                      )}
                      {!g.loc_pe_scaun && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Doar dar</span>
                      )}
                      {g.children && g.children.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{g.children.length} {g.children.length === 1 ? "copil" : "copii"}</span>
                      )}
                      {(g.estimated_gift_min != null || g.estimated_gift_max != null) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                          {g.estimated_gift_min != null && g.estimated_gift_max != null
                            ? `~${Math.round((g.estimated_gift_min + g.estimated_gift_max) / 2)} RON`
                            : `${g.estimated_gift_min ?? g.estimated_gift_max} RON`}
                        </span>
                      )}
                    </div>
                    {(g.intro_short || g.intro_long) && (
                      <p className="text-xs text-foreground/50 line-clamp-2">{g.intro_short || g.intro_long}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-border-light bg-background-soft/50">
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide w-[45%]">Invitat</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide w-[12%]">Slug</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-medium tracking-wide w-[15%]">Cadou est.</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-medium tracking-wide w-[28%]">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((g) => {
                    const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                    return (
                      <tr key={g.id} className="border-b border-border-light/50 hover:bg-background-soft/30 transition-colors align-top">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-text-heading font-medium">{g.prenume} {g.nume}</span>
                              {g.din_partea && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{DIN_PARTEA_LABELS[g.din_partea]}</span>
                              )}
                              {!g.loc_pe_scaun && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Doar dar</span>
                              )}
                            </div>
                            {partner && (
                              <p className="text-foreground/60 text-xs">{partner.prenume} {partner.nume}</p>
                            )}
                            {g.children && g.children.length > 0 && g.children.map((c, ci) => (
                              <p key={ci} className="text-foreground/50 text-xs">{c.prenume} {c.nume} <span className="text-text-muted">(copil)</span></p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground/50 text-xs font-mono">{g.slug || "\u2014"}</td>
                        <td className="px-4 py-3 text-right text-foreground/70 whitespace-nowrap">
                          {g.estimated_gift_min != null && g.estimated_gift_max != null
                            ? `${Math.round((g.estimated_gift_min + g.estimated_gift_max) / 2)} RON`
                            : g.estimated_gift_min != null ? `${g.estimated_gift_min} RON`
                            : g.estimated_gift_max != null ? `${g.estimated_gift_max} RON`
                            : "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEdit(g)}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                              title="Editeaza">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {g.slug && (
                              <button onClick={() => setInvitatiePicker(g)}
                                className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                                title="Invitatii">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </button>
                            )}
                            {g.slug && (
                              <button onClick={() => window.open(`/${g.slug}`, '_blank')}
                                className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                                title="Pagina invitatie">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </button>
                            )}
                            {g.slug && (
                              <button onClick={() => {
                                fetch(`${API_URL}/api/admin/invitation-logs/${g.id}`, { method: "DELETE", headers: authHeaders(token) }).catch(() => {});
                              }}
                                className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                                title="Reseteaza vizualizari">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                            )}
                            <button onClick={() => setDeleteConfirm(g)}
                              className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                              title="Sterge">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <p className="text-xs text-text-muted">
          {filtered.length} din {mainGuests.length} invitati ({mainGuests.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0)} persoane)
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
