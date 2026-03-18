"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, Guest, RsvpEntry, authHeaders, SearchInput } from "../_shared";

interface TableAssignment {
  guest_id: number;
  table_number: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  partner_id: number | null;
}

interface Service {
  id: number;
  nume: string;
  numar_persoane: number;
  loc_la_masa: boolean;
}

interface TableSettings {
  numar_mese: number | null;
  min_persoane_masa: number | null;
  max_persoane_masa: number | null;
  nume_mire: string | null;
  nume_mireasa: string | null;
  nas_nume: string | null;
  nas_prenume: string | null;
  nasa_nume: string | null;
  nasa_prenume: string | null;
}

export default function MesePage() {
  const { token, onUnauth } = useAdminAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<{ service_id: number; table_number: number; nume: string; numar_persoane: number }[]>([]);
  const [settings, setSettings] = useState<TableSettings | null>(null);
  const [search, setSearch] = useState("");
  const [verifySearch, setVerifySearch] = useState("");
  const [meseTab, setMeseTab] = useState<"seteaza" | "verifica">("seteaza");
  const [assigning, setAssigning] = useState<number | null>(null);
  const [assigningType, setAssigningType] = useState<"guest" | "service">("guest");
  const [addToTable, setAddToTable] = useState<number | null>(null);
  const [addToTableSearch, setAddToTableSearch] = useState("");

  const fetchAll = useCallback(async () => {
    const [settingsRes, guestsRes, assignRes, rsvpRes, servicesRes] = await Promise.all([
      fetch(`${API_URL}/api/wedding-settings`),
      fetch(`${API_URL}/api/admin/guests`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/api/admin/table-assignments`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/api/admin/rsvp`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/api/admin/services`, { headers: authHeaders(token) }),
    ]);
    if (guestsRes.status === 401 || assignRes.status === 401) { onUnauth(); return; }
    const s = await settingsRes.json();
    setSettings({
      numar_mese: s.numar_mese, min_persoane_masa: s.min_persoane_masa, max_persoane_masa: s.max_persoane_masa,
      nume_mire: s.nume_mire, nume_mireasa: s.nume_mireasa,
      nas_nume: s.nas_nume, nas_prenume: s.nas_prenume, nasa_nume: s.nasa_nume, nasa_prenume: s.nasa_prenume,
    });
    setGuests(await guestsRes.json());
    const assignData = await assignRes.json();
    setAssignments(assignData.guests || []);
    setServiceAssignments(assignData.services || []);
    if (rsvpRes.ok) setRsvps(await rsvpRes.json());
    if (servicesRes.ok) {
      const allServices: Service[] = await servicesRes.json();
      setServices(allServices.filter((s) => s.loc_la_masa));
    }
  }, [token, onUnauth]);

  // RSVP status per guest_id: "confirmed" | "declined" | null
  const rsvpStatus = useMemo(() => {
    const m = new Map<number, "confirmed" | "declined">();
    rsvps.forEach((r) => {
      if (r.guest_id) m.set(r.guest_id, r.attending ? "confirmed" : "declined");
    });
    return m;
  }, [rsvps]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter out partner-only rows
  const mainGuests = useMemo(() => {
    const partnerIds = new Set(guests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
    return guests.filter((g) => !partnerIds.has(g.id));
  }, [guests]);

  const assignmentMap = useMemo(() => {
    const m = new Map<number, number>();
    assignments.forEach((a) => m.set(a.guest_id, a.table_number));
    return m;
  }, [assignments]);

  const serviceAssignmentMap = useMemo(() => {
    const m = new Map<number, number>();
    serviceAssignments.forEach((a) => m.set(a.service_id, a.table_number));
    return m;
  }, [serviceAssignments]);

  const unassignedServices = useMemo(() => {
    return services.filter((s) => !serviceAssignmentMap.has(s.id));
  }, [services, serviceAssignmentMap]);

  const unassigned = useMemo(() => {
    return mainGuests.filter((g) => {
      if (assignmentMap.has(g.id)) return false;
      if (g.loc_pe_scaun === false) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
      return g.nume.toLowerCase().includes(q) || g.prenume.toLowerCase().includes(q) ||
        (partner && (partner.nume.toLowerCase().includes(q) || partner.prenume.toLowerCase().includes(q)));
    });
  }, [mainGuests, assignmentMap, search, guests]);

  // Build table data
  const tables = useMemo(() => {
    if (!settings?.numar_mese) return [];
    const result: { number: number; guests: { id: number; name: string; partnerId: number | null }[]; services: { id: number; name: string; people: number }[] }[] = [];
    for (let i = 1; i <= settings.numar_mese; i++) {
      const tableGuests = mainGuests
        .filter((g) => assignmentMap.get(g.id) === i)
        .map((g) => {
          const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
          const name = partner
            ? `${g.prenume} & ${partner.prenume} ${g.nume}${g.nume !== partner.nume ? ` / ${partner.nume}` : ""}`
            : `${g.prenume} ${g.nume}`;
          return { id: g.id, name, partnerId: g.partner_id };
        });
      const tableServices = serviceAssignments
        .filter((sa) => sa.table_number === i)
        .map((sa) => ({ id: sa.service_id, name: sa.nume, people: sa.numar_persoane }));
      result.push({ number: i, guests: tableGuests, services: tableServices });
    }
    return result;
  }, [settings, mainGuests, assignmentMap, guests, serviceAssignments]);

  function countPeople(tableGuests: { id: number; partnerId: number | null }[], tableServices: { people: number }[] = []) {
    const guestCount = tableGuests.reduce((sum, g) => {
      const guest = mainGuests.find((mg) => mg.id === g.id);
      return sum + (guest?.plus_one ? 2 : 1);
    }, 0);
    const serviceCount = tableServices.reduce((sum, s) => sum + s.people, 0);
    return guestCount + serviceCount;
  }

  function getStatus(count: number): "empty" | "low" | "ok" | "high" {
    if (count === 0) return "empty";
    const min = settings?.min_persoane_masa ?? 0;
    const max = settings?.max_persoane_masa ?? 999;
    if (count < min) return "low";
    if (count > max) return "high";
    return "ok";
  }

  const statusColors = {
    empty: "border-gray-200",
    low: "border-amber-400 bg-amber-50/50",
    ok: "border-green-400 bg-green-50/50",
    high: "border-red-400 bg-red-50/50",
  };

  const statusLabels = {
    empty: "Goala",
    low: "Prea putini",
    ok: "OK",
    high: "Prea multi",
  };

  const statusBadgeColors = {
    empty: "bg-gray-100 text-gray-500",
    low: "bg-amber-100 text-amber-700",
    ok: "bg-green-100 text-green-700",
    high: "bg-red-100 text-red-700",
  };

  function RsvpBadge({ guestId }: { guestId: number }) {
    const status = rsvpStatus.get(guestId);
    if (!status) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Neconfirmat</span>;
    if (status === "confirmed") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Confirmat</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Refuzat</span>;
  }

  async function assignService(serviceId: number, tableNumber: number) {
    await fetch(`${API_URL}/api/admin/table-assignments/service/${serviceId}`, {
      method: "PUT", headers: authHeaders(token), body: JSON.stringify({ table_number: tableNumber }),
    });
    setAssigning(null);
    fetchAll();
  }

  async function unassignService(serviceId: number) {
    await fetch(`${API_URL}/api/admin/table-assignments/service/${serviceId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  }

  async function assignGuest(guestId: number, tableNumber: number) {
    const guest = mainGuests.find((g) => g.id === guestId);
    await fetch(`${API_URL}/api/admin/table-assignments/${guestId}`, {
      method: "PUT", headers: authHeaders(token), body: JSON.stringify({ table_number: tableNumber }),
    });
    // Also assign partner
    if (guest?.partner_id) {
      await fetch(`${API_URL}/api/admin/table-assignments/${guest.partner_id}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify({ table_number: tableNumber }),
      });
    }
    setAssigning(null);
    fetchAll();
  }

  async function unassignGuest(guestId: number) {
    const guest = mainGuests.find((g) => g.id === guestId);
    await fetch(`${API_URL}/api/admin/table-assignments/${guestId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (guest?.partner_id) {
      await fetch(`${API_URL}/api/admin/table-assignments/${guest.partner_id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
    }
    fetchAll();
  }

  if (!settings) {
    return <div className="text-center py-12"><p className="text-sm text-text-muted">Se incarca...</p></div>;
  }

  if (!settings.numar_mese) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-muted mb-2">Nu ai configurat numarul de mese.</p>
        <a href="/admin/setari" className="text-sm text-button hover:text-button-hover transition-colors">
          Mergi la Setari &rarr; Mese & logistica
        </a>
      </div>
    );
  }

  const totalAssigned = tables.reduce((sum, t) => sum + countPeople(t.guests, t.services), 0);
  const totalUnassigned = unassigned.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0) + unassignedServices.reduce((sum, s) => sum + s.numar_persoane, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-font text-2xl text-text-heading">Aranjament mese</h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-light mb-6">
        {([
          { id: "seteaza" as const, label: "Seteaza" },
          { id: "verifica" as const, label: "Verifica" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMeseTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              meseTab === tab.id
                ? "border-button text-text-heading"
                : "border-transparent text-text-muted hover:text-text-heading"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {meseTab === "seteaza" && (<>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="family-card text-center py-3">
          <p className="text-2xl font-light text-text-heading">{settings.numar_mese}</p>
          <p className="text-xs text-text-muted">Mese</p>
        </div>
        <div className="family-card text-center py-3">
          <p className="text-2xl font-light text-green-600">{totalAssigned}</p>
          <p className="text-xs text-text-muted">Asezati</p>
        </div>
        <div className="family-card text-center py-3">
          <p className="text-2xl font-light text-amber-600">{totalUnassigned}</p>
          <p className="text-xs text-text-muted">Neasezati</p>
        </div>
      </div>

      {/* Table picker modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-xs max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3 text-center">
              <h3 className="text-sm font-medium text-text-heading mb-1">Alege masa</h3>
              <p className="text-xs text-text-muted">
                {(() => {
                  if (assigningType === "service") {
                    const s = services.find((s) => s.id === assigning);
                    return s ? `${s.nume} (${s.numar_persoane}p)` : "";
                  }
                  const g = mainGuests.find((g) => g.id === assigning);
                  if (!g) return "";
                  const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                  return partner ? `${g.prenume} & ${partner.prenume} ${g.nume}` : `${g.prenume} ${g.nume}`;
                })()}
              </p>
            </div>
            <div className="px-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {Array.from({ length: settings.numar_mese! }, (_, i) => i + 1).map((n) => {
                  const table = tables.find((t) => t.number === n);
                  const count = table ? countPeople(table.guests, table?.services) : 0;
                  const st = getStatus(count);
                  return (
                    <button
                      key={n}
                      onClick={() => assigningType === "service" ? assignService(assigning!, n) : assignGuest(assigning!, n)}
                      className={`py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors
                        ${st === "ok" ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" :
                          st === "high" ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" :
                          st === "low" ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200" :
                          "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5 pt-3 border-t border-border-light rounded-b-xl">
              <button onClick={() => setAssigning(null)}
                className="w-full py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add guest to specific table modal */}
      {addToTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-xs max-h-[70vh] flex flex-col">
            <div className="p-5 pb-3 text-center">
              <h3 className="text-sm font-medium text-text-heading mb-1">Adauga invitat la Masa {addToTable}</h3>
            </div>
            <div className="px-5 pb-2">
              <SearchInput value={addToTableSearch} onChange={setAddToTableSearch} placeholder="Cauta invitat..." />
            </div>
            <div className="px-5 overflow-y-auto flex-1">
              {(() => {
                const q = addToTableSearch.toLowerCase().trim();
                const filtered = unassigned.filter((g) => {
                  if (!q) return true;
                  const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                  return g.nume.toLowerCase().includes(q) || g.prenume.toLowerCase().includes(q) ||
                    (partner && (partner.nume.toLowerCase().includes(q) || partner.prenume.toLowerCase().includes(q)));
                });
                return filtered.length === 0 ? (
                  <p className="text-xs text-text-muted py-4 text-center">
                    {q ? "Niciun rezultat" : "Toti sunt asezati!"}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((g) => {
                      const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                      const displayName = partner
                        ? `${g.prenume} & ${partner.prenume} ${g.nume}${g.nume !== partner.nume ? ` / ${partner.nume}` : ""}`
                        : `${g.prenume} ${g.nume}`;
                      return (
                        <button
                          key={g.id}
                          onClick={() => { assignGuest(g.id, addToTable); setAddToTable(null); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-background-soft transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="text-sm text-text-heading">{displayName}</span>
                          <span className="text-xs text-text-muted shrink-0">{g.plus_one ? "2p" : "1p"}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="p-5 pt-3 border-t border-border-light rounded-b-xl">
              <button onClick={() => setAddToTable(null)}
                className="w-full py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned guests panel */}
      <div className="family-card mb-6">
        <h3 className="text-sm font-medium text-text-heading mb-3">Invitati neasezati ({unassigned.length})</h3>
        <SearchInput value={search} onChange={setSearch} placeholder="Cauta invitat..." />
        <div className="mt-3 max-h-[300px] overflow-y-auto space-y-1">
          {unassigned.length === 0 && unassignedServices.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              {search ? "Niciun rezultat" : "Toti sunt asezati!"}
            </p>
          ) : (
            <>
              {unassignedServices.map((s) => (
                <button
                  key={`svc-${s.id}`}
                  onClick={() => { setAssigning(s.id); setAssigningType("service"); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-background-soft transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-text-heading">{s.nume}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Serviciu</span>
                    <span className="text-xs text-text-muted">{s.numar_persoane}p</span>
                  </div>
                </button>
              ))}
              {unassigned.map((g) => {
                const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
                const displayName = partner
                  ? `${g.prenume} & ${partner.prenume} ${g.nume}`
                  : `${g.prenume} ${g.nume}`;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setAssigning(g.id); setAssigningType("guest"); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background-soft transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-text-heading">{displayName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <RsvpBadge guestId={g.id} />
                      <span className="text-xs text-text-muted">{g.plus_one ? "2p" : "1p"}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Presidium table */}
      <div className="mb-6">
        <div className="rounded-xl border-2 border-button/40 bg-button/5 p-5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
              <path d="M12 2l1.5 4h-3L12 2z" /><circle cx="9" cy="14" r="6" /><circle cx="15" cy="14" r="6" />
            </svg>
            <h4 className="text-sm font-medium text-text-heading">Masa de Prezidiu</h4>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {settings.nume_mireasa || settings.nume_mire ? (
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Mirii</p>
                <p className="text-sm font-medium text-text-heading">
                  {[settings.nume_mireasa, settings.nume_mire].filter(Boolean).join(" & ")}
                </p>
              </div>
            ) : null}
            {settings.nasa_prenume || settings.nas_prenume ? (
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Nasii</p>
                <p className="text-sm font-medium text-text-heading">
                  {[
                    settings.nasa_prenume && settings.nasa_nume ? `${settings.nasa_prenume} ${settings.nasa_nume}` : null,
                    settings.nas_prenume && settings.nas_nume ? `${settings.nas_prenume} ${settings.nas_nume}` : null,
                  ].filter(Boolean).join(" & ")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tables: left and right columns on desktop */}
      {(() => {
        const half = Math.ceil(tables.length / 2);
        const leftTables = tables.slice(0, half);
        const rightTables = tables.slice(half);

        const renderTable = (table: typeof tables[0]) => {
          const count = countPeople(table.guests, table.services);
          const status = getStatus(count);
          const isEmpty = table.guests.length === 0 && table.services.length === 0;
          return (
            <div key={table.number} className={`rounded-xl border-2 p-4 transition-colors ${statusColors[status]}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-text-heading">Masa {table.number}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeColors[status]}`}>
                  {count}p {status !== "empty" && status !== "ok" ? `· ${statusLabels[status]}` : ""}
                </span>
              </div>
              {isEmpty ? (
                <p className="text-xs text-text-muted italic py-2">Niciun invitat</p>
              ) : (
                <div className="space-y-1">
                  {table.services.map((s) => (
                    <div key={`svc-${s.id}`} className="flex items-center justify-between group gap-1">
                      <span className="text-xs text-foreground flex-1 min-w-0 truncate">{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">{s.people}p</span>
                      <button
                        onClick={() => unassignService(s.id)}
                        className="text-text-muted/40 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer p-1"
                        title="Elimina de la masa"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {table.guests.map((g) => (
                    <div key={g.id} className="flex items-center justify-between group gap-1">
                      <span className="text-xs text-foreground flex-1 min-w-0 truncate">{g.name}</span>
                      <RsvpBadge guestId={g.id} />
                      <button
                        onClick={() => unassignGuest(g.id)}
                        className="text-text-muted/40 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer p-1"
                        title="Elimina de la masa"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {settings.min_persoane_masa && settings.max_persoane_masa && (
                <div className="mt-2 pt-2 border-t border-border-light/50">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        status === "ok" ? "bg-green-400" : status === "high" ? "bg-red-400" : status === "low" ? "bg-amber-400" : "bg-gray-200"
                      }`}
                      style={{ width: `${Math.min(100, (count / settings.max_persoane_masa) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">{settings.min_persoane_masa}–{settings.max_persoane_masa} persoane</p>
                </div>
              )}
              <button
                onClick={() => { setAddToTable(table.number); setAddToTableSearch(""); }}
                className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-border-light text-xs text-text-muted hover:text-button hover:border-button/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adauga invitat
              </button>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {leftTables.map(renderTable)}
            </div>
            <div className="space-y-4">
              {rightTables.map(renderTable)}
            </div>
          </div>
        );
      })()}
      </>)}

      {meseTab === "verifica" && (() => {
        const q = verifySearch.toLowerCase().trim();
        const matchingGuestIds = new Set<number>();
        if (q) {
          mainGuests.forEach((g) => {
            const partner = g.partner_id ? guests.find((p) => p.id === g.partner_id) : null;
            if (
              g.nume.toLowerCase().includes(q) ||
              g.prenume.toLowerCase().includes(q) ||
              (partner && (partner.nume.toLowerCase().includes(q) || partner.prenume.toLowerCase().includes(q)))
            ) {
              matchingGuestIds.add(g.id);
            }
          });
        }
        const matchingTables = q
          ? tables.filter((t) => t.guests.some((g) => matchingGuestIds.has(g.id)))
          : [];

        return (
          <div>
            <div className="mb-4">
              <SearchInput value={verifySearch} onChange={setVerifySearch} placeholder="Cauta invitat dupa nume..." />
            </div>
            {!q ? (
              <p className="text-sm text-text-muted text-center py-8">Scrie un nume pentru a gasi masa invitatului.</p>
            ) : matchingTables.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                {matchingGuestIds.size > 0 ? "Invitatul nu este asezat la nicio masa." : "Niciun invitat gasit."}
              </p>
            ) : (
              <div className="space-y-4">
                {matchingTables.map((table) => {
                  const count = countPeople(table.guests, table.services);
                  const status = getStatus(count);
                  return (
                    <div key={table.number} className={`rounded-xl border-2 p-4 transition-colors ${statusColors[status]}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-text-heading">Masa {table.number}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeColors[status]}`}>
                          {count}p
                        </span>
                      </div>
                      <div className="space-y-1">
                        {table.services.map((s) => (
                          <div key={`svc-${s.id}`} className="flex items-center gap-1">
                            <span className="text-xs text-foreground">{s.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">{s.people}p</span>
                          </div>
                        ))}
                        {table.guests.map((g) => (
                          <div key={g.id} className={`px-2 py-1 rounded ${matchingGuestIds.has(g.id) ? "bg-button/10 border border-button/30" : ""}`}>
                            <span className={`text-sm ${matchingGuestIds.has(g.id) ? "text-text-heading font-semibold" : "text-foreground"}`}>{g.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
