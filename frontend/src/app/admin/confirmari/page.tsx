"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, PAGE_SIZE, RsvpEntry, authHeaders, Pagination, SearchInput, FilterButton } from "../_shared";

type RsvpFilter = "all" | "attending" | "not_attending";

export default function ConfirmariPage() {
  const { token, onUnauth } = useAdminAuth();
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
                      <td className="px-4 py-3 text-foreground/70">{r.partner_name || "\u2014"}</td>
                      <td className="px-4 py-3 text-center">{r.person_count}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.attending ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}>
                          {r.attending ? "Da" : "Nu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/60 max-w-[200px] truncate">{r.message || "\u2014"}</td>
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
