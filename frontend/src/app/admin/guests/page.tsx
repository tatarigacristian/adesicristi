"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, PAGE_SIZE, Guest, authHeaders, Pagination, SearchInput, FilterButton } from "../_shared";

type GuestFilter = "all" | "plus_one" | "no_plus_one";

export default function GuestsPage() {
  const { token, onUnauth } = useAdminAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "", sex: "" as "" | "M" | "F" });
  const [saving, setSaving] = useState(false);
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
    setForm({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "", sex: "" });
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
    });
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editGuest ? "PUT" : "POST";
    const url = editGuest ? `${API_URL}/api/admin/guests/${editGuest.id}` : `${API_URL}/api/admin/guests`;
    const payload = { ...form, sex: form.sex || null };
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif-font text-lg text-text-heading mb-4">
              {editGuest ? "Editeaza invitat" : "Invitat nou"}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
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
              <div>
                <label className="block text-xs text-text-muted mb-1">Slug (unic)</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ex: ion-maria"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="plus_one" checked={form.plus_one}
                  onChange={(e) => setForm({ ...form, plus_one: e.target.checked, ...(!e.target.checked ? { partner_nume: "", partner_prenume: "" } : {}) })}
                  className="w-4 h-4 accent-accent" />
                <label htmlFor="plus_one" className="text-sm text-foreground">Plus one</label>
              </div>
              {!!form.plus_one && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-accent/20">
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
              )}
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
              <div className="flex gap-3 pt-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
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
            <p className="text-sm font-medium text-text-heading mb-5">
              {deleteConfirm.prenume} {deleteConfirm.nume}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Anuleaza
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                {deleting ? "Se sterge..." : "Sterge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation type picker modal */}
      {invitatiePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setInvitatiePicker(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif-font text-lg text-text-heading mb-1 text-center">Alege tipul invitatiei</h3>
            <p className="text-xs text-text-muted text-center mb-5">
              {invitatiePicker.prenume} {invitatiePicker.nume}
            </p>
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
            </div>
            <button onClick={() => setInvitatiePicker(null)}
              className="w-full mt-4 py-2 text-xs text-text-muted hover:text-text-heading transition-colors cursor-pointer">
              Inchide
            </button>
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
                      <div className="flex items-center gap-2">
                        {g.slug && (
                          <>
                            <button onClick={() => window.open(`/${g.slug}`, '_blank')}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                              title="Pagina invitatie">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </button>
                            <button onClick={() => setInvitatiePicker(g)}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                              title="Invitatii">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => openEdit(g)}
                          className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                          title="Editeaza">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(g)}
                          className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-1"
                          title="Sterge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    {(g.intro_short || g.intro_long) && (
                      <p className="text-xs text-foreground/50 line-clamp-2">{g.intro_short || g.intro_long}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-background-soft/50">
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Invitat</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Slug</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Partener (+1)</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Notite</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((g) => {
                    const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                    return (
                      <tr key={g.id} className="border-b border-border-light/50 hover:bg-background-soft/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-text-heading font-medium">{g.nume}</span>{" "}
                          <span className="text-foreground/70">{g.prenume}</span>
                        </td>
                        <td className="px-4 py-3 text-foreground/50 text-xs font-mono">{g.slug || "\u2014"}</td>
                        <td className="px-4 py-3">
                          {partner ? (
                            <span className="text-foreground/70">{partner.nume} {partner.prenume}</span>
                          ) : (
                            <span className="text-foreground/30">\u2014</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{g.intro_short || g.intro_long || "\u2014"}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {g.slug && (
                            <>
                              <button onClick={() => window.open(`/${g.slug}`, '_blank')}
                                className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                                title="Pagina invitatie">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </button>
                              <button onClick={() => setInvitatiePicker(g)}
                                className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                                title="Invitatii">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button onClick={() => openEdit(g)}
                            className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                            title="Editeaza">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(g)}
                            className="text-xs text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer"
                            title="Sterge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
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
          {filtered.length} din {mainGuests.length} invitati
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
