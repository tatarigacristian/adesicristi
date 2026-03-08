"use client";

import { useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
  intro: string | null;
  slug: string | null;
  partner_id: number | null;
  created_at: string;
}

type View = "login" | "guests" | "confirmari";

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
                ? "bg-accent text-white border-accent"
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
        className="w-full pl-9 pr-3 py-2 border border-border-light rounded-lg text-sm bg-white
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
          ? "bg-accent text-white border-accent"
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
              className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
              autoComplete="username" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-wide">Parola</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
              autoComplete="current-password" />
          </div>
          {error && <p className="text-xs text-accent-rose text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer">
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
  const [form, setForm] = useState({ nume: "", prenume: "", plus_one: false, intro: "", slug: "", partner_nume: "", partner_prenume: "" });
  const [saving, setSaving] = useState(false);
  const [qrData, setQrData] = useState<{ slug: string; dataUrl: string } | null>(null);
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
          (g.intro && g.intro.toLowerCase().includes(q)) ||
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
    setForm({ nume: "", prenume: "", plus_one: false, intro: "", slug: "", partner_nume: "", partner_prenume: "" });
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
      intro: g.intro || "",
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

  async function handleDelete(id: number) {
    if (!confirm("Esti sigur ca vrei sa stergi acest invitat?")) return;
    await fetch(`${API_URL}/api/admin/guests/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchGuests();
  }

  const handleGenerateQR = useCallback(async (slug: string) => {
    const url = `${SITE_URL}/${slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#2c2c2c", light: "#ffffff" },
    });
    setQrData({ slug, dataUrl });
  }, []);

  function handleDownloadQR() {
    if (!qrData) return;
    const link = document.createElement("a");
    link.download = `qr-${qrData.slug}.png`;
    link.href = qrData.dataUrl;
    link.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif-font text-2xl text-text-heading">Invitati</h2>
        <button onClick={openNew}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-light transition-colors cursor-pointer">
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
                    required className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Prenume</label>
                  <input type="text" value={form.prenume} onChange={(e) => setForm({ ...form, prenume: e.target.value })}
                    required className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Slug (unic)</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ex: ion-maria"
                  className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="plus_one" checked={form.plus_one}
                  onChange={(e) => setForm({ ...form, plus_one: e.target.checked, ...(!e.target.checked ? { partner_nume: "", partner_prenume: "" } : {}) })}
                  className="w-4 h-4 accent-accent" />
                <label htmlFor="plus_one" className="text-sm text-foreground">Plus one</label>
              </div>
              {form.plus_one && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-accent/20">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Nume partener</label>
                    <input type="text" value={form.partner_nume} onChange={(e) => setForm({ ...form, partner_nume: e.target.value })}
                      required className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Prenume partener</label>
                    <input type="text" value={form.partner_prenume} onChange={(e) => setForm({ ...form, partner_prenume: e.target.value })}
                      required className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-text-muted mb-1">Introducere / Notite</label>
                <textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })}
                  rows={3} className="w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer">
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

      {/* QR Modal */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setQrData(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif-font text-lg text-text-heading mb-1">Cod QR</h3>
            <p className="text-xs text-text-muted mb-4 font-mono">{SITE_URL}/{qrData.slug}</p>
            <img src={qrData.dataUrl} alt={`QR code for ${qrData.slug}`} className="w-48 h-48 mx-auto mb-4" />
            <div className="flex gap-3">
              <button onClick={handleDownloadQR}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent-light transition-colors cursor-pointer">
                Descarca PNG
              </button>
              <button onClick={() => setQrData(null)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Inchide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="family-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search || filter !== "all" ? "Niciun rezultat gasit." : "Niciun invitat adaugat."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <td className="px-4 py-3 text-foreground/50 text-xs font-mono">{g.slug || "—"}</td>
                      <td className="px-4 py-3">
                        {partner ? (
                          <span className="text-foreground/70">{partner.nume} {partner.prenume}</span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{g.intro || "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {g.slug && (
                          <button onClick={() => handleGenerateQR(g.slug!)}
                            className="text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer mr-3"
                            title="Genereaza QR">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                              <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
                              <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" />
                              <rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" />
                            </svg>
                          </button>
                        )}
                        <button onClick={() => openEdit(g)}
                          className="text-xs text-accent hover:text-accent-light transition-colors cursor-pointer mr-3">
                          Editeaza
                        </button>
                        <button onClick={() => handleDelete(g.id)}
                          className="text-xs text-accent-rose hover:text-accent-rose-light transition-colors cursor-pointer">
                          Sterge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between mt-4">
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
      <h2 className="serif-font text-2xl text-text-heading mb-6">Confirmari</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-text-heading">{totalGuests}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Invitati confirmati</p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-accent">{attending.length}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Participa</p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl serif-font text-accent-rose">{notAttending.length}</p>
          <p className="text-xs text-text-muted mt-1 tracking-wide">Nu participa</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Cauta dupa nume, partener sau mesaj..." />
        </div>
        <div className="flex items-center gap-2">
          <FilterButton label="Toate" active={filter === "all"} count={rsvps.length} onClick={() => setFilter("all")} />
          <FilterButton label="Participa" active={filter === "attending"} count={attending.length} onClick={() => setFilter("attending")} />
          <FilterButton label="Nu participa" active={filter === "not_attending"} count={notAttending.length} onClick={() => setFilter("not_attending")} />
        </div>
      </div>

      {/* Table */}
      <div className="family-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <h3 className="serif-font text-lg text-text-heading">Raspunsuri RSVP</h3>
          <button onClick={fetchRsvps}
            className="text-xs text-text-muted hover:text-text-heading transition-colors cursor-pointer">
            Reincarca
          </button>
        </div>
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search || filter !== "all" ? "Niciun rezultat gasit." : "Niciun raspuns inca."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-text-muted">
          {filtered.length} din {rsvps.length} raspunsuri
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Sidebar Nav Items ───────────────────────────────────

const NAV_ITEMS: { key: Exclude<View, "login">; label: string; icon: JSX.Element }[] = [
  {
    key: "guests",
    label: "Invitati",
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
    label: "Confirmari",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
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
        </div>
      </main>
    </div>
  );
}
