"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders, Pagination, SearchInput, PAGE_SIZE } from "../_shared";

interface Service {
  id: number;
  nume: string;
  numar_persoane: number;
  pret: number;
  avans: number | null;
  contract_start: string | null;
  contract_end: string | null;
  loc_la_masa: boolean;
  link: string | null;
  contract_path: string | null;
  telefon: string | null;
  created_at: string;
}

function formatPrice(val: number | string) {
  return Number(val).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateTime(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ServiciiPage() {
  const { token, onUnauth } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({ nume: "", numar_persoane: "", pret: "", avans: "", contract_start: "", contract_end: "", loc_la_masa: false, link: "", telefon: "" });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Default datetime values from wedding date
  function getDefaultStart() {
    if (!weddingDate) return "";
    const d = weddingDate.split("T")[0];
    return `${d}T15:00`;
  }
  function getDefaultEnd() {
    if (!weddingDate) return "";
    const d = new Date(weddingDate.split("T")[0]);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0];
    return `${next}T06:00`;
  }

  async function fetchServices() {
    const [servicesRes, settingsRes] = await Promise.all([
      fetch(`${API_URL}/api/admin/services`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/api/wedding-settings`),
    ]);
    if (servicesRes.status === 401) { onUnauth(); return; }
    setServices(await servicesRes.json());
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setWeddingDate(s.ceremonie_data || null);
    }
  }

  useEffect(() => { fetchServices(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter((s) =>
      s.nume.toLowerCase().includes(q) ||
      (s.telefon && s.telefon.toLowerCase().includes(q))
    );
  }, [services, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const totalCost = useMemo(() => services.reduce((sum, s) => sum + Number(s.pret), 0), [services]);
  const totalAvans = useMemo(() => services.reduce((sum, s) => sum + Number(s.avans || 0), 0), [services]);

  function openNew() {
    setEditService(null);
    setForm({ nume: "", numar_persoane: "", pret: "", avans: "", contract_start: getDefaultStart(), contract_end: getDefaultEnd(), loc_la_masa: false, link: "", telefon: "" });
    setContractFile(null);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditService(s);
    setForm({
      nume: s.nume,
      numar_persoane: String(s.numar_persoane),
      pret: String(s.pret),
      avans: s.avans != null ? String(s.avans) : "",
      contract_start: s.contract_start ? s.contract_start.slice(0, 16) : getDefaultStart(),
      contract_end: s.contract_end ? s.contract_end.slice(0, 16) : getDefaultEnd(),
      loc_la_masa: s.loc_la_masa,
      link: s.link || "",
      telefon: s.telefon || "",
    });
    setContractFile(null);
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editService ? "PUT" : "POST";
    const url = editService
      ? `${API_URL}/api/admin/services/${editService.id}`
      : `${API_URL}/api/admin/services`;
    const fd = new FormData();
    fd.append("nume", form.nume);
    fd.append("numar_persoane", form.numar_persoane);
    fd.append("pret", form.pret);
    fd.append("avans", form.avans);
    fd.append("contract_start", form.contract_start);
    fd.append("contract_end", form.contract_end);
    fd.append("loc_la_masa", String(form.loc_la_masa));
    fd.append("link", form.link);
    fd.append("telefon", form.telefon);
    if (contractFile) fd.append("contract", contractFile);
    await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
    setSaving(false);
    setShowForm(false);
    fetchServices();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await fetch(`${API_URL}/api/admin/services/${deleteConfirm.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(false);
    setDeleteConfirm(null);
    fetchServices();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-font text-2xl text-text-heading">Servicii</h2>
        <button onClick={openNew}
          className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
          + Adauga serviciu
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="family-card px-4 py-3">
          <p className="text-xs text-text-muted mb-1">Cost total</p>
          <p className="text-lg font-medium text-text-heading">{formatPrice(totalCost)} <span className="text-sm text-text-muted font-normal">RON</span></p>
        </div>
        <div className="family-card px-4 py-3">
          <p className="text-xs text-text-muted mb-1">Avans total</p>
          <p className="text-lg font-medium text-text-heading">{formatPrice(totalAvans)} <span className="text-sm text-text-muted font-normal">RON</span></p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Cauta dupa nume, telefon sau perioada..." />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif-font text-lg text-text-heading mb-4">
              {editService ? "Editeaza serviciu" : "Serviciu nou"}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Nume serviciu</label>
                <input type="text" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Numar persoane</label>
                  <input type="number" value={form.numar_persoane} onChange={(e) => setForm({ ...form, numar_persoane: e.target.value })}
                    required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Pret (RON)</label>
                  <input type="number" value={form.pret} onChange={(e) => setForm({ ...form, pret: e.target.value })}
                    required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Avans (RON)</label>
                <input type="number" value={form.avans} onChange={(e) => setForm({ ...form, avans: e.target.value })}
                  min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Inceput contract</label>
                  <input type="datetime-local" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Sfarsit contract</label>
                  <input type="datetime-local" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Telefon</label>
                <input type="text" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  placeholder="ex: 0722 123 456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Link</label>
                <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="loc_la_masa" checked={form.loc_la_masa}
                  onChange={(e) => setForm({ ...form, loc_la_masa: e.target.checked })}
                  className="w-4 h-4 accent-accent" />
                <label htmlFor="loc_la_masa" className="text-sm text-foreground">Loc la masa</label>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Contract (PDF)</label>
                <input type="file" accept=".pdf"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:bg-white file:text-foreground file:cursor-pointer hover:file:bg-background-soft" />
                {editService?.contract_path && !contractFile && (
                  <p className="text-xs text-text-muted mt-1">Contract existent incarcat. Selecteaza un fisier nou pentru a-l inlocui.</p>
                )}
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
            <h3 className="serif-font text-lg text-text-heading mb-2">Sterge serviciul</h3>
            <p className="text-sm text-text-muted mb-1">
              Esti sigur ca vrei sa stergi serviciul
            </p>
            <p className="text-sm font-medium text-text-heading mb-5">
              {deleteConfirm.nume}?
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

      {/* Table (desktop) / Cards (mobile) */}
      <div className="family-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search ? "Niciun rezultat gasit." : "Niciun serviciu adaugat."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border-light/50">
              {paginated.map((s) => (
                <div key={s.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-text-heading font-medium">{s.nume}</span>
                      {s.telefon && (
                        <p className="text-xs text-foreground/50 mt-0.5">{s.telefon}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)}
                        className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                        title="Editeaza">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {s.contract_path && (
                        <button onClick={() => window.open(`${API_URL}/api/admin/services/${s.id}/contract`, '_blank')}
                          className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                          title="Descarca contract">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="12" x2="12" y2="18" />
                            <polyline points="9 15 12 18 15 15" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm(s)}
                        className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-background-soft/50"
                        title="Sterge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-foreground/60"><span className="text-text-muted">Persoane:</span> {s.numar_persoane}</span>
                    <span className="text-foreground/60"><span className="text-text-muted">Pret:</span> {formatPrice(s.pret)} RON</span>
                    {s.avans != null && s.avans > 0 && (
                      <span className="text-foreground/60"><span className="text-text-muted">Avans:</span> {formatPrice(s.avans)} RON</span>
                    )}
                    <span className="text-foreground/60"><span className="text-text-muted">Loc masa:</span> {s.loc_la_masa ? "Da" : "Nu"}</span>
                  </div>
                  {(s.contract_start || s.contract_end) && (
                    <p className="text-xs text-foreground/50">
                      {formatDateTime(s.contract_start)} — {formatDateTime(s.contract_end)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-background-soft/50">
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Serviciu</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Persoane</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Pret</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Avans</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Loc masa</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Perioada</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s.id} className="border-b border-border-light/50 hover:bg-background-soft/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-text-heading font-medium">{s.nume}</span>
                        {s.telefon && (
                          <p className="text-xs text-foreground/50 mt-0.5">{s.telefon}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/70">{s.numar_persoane}</td>
                      <td className="px-4 py-3 text-foreground/70">{formatPrice(s.pret)} RON</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {s.avans != null && s.avans > 0 ? `${formatPrice(s.avans)} RON` : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        {s.loc_la_masa ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Da</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-foreground/40">Nu</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/70">
                        {s.contract_start || s.contract_end
                          ? <>{formatDateTime(s.contract_start) || "\u2014"} — {formatDateTime(s.contract_end) || "\u2014"}</>
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => openEdit(s)}
                            className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                            title="Editeaza">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {s.contract_path && (
                            <button onClick={() => window.open(`${API_URL}/api/admin/services/${s.id}/contract`, '_blank')}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50 inline-flex items-center justify-center"
                              title="Descarca contract">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="12" x2="12" y2="18" />
                                <polyline points="9 15 12 18 15 15" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirm(s)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <p className="text-xs text-text-muted">
          {filtered.length} din {services.length} servicii
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
