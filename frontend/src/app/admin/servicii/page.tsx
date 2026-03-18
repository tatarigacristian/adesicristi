"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders, Pagination, SearchInput, PAGE_SIZE } from "../_shared";

type ServiceType = "supplier" | "expense";

interface Service {
  id: number;
  nume: string;
  numar_persoane: number;
  pret: number;
  avans: number | null;
  pret_per_invitat: number | null;
  has_pret_per_invitat: boolean;
  contract_start: string | null;
  contract_end: string | null;
  loc_la_masa: boolean;
  link: string | null;
  contract_path: string | null;
  telefon: string | null;
  type: ServiceType;
  created_at: string;
}

function computeEndFromHours(start: string, hours: number): string {
  if (!start || !hours) return "";
  const [date, time] = start.split("T");
  if (!date || !time) return "";
  const [h, m] = time.split(":").map(Number);
  const startMs = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`).getTime();
  const endMs = startMs + hours * 60 * 60 * 1000;
  const endDate = new Date(endMs);
  const ed = endDate.toISOString().split("T")[0];
  const eh = String(endDate.getHours()).padStart(2, "0");
  const em = endDate.getMinutes() < 30 ? "00" : "30";
  return `${ed}T${eh}:${em}`;
}

function computeHoursFromDates(start: string, end: string): string {
  if (!start || !end) return "";
  const s = new Date(start.replace("T", " ")).getTime();
  const e = new Date(end.replace("T", " ")).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return "";
  return String(Math.round((e - s) / (60 * 60 * 1000)));
}

function formatPrice(val: number | string) {
  return Number(val).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatHours(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.round(ms / (1000 * 60 * 60));
  return `${hours}h`;
}

export default function ServiciiPage() {
  const { token, onUnauth } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [totalInvitati, setTotalInvitati] = useState(0);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({ type: "supplier" as ServiceType, nume: "", numar_persoane: "", pret: "", avans: "", pret_per_invitat: "", has_pret_per_invitat: false, contract_start: "", contract_end: "", numar_ore: "", loc_la_masa: false, link: "", telefon: "" });
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
    const [servicesRes, settingsRes, guestsRes] = await Promise.all([
      fetch(`${API_URL}/api/admin/services`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/api/wedding-settings`),
      fetch(`${API_URL}/api/admin/guests`, { headers: authHeaders(token) }),
    ]);
    if (servicesRes.status === 401) { onUnauth(); return; }
    setServices(await servicesRes.json());
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setWeddingDate(s.ceremonie_data || null);
    }
    if (guestsRes.ok) {
      const allGuests: { id: number; plus_one: boolean; partner_id: number | null }[] = await guestsRes.json();
      const partnerIds = new Set(allGuests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
      const mainGuests = allGuests.filter((g) => !partnerIds.has(g.id));
      setTotalInvitati(mainGuests.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0));
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

  const totalCost = useMemo(() => services.reduce((sum, s) => {
    if (s.has_pret_per_invitat && s.pret_per_invitat != null && totalInvitati > 0) {
      return sum + Number(s.pret_per_invitat) * totalInvitati;
    }
    return sum + Number(s.pret);
  }, 0), [services, totalInvitati]);
  const totalAvans = useMemo(() => services.reduce((sum, s) => sum + Number(s.avans || 0), 0), [services]);

  function openNew() {
    setEditService(null);
    setForm({ type: "supplier", nume: "", numar_persoane: "", pret: "", avans: "", pret_per_invitat: "", has_pret_per_invitat: false, contract_start: getDefaultStart(), contract_end: getDefaultEnd(), numar_ore: computeHoursFromDates(getDefaultStart(), getDefaultEnd()), loc_la_masa: false, link: "", telefon: "" });
    setContractFile(null);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditService(s);
    setForm({
      type: s.type || "supplier",
      nume: s.nume,
      numar_persoane: String(s.numar_persoane),
      pret: Boolean(s.has_pret_per_invitat) && s.pret_per_invitat != null && totalInvitati > 0
        ? String(Math.round(Number(s.pret_per_invitat) * totalInvitati))
        : String(Math.round(Number(s.pret))),
      avans: s.avans != null ? String(Math.round(Number(s.avans))) : "",
      pret_per_invitat: s.pret_per_invitat != null ? String(Math.round(Number(s.pret_per_invitat))) : "",
      has_pret_per_invitat: Boolean(s.has_pret_per_invitat),
      contract_start: s.contract_start ? s.contract_start.replace(" ", "T").slice(0, 16) : getDefaultStart(),
      contract_end: s.contract_end ? s.contract_end.replace(" ", "T").slice(0, 16) : getDefaultEnd(),
      numar_ore: computeHoursFromDates(
        s.contract_start ? s.contract_start.replace(" ", "T").slice(0, 16) : getDefaultStart(),
        s.contract_end ? s.contract_end.replace(" ", "T").slice(0, 16) : getDefaultEnd()
      ),
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
    fd.append("type", form.type);
    fd.append("nume", form.nume);
    fd.append("numar_persoane", form.type === "expense" ? "0" : form.numar_persoane);
    fd.append("pret", form.pret);
    fd.append("avans", form.type === "expense" ? "" : form.avans);
    fd.append("pret_per_invitat", form.type === "expense" ? "" : (form.has_pret_per_invitat ? form.pret_per_invitat : ""));
    fd.append("has_pret_per_invitat", form.type === "expense" ? "false" : String(form.has_pret_per_invitat));
    fd.append("contract_start", form.type === "expense" ? "" : form.contract_start);
    fd.append("contract_end", form.type === "expense" ? "" : form.contract_end);
    fd.append("loc_la_masa", form.type === "expense" ? "false" : String(form.loc_la_masa));
    fd.append("link", form.link);
    fd.append("telefon", form.type === "expense" ? "" : form.telefon);
    if (contractFile && form.type === "supplier") fd.append("contract", contractFile);
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
        <h2 className="serif-font text-2xl text-text-heading">Cheltuieli</h2>
        <button onClick={openNew}
          className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
          + Adauga cheltuiala
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3">
              <h3 className="serif-font text-lg text-text-heading mb-3">
                {editService ? "Editeaza cheltuiala" : "Cheltuiala noua"}
              </h3>
              <div className="flex rounded-lg border border-border-light overflow-hidden">
                <button type="button" onClick={() => setForm({ ...form, type: "supplier" })}
                  className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${form.type === "supplier" ? "bg-button text-white" : "bg-background-soft text-text-muted hover:text-text-heading"}`}>
                  Furnizor
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: "expense" })}
                  className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${form.type === "expense" ? "bg-button text-white" : "bg-background-soft text-text-muted hover:text-text-heading"}`}>
                  Cheltuiala
                </button>
              </div>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="px-5 overflow-y-auto flex-1 space-y-3">
              {/* Common: Nume */}
              <div>
                <label className="block text-xs text-text-muted mb-1">{form.type === "supplier" ? "Nume furnizor" : "Nume cheltuiala"}</label>
                <input type="text" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>

              {/* Supplier-only fields */}
              {form.type === "supplier" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Numar persoane</label>
                      <input type="number" value={form.numar_persoane} onChange={(e) => setForm({ ...form, numar_persoane: e.target.value })}
                        required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${form.has_pret_per_invitat ? "text-text-muted/40" : "text-text-muted"}`}>Pret fix (RON)</label>
                      <input type="number" value={form.pret}
                        onChange={(e) => setForm({ ...form, pret: e.target.value })}
                        required={!form.has_pret_per_invitat} disabled={form.has_pret_per_invitat}
                        min="0" step="1" className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors ${form.has_pret_per_invitat ? "opacity-40 cursor-not-allowed" : ""}`} />
                      {form.has_pret_per_invitat && form.pret && (
                        <p className="text-[10px] text-text-muted mt-0.5">{totalInvitati} invitati × {form.pret_per_invitat || 0} RON</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Avans (RON)</label>
                    <input type="number" value={form.avans} onChange={(e) => setForm({ ...form, avans: e.target.value })}
                      min="0" step="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="checkbox" id="has_pret_per_invitat" checked={form.has_pret_per_invitat}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setForm({ ...form, has_pret_per_invitat: true, pret: totalInvitati > 0 && form.pret_per_invitat ? String(Math.round(Number(form.pret_per_invitat) * totalInvitati)) : "" });
                          } else {
                            setForm({ ...form, has_pret_per_invitat: false, pret_per_invitat: "" });
                          }
                        }}
                        className="w-3.5 h-3.5 accent-accent cursor-pointer" />
                      <label htmlFor="has_pret_per_invitat" className="text-xs text-text-muted cursor-pointer">Pret per invitat (RON)</label>
                    </div>
                    {form.has_pret_per_invitat && (
                      <>
                        <input type="number" value={form.pret_per_invitat}
                          onChange={(e) => {
                            const ppi = e.target.value;
                            const computed = ppi && totalInvitati > 0 ? String(Math.round(Number(ppi) * totalInvitati)) : "";
                            setForm({ ...form, pret_per_invitat: ppi, pret: computed });
                          }}
                          required min="0" step="1" placeholder="ex: 200"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                        <p className="text-[10px] text-text-muted mt-0.5">{totalInvitati} invitati din baza de date</p>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Inceput contract</label>
                    <div className="grid grid-cols-[1fr_100px] gap-2">
                      <input type="date" value={form.contract_start.split("T")[0] || ""}
                        onChange={(e) => {
                          const time = form.contract_start.split("T")[1] || "15:00";
                          const newStart = `${e.target.value}T${time}`;
                          const newEnd = form.numar_ore && Number(form.numar_ore) > 0 ? computeEndFromHours(newStart, Number(form.numar_ore)) : form.contract_end;
                          setForm({ ...form, contract_start: newStart, contract_end: newEnd });
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                      <select value={form.contract_start.split("T")[1] || "15:00"}
                        onChange={(e) => {
                          const date = form.contract_start.split("T")[0] || "";
                          const newStart = `${date}T${e.target.value}`;
                          const newEnd = form.numar_ore && Number(form.numar_ore) > 0 ? computeEndFromHours(newStart, Number(form.numar_ore)) : form.contract_end;
                          setForm({ ...form, contract_start: newStart, contract_end: newEnd });
                        }}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors">
                        {Array.from({ length: 48 }, (_, i) => { const h = String(Math.floor(i / 2)).padStart(2, "0"); const m = i % 2 === 0 ? "00" : "30"; return `${h}:${m}`; }).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Numar ore</label>
                    <input type="number" value={form.numar_ore}
                      onChange={(e) => {
                        const ore = e.target.value;
                        const newEnd = ore && Number(ore) > 0 ? computeEndFromHours(form.contract_start, Number(ore)) : form.contract_end;
                        setForm({ ...form, numar_ore: ore, contract_end: newEnd });
                      }}
                      min="1" placeholder="ex: 8"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${form.numar_ore ? "text-text-muted/40" : "text-text-muted"}`}>Sfarsit contract</label>
                    <div className={`grid grid-cols-[1fr_100px] gap-2 ${form.numar_ore ? "opacity-40 pointer-events-none" : ""}`}>
                      <input type="date" value={form.contract_end.split("T")[0] || ""}
                        onChange={(e) => { const time = form.contract_end.split("T")[1] || "06:00"; setForm({ ...form, contract_end: `${e.target.value}T${time}` }); }}
                        disabled={!!form.numar_ore}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                      <select value={form.contract_end.split("T")[1] || "06:00"}
                        onChange={(e) => { const date = form.contract_end.split("T")[0] || ""; setForm({ ...form, contract_end: `${date}T${e.target.value}` }); }}
                        disabled={!!form.numar_ore}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors">
                        {Array.from({ length: 48 }, (_, i) => { const h = String(Math.floor(i / 2)).padStart(2, "0"); const m = i % 2 === 0 ? "00" : "30"; return `${h}:${m}`; }).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Telefon</label>
                    <input type="text" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                      placeholder="ex: 0722 123 456"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                </>
              )}

              {/* Expense-only: just Pret fix */}
              {form.type === "expense" && (
                <div>
                  <label className="block text-xs text-text-muted mb-1">Pret fix (RON)</label>
                  <input type="number" value={form.pret}
                    onChange={(e) => setForm({ ...form, pret: e.target.value })}
                    required min="0" step="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              )}

              {/* Common: Link */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Link</label>
                <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>

              {/* Supplier-only: loc la masa, contract */}
              {form.type === "supplier" && (
                <>
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
                </>
              )}
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
              <h3 className="serif-font text-lg text-text-heading mb-2">Sterge cheltuiala</h3>
              <p className="text-sm text-text-muted mb-1">
                Esti sigur ca vrei sa stergi cheltuiala
              </p>
              <p className="text-sm font-medium text-text-heading">
                {deleteConfirm.nume}?
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

      {/* Table (desktop) / Cards (mobile) */}
      <div className="family-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search ? "Niciun rezultat gasit." : "Nicio cheltuiala adaugata."}
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
                    <span className="text-foreground/60"><span className="text-text-muted">Pret:</span> {s.has_pret_per_invitat && s.pret_per_invitat != null && totalInvitati > 0 ? `${formatPrice(Number(s.pret_per_invitat) * totalInvitati)} RON (${formatPrice(s.pret_per_invitat)}/inv)` : `${formatPrice(s.pret)} RON`}</span>
                    {s.avans != null && s.avans > 0 && (
                      <span className="text-foreground/60"><span className="text-text-muted">Avans:</span> {formatPrice(s.avans)} RON</span>
                    )}
                    <span className="text-foreground/60"><span className="text-text-muted">Loc masa:</span> {s.loc_la_masa ? "Da" : "Nu"}</span>
                  </div>
                  {formatHours(s.contract_start, s.contract_end) && (
                    <p className="text-xs text-foreground/50">
                      {formatHours(s.contract_start, s.contract_end)}
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
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Cheltuiala</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Persoane</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Pret</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Avans</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Loc masa</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Ore</th>
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
                      <td className="px-4 py-3 text-foreground/70">
                        {s.has_pret_per_invitat && s.pret_per_invitat != null && totalInvitati > 0
                          ? <>{formatPrice(Number(s.pret_per_invitat) * totalInvitati)} RON <span className="text-[10px] text-purple-600">({formatPrice(s.pret_per_invitat)}/inv)</span></>
                          : <>{formatPrice(s.pret)} RON</>}
                      </td>
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
                      <td className="px-4 py-3 text-foreground/70">
                        {formatHours(s.contract_start, s.contract_end) || "\u2014"}
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
          {filtered.length} din {services.length} cheltuieli
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
