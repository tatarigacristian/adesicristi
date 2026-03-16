"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { fetchWeddingSettings, applyThemeColors } from "@/utils/settings";

function forceAdminTextColors() {
  const root = document.documentElement;
  root.style.setProperty("--color-text-heading", "#1a1a1a");
  root.style.setProperty("--color-foreground", "#333333");
  root.style.setProperty("--color-text-muted", "#666666");
  root.style.setProperty("--color-dark", "#000000");
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const PAGE_SIZE = 10;

interface RsvpEntry {
  id: number;
  person_count: number;
  name: string;
  partner_name: string | null;
  message: string | null;
  attending: boolean;
  created_at: string;
}

interface Guest {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  partner_id: number | null;
  created_at: string;
}

type View = "login" | "guests" | "confirmari" | "setari";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ─── Pagination ──────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1); // ellipsis
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-2.5 py-1.5 text-xs rounded-md border border-border-light text-text-muted
                   hover:bg-background-soft disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
      >
        &lsaquo;
      </button>
      {pages.map((p, i) =>
        p === -1 ? (
          <span key={`e${i}`} className="px-1.5 text-xs text-text-muted">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
              p === page
                ? "bg-button text-white border-button"
                : "border-border-light text-text-muted hover:bg-background-soft"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-2.5 py-1.5 text-xs rounded-md border border-border-light text-text-muted
                   hover:bg-background-soft disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
      >
        &rsaquo;
      </button>
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                   focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

// ─── Filter Button ───────────────────────────────────────

function FilterButton({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
        active
          ? "bg-button text-white border-button"
          : "border-border-light text-text-muted hover:border-accent/50 hover:text-text-heading"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 ${active ? "text-white/70" : "text-text-muted/60"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Login ───────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      const { token } = await res.json();
      sessionStorage.setItem("admin_token", token);
      onLogin(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-soft flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="script-font text-4xl text-text-heading mb-2">Ade & Cristi</h1>
          <p className="text-xs text-text-muted tracking-widest uppercase">Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="family-card space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-wide">Utilizator</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
              autoComplete="username" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-wide">Parola</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
              autoComplete="current-password" />
          </div>
          {error && <p className="text-xs text-accent-rose text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-button text-white py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Se conecteaza..." : "Intra in cont"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Guests Panel ────────────────────────────────────────

type GuestFilter = "all" | "plus_one" | "no_plus_one";

function GuestsPanel({ token, onUnauth }: { token: string; onUnauth: () => void }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Guest | null>(null);
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
    setForm({ nume: "", prenume: "", plus_one: false, intro_short: "", intro_long: "", slug: "", partner_nume: "", partner_prenume: "" });
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
    });
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editGuest ? "PUT" : "POST";
    const url = editGuest ? `${API_URL}/api/admin/guests/${editGuest.id}` : `${API_URL}/api/admin/guests`;
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
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
          + Adaugă invitat
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Caută după nume, prenume sau notițe..." />
        </div>
        <div className="flex items-center gap-2">
          <FilterButton label="Toți" active={filter === "all"} count={mainGuests.length} onClick={() => setFilter("all")} />
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
              {editGuest ? "Editează invitat" : "Invitat nou"}
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
                <label className="block text-xs text-text-muted mb-1">Intro lung (pagina invitație)</label>
                <textarea value={form.intro_long} onChange={(e) => { if (e.target.value.length <= 500) setForm({ ...form, intro_long: e.target.value }); }}
                  maxLength={500}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
                <p className="text-xs text-text-muted text-right mt-1">{form.intro_long.length}/500</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-button text-white py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
                  {saving ? "Se salvează..." : "Salvează"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                  Anulează
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
            <h3 className="serif-font text-lg text-text-heading mb-2">Șterge invitatul</h3>
            <p className="text-sm text-text-muted mb-1">
              Ești sigur că vrei să ștergi invitatul
            </p>
            <p className="text-sm font-medium text-text-heading mb-5">
              {deleteConfirm.prenume} {deleteConfirm.nume}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Anulează
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                {deleting ? "Se șterge..." : "Șterge"}
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
              {search || filter !== "all" ? "Niciun rezultat găsit." : "Niciun invitat adăugat."}
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
                            <button onClick={() => window.open(`/admin/card?guestId=${g.id}`, '_blank')}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                              title="Carte de vizita">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
                                <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" />
                                <rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" />
                              </svg>
                            </button>
                            <button onClick={() => window.open(`/admin/invitatie?guestId=${g.id}`, '_blank')}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                              title="Invitatie clasica">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </button>
                            <button onClick={() => window.open(`/admin/invitatie-v2?guestId=${g.id}`, '_blank')}
                              className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                              title="Invitatie clasica v2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <line x1="9" y1="14" x2="15" y2="14" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => openEdit(g)}
                          className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-1"
                          title="Editează">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(g)}
                          className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-1"
                          title="Șterge">
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
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Notițe</th>
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
                        <td className="px-4 py-3 text-foreground/50 text-xs font-mono">{g.slug || "—"}</td>
                        <td className="px-4 py-3">
                          {partner ? (
                            <span className="text-foreground/70">{partner.nume} {partner.prenume}</span>
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{g.intro_short || g.intro_long || "—"}</td>
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
                              <button onClick={() => window.open(`/admin/card?guestId=${g.id}`, '_blank')}
                                className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                                title="Carte de vizita">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                                  <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
                                  <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" />
                                  <rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" />
                                </svg>
                              </button>
                              <button onClick={() => window.open(`/admin/invitatie?guestId=${g.id}`, '_blank')}
                                className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                                title="Invitatie clasica">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </button>
                              <button onClick={() => window.open(`/admin/invitatie-v2?guestId=${g.id}`, '_blank')}
                                className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                                title="Invitatie clasica v2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="12" y1="11" x2="12" y2="17" />
                                  <line x1="9" y1="14" x2="15" y2="14" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button onClick={() => openEdit(g)}
                            className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                            title="Editează">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(g)}
                            className="text-xs text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer"
                            title="Șterge">
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

// ─── Confirmari Panel ────────────────────────────────────

type RsvpFilter = "all" | "attending" | "not_attending";

function ConfirmariPanel({ token, onUnauth }: { token: string; onUnauth: () => void }) {
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RsvpFilter>("all");
  const [page, setPage] = useState(1);

  async function fetchRsvps() {
    const res = await fetch(`${API_URL}/api/admin/rsvp`, { headers: authHeaders(token) });
    if (res.status === 401) { onUnauth(); return; }
    setRsvps(await res.json());
  }

  useEffect(() => { fetchRsvps(); }, []);

  const attending = rsvps.filter((r) => r.attending);
  const notAttending = rsvps.filter((r) => !r.attending);
  const totalGuests = attending.reduce((sum, r) => sum + r.person_count, 0);

  const filtered = useMemo(() => {
    let result = rsvps;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.partner_name && r.partner_name.toLowerCase().includes(q)) ||
          (r.message && r.message.toLowerCase().includes(q))
      );
    }

    if (filter === "attending") result = result.filter((r) => r.attending);
    if (filter === "not_attending") result = result.filter((r) => !r.attending);

    return result;
  }, [rsvps, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

  return (
    <div>
      <h2 className="serif-font text-2xl text-text-heading mb-6">Confirmări</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-text-heading">{totalGuests}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Invitati confirmati</p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-accent">{attending.length}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Participă</p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-accent-rose">{notAttending.length}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Nu participă</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Caută după nume, partener sau mesaj..." />
        </div>
        <div className="flex items-center gap-2">
          <FilterButton label="Toate" active={filter === "all"} count={rsvps.length} onClick={() => setFilter("all")} />
          <FilterButton label="Participă" active={filter === "attending"} count={attending.length} onClick={() => setFilter("attending")} />
          <FilterButton label="Nu participă" active={filter === "not_attending"} count={notAttending.length} onClick={() => setFilter("not_attending")} />
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="family-card p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border-light flex items-center justify-between">
          <h3 className="serif-font text-lg text-text-heading">Raspunsuri RSVP</h3>
          <button onClick={fetchRsvps}
            className="text-xs text-text-muted hover:text-text-heading transition-colors cursor-pointer">
            Reincarca
          </button>
        </div>
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search || filter !== "all" ? "Niciun rezultat găsit." : "Niciun răspuns încă."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border-light/50">
              {paginated.map((r) => (
                <div key={r.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-heading font-medium text-sm">{r.name}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    }`}>
                      {r.attending ? "Da" : "Nu"} ({r.person_count} pers.)
                    </span>
                  </div>
                  {r.partner_name && (
                    <p className="text-xs text-foreground/60">
                      <span className="text-text-muted">Partener:</span> {r.partner_name}
                    </p>
                  )}
                  {r.message && (
                    <p className="text-xs text-foreground/50 line-clamp-2">{r.message}</p>
                  )}
                  <p className="text-xs text-foreground/40">
                    {new Date(r.created_at).toLocaleDateString("ro-RO", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-background-soft/50">
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Nume</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Partener</th>
                    <th className="text-center px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Pers.</th>
                    <th className="text-center px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Mesaj</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="border-b border-border-light/50 hover:bg-background-soft/30 transition-colors">
                      <td className="px-4 py-3 text-text-heading font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-foreground/70">{r.partner_name || "—"}</td>
                      <td className="px-4 py-3 text-center">{r.person_count}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}>
                          {r.attending ? "Da" : "Nu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{r.message || "—"}</td>
                      <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("ro-RO", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
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
          {filtered.length} din {rsvps.length} raspunsuri
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Settings Panel ─────────────────────────────────────

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
  updated_at: string;
}

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

function SettingsPanel({ token, onUnauth }: { token: string; onUnauth: () => void }) {
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
        <p className="text-sm text-text-muted">Se încarcă setările...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-6">
        <h2 className="serif-font text-2xl text-text-heading">Setări eveniment</h2>
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
        <SettingsSection title="Nașii">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume nașă" value={form.nasa_prenume} onChange={updateForm("nasa_prenume")} placeholder="Prenume" />
            <SettingsInput label="Nume nașă" value={form.nasa_nume} onChange={updateForm("nasa_nume")} placeholder="Nume" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume naș" value={form.nas_prenume} onChange={updateForm("nas_prenume")} placeholder="Prenume" />
            <SettingsInput label="Nume naș" value={form.nas_nume} onChange={updateForm("nas_nume")} placeholder="Nume" />
          </div>
        </SettingsSection>

        {/* Ceremonie */}
        <SettingsSection title="Cununia Religioasă">
          <SettingsInput label="Descriere / Titlu" value={form.ceremonie_descriere} onChange={updateForm("ceremonie_descriere")} placeholder="Cununia Religioasă" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.ceremonie_data} onChange={updateForm("ceremonie_data")} type="date" />
            <SettingsInput label="Ora" value={form.ceremonie_ora} onChange={updateForm("ceremonie_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.ceremonie_adresa} onChange={updateForm("ceremonie_adresa")} placeholder="Adresa locației" />
          <SettingsInput label="Link Google Maps" value={form.ceremonie_google_maps} onChange={updateForm("ceremonie_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Transport */}
        <SettingsSection title="Transport">
          <SettingsInput label="Descriere / Titlu" value={form.transport_descriere} onChange={updateForm("transport_descriere")} placeholder="Transport" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.transport_data} onChange={updateForm("transport_data")} type="date" />
            <SettingsInput label="Ora" value={form.transport_ora} onChange={updateForm("transport_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.transport_adresa} onChange={updateForm("transport_adresa")} placeholder="Adresa locației" />
          <SettingsInput label="Link Google Maps" value={form.transport_google_maps} onChange={updateForm("transport_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Petrecere */}
        <SettingsSection title="Petrecerea">
          <SettingsInput label="Descriere / Titlu" value={form.petrecere_descriere} onChange={updateForm("petrecere_descriere")} placeholder="Petrecerea" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Data" value={form.petrecere_data} onChange={updateForm("petrecere_data")} type="date" />
            <SettingsInput label="Ora" value={form.petrecere_ora} onChange={updateForm("petrecere_ora")} type="time" />
          </div>
          <SettingsInput label="Adresa" value={form.petrecere_adresa} onChange={updateForm("petrecere_adresa")} placeholder="Adresa locației" />
          <SettingsInput label="Link Google Maps" value={form.petrecere_google_maps} onChange={updateForm("petrecere_google_maps")} placeholder="https://maps.app.goo.gl/..." />
        </SettingsSection>

        {/* Parinti mireasa */}
        <SettingsSection title="Părinții miresei">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume tată" value={form.tata_mireasa_prenume} onChange={updateForm("tata_mireasa_prenume")} placeholder="Vasile" />
            <SettingsInput label="Nume tată" value={form.tata_mireasa_nume} onChange={updateForm("tata_mireasa_nume")} placeholder="Pop" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume mamă" value={form.mama_mireasa_prenume} onChange={updateForm("mama_mireasa_prenume")} placeholder="Veronica" />
            <SettingsInput label="Nume mamă" value={form.mama_mireasa_nume} onChange={updateForm("mama_mireasa_nume")} placeholder="Pop" />
          </div>
        </SettingsSection>

        {/* Parinti mire */}
        <SettingsSection title="Părinții mirelui">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume tată" value={form.tata_mire_prenume} onChange={updateForm("tata_mire_prenume")} placeholder="Alexandru" />
            <SettingsInput label="Nume tată" value={form.tata_mire_nume} onChange={updateForm("tata_mire_nume")} placeholder="Budai" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsInput label="Prenume mamă" value={form.mama_mire_prenume} onChange={updateForm("mama_mire_prenume")} placeholder="Marieta" />
            <SettingsInput label="Nume mamă" value={form.mama_mire_nume} onChange={updateForm("mama_mire_nume")} placeholder="Budai" />
          </div>
        </SettingsSection>

        {/* Confirmare */}
        <SettingsSection title="Confirmare invitație">
          <SettingsInput label="Confirmare până la" value={form.confirmare_pana_la} onChange={updateForm("confirmare_pana_la")} type="date" />
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-wide">Info contact (pentru invitație)</label>
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
            {saving ? "Se salvează..." : "Salvează setările"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Salvat cu succes!</span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Sidebar Nav Items ───────────────────────────────────

const NAV_ITEMS: { key: Exclude<View, "login">; label: string; icon: React.ReactNode }[] = [
  {
    key: "guests",
    label: "Invitați",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "confirmari",
    label: "Confirmări",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    key: "setari",
    label: "Setări",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ─── Main Admin Page ─────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [view, setView] = useState<View>("login");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setView("guests");
    }
    fetchWeddingSettings().then((s) => {
      applyThemeColors(s);
      forceAdminTextColors();
    });
  }, []);

  function handleLogin(jwt: string) {
    setToken(jwt);
    setView("guests");
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setView("login");
  }

  function handleUnauth() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setView("login");
  }

  if (view === "login") {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background-soft flex">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border-light px-4 py-3 flex items-center justify-between z-30 md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-text-heading cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="script-font text-xl text-text-heading">Ade & Cristi</span>
        <button onClick={handleLogout} className="text-xs text-text-muted cursor-pointer">Iesire</button>
      </div>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-background border-r border-border-light z-50
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:sticky md:top-0 md:h-screen md:z-auto`}>
        <div className="px-6 py-6 border-b border-border-light">
          <h1 className="script-font text-2xl text-text-heading">Ade & Cristi</h1>
          <p className="text-[0.6rem] tracking-widest uppercase text-text-muted mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setView(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors cursor-pointer
                ${view === item.key
                  ? "bg-background-soft text-text-heading font-medium"
                  : "text-text-muted hover:text-text-heading hover:bg-background-soft/50"
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border-light">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-heading hover:bg-background-soft/50 transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Deconectare
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {view === "guests" && <GuestsPanel token={token} onUnauth={handleUnauth} />}
          {view === "confirmari" && <ConfirmariPanel token={token} onUnauth={handleUnauth} />}

          {view === "setari" && <SettingsPanel token={token} onUnauth={handleUnauth} />}
        </div>
      </main>
    </div>
  );
}
