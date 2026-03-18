"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, PAGE_SIZE, RsvpEntry, authHeaders, Pagination, SearchInput } from "../_shared";

type RsvpFilter = "all" | "attending" | "not_attending";
type BoolFilter = "all" | "yes" | "no";

export default function ConfirmariPage() {
  const { token, onUnauth } = useAdminAuth();
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RsvpFilter>("all");
  const [vegetarianFilter, setVegetarianFilter] = useState<BoolFilter>("all");
  const [childrenMenuFilter, setChildrenMenuFilter] = useState<BoolFilter>("all");
  const [transportFilter, setTransportFilter] = useState<BoolFilter>("all");
  const [page, setPage] = useState(1);
  const [viewEntry, setViewEntry] = useState<RsvpEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RsvpEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await fetch(`${API_URL}/api/admin/rsvp/${deleteConfirm.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(false);
    setDeleteConfirm(null);
    setViewEntry(null);
    fetchRsvps();
  }

  async function fetchRsvps() {
    const res = await fetch(`${API_URL}/api/admin/rsvp`, { headers: authHeaders(token) });
    if (res.status === 401) { onUnauth(); return; }
    const data = await res.json();
    setRsvps(data.map((r: Record<string, unknown>) => ({
      ...r,
      needs_transport: Boolean(r.needs_transport),
      vegetarian_menu: Boolean(r.vegetarian_menu),
      children_menu: Boolean(r.children_menu),
    })));
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

    if (vegetarianFilter === "yes") result = result.filter((r) => r.vegetarian_menu);
    if (vegetarianFilter === "no") result = result.filter((r) => !r.vegetarian_menu);

    if (childrenMenuFilter === "yes") result = result.filter((r) => r.children_menu);
    if (childrenMenuFilter === "no") result = result.filter((r) => !r.children_menu);

    if (transportFilter === "yes") result = result.filter((r) => r.needs_transport);
    if (transportFilter === "no") result = result.filter((r) => !r.needs_transport);

    return result;
  }, [rsvps, search, filter, vegetarianFilter, childrenMenuFilter, transportFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter, vegetarianFilter, childrenMenuFilter, transportFilter]);

  function resetFilters() {
    setSearch("");
    setFilter("all");
    setVegetarianFilter("all");
    setChildrenMenuFilter("all");
    setTransportFilter("all");
    setPage(1);
  }

  return (
    <div>
      <h2 className="serif-font text-2xl text-text-heading mb-6">Confirmari</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
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
      <div className="flex flex-col gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Cauta dupa nume, partener sau mesaj..." />
        <div className="flex flex-wrap items-center gap-1">
          {/* Status */}
          {([
            { value: "all" as const, label: "Toti" },
            { value: "attending" as const, label: "Da" },
            { value: "not_attending" as const, label: "Nu" },
          ]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => setFilter(opt.value)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                filter === opt.value ? "bg-button text-white" : "bg-background-soft text-text-muted hover:text-text-heading"
              }`}>
              {opt.label}
            </button>
          ))}
          <span className="w-px h-4 bg-border-light mx-0.5" />
          {/* Vegetarian */}
          {([
            { value: "all" as const, label: "Veg." },
            { value: "yes" as const, label: "Da" },
            { value: "no" as const, label: "Nu" },
          ]).map((opt) => (
            <button key={`veg-${opt.value}`} type="button" onClick={() => setVegetarianFilter(opt.value)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                vegetarianFilter === opt.value ? "bg-green-600 text-white" : "bg-background-soft text-text-muted hover:text-text-heading"
              }`}>
              {opt.label}
            </button>
          ))}
          <span className="w-px h-4 bg-border-light mx-0.5" />
          {/* Copil */}
          {([
            { value: "all" as const, label: "Copil" },
            { value: "yes" as const, label: "Da" },
            { value: "no" as const, label: "Nu" },
          ]).map((opt) => (
            <button key={`child-${opt.value}`} type="button" onClick={() => setChildrenMenuFilter(opt.value)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                childrenMenuFilter === opt.value ? "bg-purple-600 text-white" : "bg-background-soft text-text-muted hover:text-text-heading"
              }`}>
              {opt.label}
            </button>
          ))}
          <span className="w-px h-4 bg-border-light mx-0.5" />
          {/* Transport */}
          {([
            { value: "all" as const, label: "Transp." },
            { value: "yes" as const, label: "Da" },
            { value: "no" as const, label: "Nu" },
          ]).map((opt) => (
            <button key={`tr-${opt.value}`} type="button" onClick={() => setTransportFilter(opt.value)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                transportFilter === opt.value ? "bg-blue-600 text-white" : "bg-background-soft text-text-muted hover:text-text-heading"
              }`}>
              {opt.label}
            </button>
          ))}
          {(filter !== "all" || vegetarianFilter !== "all" || childrenMenuFilter !== "all" || transportFilter !== "all") && (
            <>
              <span className="w-px h-4 bg-border-light mx-0.5" />
              <button type="button" onClick={resetFilters}
                className="px-2 py-1 rounded-full text-[10px] text-text-muted hover:text-text-heading bg-background-soft hover:bg-border-light transition-colors cursor-pointer">
                Reset
              </button>
            </>
          )}
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
              {search || filter !== "all" ? "Niciun rezultat gasit." : "Niciun raspuns inca."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border-light/50">
              {paginated.map((r) => (
                <div key={r.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-heading font-medium text-sm">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                      }`}>
                        {r.attending ? "Da" : "Nu"} ({r.person_count} pers.)
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewEntry(r)}
                        className="p-2 rounded-lg text-foreground/50 hover:text-accent hover:bg-background-soft/50 transition-colors cursor-pointer"
                        title="Vezi detalii"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(r)}
                        className="p-2 rounded-lg text-foreground/50 hover:text-accent-rose hover:bg-background-soft/50 transition-colors cursor-pointer"
                        title="Sterge"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
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
                    <th className="text-center px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Meniu veg.</th>
                    <th className="text-center px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Meniu copil</th>
                    <th className="text-center px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Transport</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Mesaj</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Data</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-medium tracking-wide">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="border-b border-border-light/50 hover:bg-background-soft/30 transition-colors">
                      <td className="px-4 py-3 text-text-heading font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-foreground/70">{r.partner_name || "\u2014"}</td>
                      <td className="px-4 py-3 text-center">{r.person_count}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}>
                          {r.attending ? "Da" : "Nu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${r.vegetarian_menu ? "bg-green-50 text-green-700" : "text-foreground/40"}`}>
                          {r.vegetarian_menu ? "Da" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${r.children_menu ? "bg-purple-50 text-purple-700" : "text-foreground/40"}`}>
                          {r.children_menu ? "Da" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${r.needs_transport ? "bg-blue-50 text-blue-700" : "text-foreground/40"}`}>
                          {r.needs_transport ? "Da" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{r.message || "\u2014"}</td>
                      <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("ro-RO", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => setViewEntry(r)}
                            className="p-2 rounded-lg text-foreground/50 hover:text-accent hover:bg-background-soft/50 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Vezi detalii"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(r)}
                            className="p-2 rounded-lg text-foreground/50 hover:text-accent-rose hover:bg-background-soft/50 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Sterge"
                          >
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
          {filtered.length} din {rsvps.length} raspunsuri
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>

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
              <h3 className="serif-font text-lg text-text-heading mb-2">Sterge confirmarea</h3>
              <p className="text-sm text-text-muted mb-1">Esti sigur ca vrei sa stergi confirmarea de la</p>
              <p className="text-sm font-medium text-text-heading">{deleteConfirm.name}?</p>
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

      {/* Modal detalii RSVP */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3">
              <h3 className="serif-font text-lg text-text-heading">Detalii confirmare</h3>
            </div>
            <div className="px-5 overflow-y-auto flex-1">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Nume</dt>
                  <dd className="text-text-heading font-medium">{viewEntry.name}</dd>
                </div>
                {viewEntry.partner_name && (
                  <div>
                    <dt className="text-xs text-text-muted tracking-wide mb-0.5">Partener</dt>
                    <dd className="text-foreground">{viewEntry.partner_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Numar persoane</dt>
                  <dd className="text-foreground">{viewEntry.person_count}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Participa</dt>
                  <dd>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewEntry.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    }`}>
                      {viewEntry.attending ? "Da" : "Nu"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Meniu vegetarian</dt>
                  <dd className="text-foreground">{viewEntry.vegetarian_menu ? "Da" : "Nu"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Meniu copil</dt>
                  <dd className="text-foreground">{viewEntry.children_menu ? "Da" : "Nu"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Necesita transport</dt>
                  <dd className="text-foreground">{viewEntry.needs_transport ? "Da" : "Nu"}</dd>
                </div>
                {viewEntry.message && (
                  <div>
                    <dt className="text-xs text-text-muted tracking-wide mb-0.5">Mesaj</dt>
                    <dd className="text-foreground whitespace-pre-wrap">{viewEntry.message}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-text-muted tracking-wide mb-0.5">Data confirmare</dt>
                  <dd className="text-foreground">
                    {new Date(viewEntry.created_at).toLocaleDateString("ro-RO", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="p-5 pt-3 border-t border-border-light rounded-b-xl">
              <button
                type="button"
                onClick={() => setViewEntry(null)}
                className="w-full py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer"
              >
                Inchide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
