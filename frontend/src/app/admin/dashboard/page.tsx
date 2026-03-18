"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, Guest, RsvpEntry, authHeaders } from "../_shared";

interface Service {
  id: number;
  nume: string;
  numar_persoane: number;
  pret: number;
  avans: number | null;
  loc_la_masa: boolean;
  contract_path: string | null;
}

interface TableAssignment {
  guest_id: number;
  table_number: number;
}

function formatPrice(v: number) {
  return Number(v).toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function DashboardPage() {
  const { token, onUnauth } = useAdminAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [optimismLevel, setOptimismLevel] = useState(50);
  const [onlyConfirmed, setOnlyConfirmed] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [guestsRes, rsvpRes, servicesRes, settingsRes, assignRes] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/guests`, {
            headers: authHeaders(token),
          }),
          fetch(`${API_URL}/api/admin/rsvp`, { headers: authHeaders(token) }),
          fetch(`${API_URL}/api/admin/services`, {
            headers: authHeaders(token),
          }),
          fetch(`${API_URL}/api/wedding-settings`),
          fetch(`${API_URL}/api/admin/table-assignments`, {
            headers: authHeaders(token),
          }),
        ]);
      if (
        guestsRes.status === 401 ||
        rsvpRes.status === 401 ||
        servicesRes.status === 401 ||
        assignRes.status === 401
      ) {
        onUnauth();
        return;
      }
      setGuests(await guestsRes.json());
      if (rsvpRes.ok) setRsvps(await rsvpRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      setSettings(await settingsRes.json());
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(assignData.guests || []);
      }
    } finally {
      setLoading(false);
    }
  }, [token, onUnauth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Main guests (exclude auto-created partners) ──
  const mainGuests = useMemo(() => {
    const partnerIds = new Set(
      guests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id)
    );
    return guests.filter((g) => !partnerIds.has(g.id));
  }, [guests]);

  // ── RSVP map ──
  const rsvpMap = useMemo(() => {
    const m = new Map<number, boolean>();
    rsvps.forEach((r) => {
      if (r.guest_id != null) m.set(r.guest_id, r.attending);
    });
    return m;
  }, [rsvps]);

  // ── Computed values ──
  const stats = useMemo(() => {
    let totalInvited = 0;
    let confirmed = 0;
    let declined = 0;
    let pending = 0;
    let estimatedGiftMin = 0;
    let estimatedGiftMax = 0;

    mainGuests.forEach((g) => {
      const personCount = g.plus_one ? 2 : 1;
      totalInvited += personCount;

      const rsvpStatus = rsvpMap.get(g.id);
      if (rsvpStatus === true) {
        confirmed += personCount;
      } else if (rsvpStatus === false) {
        declined += personCount;
      } else {
        pending += personCount;
      }

      // Gift estimation: confirmed only or all non-declined
      const includeInGift = onlyConfirmed
        ? rsvpStatus === true
        : rsvpStatus !== false;
      if (includeInGift) {
        estimatedGiftMin += Number(g.estimated_gift_min || 0);
        estimatedGiftMax += Number(g.estimated_gift_max || 0);
      }
    });

    const seatedGuests = assignments.length;
    const unseatedGuests = totalInvited - seatedGuests;

    const totalServiceCost = services.reduce(
      (sum, s) => sum + Number(s.pret),
      0
    );
    const totalAvans = services.reduce(
      (sum, s) => sum + Number(s.avans || 0),
      0
    );
    const remainingToPay = totalServiceCost - totalAvans;

    const needTransport = rsvps
      .filter((r) => r.attending && r.needs_transport)
      .reduce((sum, r) => sum + r.person_count, 0);
    const vegetarianMenu = rsvps
      .filter((r) => r.attending && r.vegetarian_menu)
      .reduce((sum, r) => sum + r.person_count, 0);

    const estimatedGift =
      estimatedGiftMin +
      (estimatedGiftMax - estimatedGiftMin) * (optimismLevel / 100);
    const giftVsCost = estimatedGift - totalServiceCost;

    // Gender distribution
    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedCount = 0;
    guests.forEach((g) => {
      if (g.sex === "M") maleCount++;
      else if (g.sex === "F") femaleCount++;
      else unspecifiedCount++;
    });

    // Quick stats
    const withPlusOne = mainGuests.filter((g) => g.plus_one).length;
    const withSlug = mainGuests.filter((g) => g.slug).length;
    const servicesWithContract = services.filter(
      (s) => s.contract_path
    ).length;
    const servicesWithSeat = services.filter((s) => s.loc_la_masa).length;

    // Days until wedding
    let daysUntilWedding: number | null = null;
    if (settings.ceremonie_data) {
      const weddingDate = new Date(
        settings.ceremonie_data.split("T")[0] + "T00:00:00"
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      daysUntilWedding = Math.ceil(
        (weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      totalInvited,
      confirmed,
      declined,
      pending,
      seatedGuests,
      unseatedGuests,
      totalServiceCost,
      totalAvans,
      remainingToPay,
      needTransport,
      vegetarianMenu,
      estimatedGiftMin,
      estimatedGiftMax,
      estimatedGift,
      giftVsCost,
      maleCount,
      femaleCount,
      unspecifiedCount,
      withPlusOne,
      withSlug,
      servicesWithContract,
      servicesWithSeat,
      daysUntilWedding,
    };
  }, [
    mainGuests,
    rsvpMap,
    assignments,
    services,
    rsvps,
    guests,
    settings,
    optimismLevel,
    onlyConfirmed,
  ]);

  // ── Percentages for RSVP chart ──
  const rsvpPercentages = useMemo(() => {
    const total = stats.totalInvited || 1;
    return {
      confirmed: (stats.confirmed / total) * 100,
      pending: (stats.pending / total) * 100,
      declined: (stats.declined / total) * 100,
    };
  }, [stats]);

  // ── Seating percentage ──
  const seatingPct = useMemo(() => {
    if (stats.totalInvited === 0) return 0;
    return Math.round((stats.seatedGuests / stats.totalInvited) * 100);
  }, [stats]);

  // ── SVG circle metrics ──
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset =
    circleCircumference - (seatingPct / 100) * circleCircumference;

  // ── Avans progress ──
  const avansPct = useMemo(() => {
    if (stats.totalServiceCost === 0) return 0;
    return Math.round((stats.totalAvans / stats.totalServiceCost) * 100);
  }, [stats]);

  // ── Gender max for bar scaling ──
  const genderMax = Math.max(
    stats.maleCount,
    stats.femaleCount,
    stats.unspecifiedCount,
    1
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="serif-font text-2xl text-text-heading">
        Panou de comanda
      </h1>

      {/* Row 1 - Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="family-card text-center">
          <p className="text-3xl font-semibold text-text-heading">
            {stats.totalInvited}
          </p>
          <p className="text-xs text-text-muted mt-1">persoane</p>
          <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wide">
            Total invitati
          </p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl font-semibold text-green-600">
            {stats.confirmed}
          </p>
          <p className="text-xs text-text-muted mt-1">persoane</p>
          <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wide">
            Confirmati
          </p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl font-semibold text-amber-600">
            {stats.pending}
          </p>
          <p className="text-xs text-text-muted mt-1">persoane</p>
          <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wide">
            In asteptare
          </p>
        </div>
        <div className="family-card text-center">
          <p className="text-3xl font-semibold text-red-600">
            {stats.declined}
          </p>
          <p className="text-xs text-text-muted mt-1">persoane</p>
          <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wide">
            Refuzat
          </p>
        </div>
      </div>

      {/* Row 2 - RSVP Chart */}
      <div className="family-card">
        <h2 className="text-sm font-medium text-text-heading mb-4">
          Status confirmari
        </h2>
        {/* Stacked bar */}
        <div className="flex h-10 rounded-lg overflow-hidden">
          {rsvpPercentages.confirmed > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
              style={{ width: `${rsvpPercentages.confirmed}%` }}
            >
              {rsvpPercentages.confirmed >= 8
                ? `${rsvpPercentages.confirmed.toFixed(1)}%`
                : ""}
            </div>
          )}
          {rsvpPercentages.pending > 0 && (
            <div
              className="bg-amber-400 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
              style={{ width: `${rsvpPercentages.pending}%` }}
            >
              {rsvpPercentages.pending >= 8
                ? `${rsvpPercentages.pending.toFixed(1)}%`
                : ""}
            </div>
          )}
          {rsvpPercentages.declined > 0 && (
            <div
              className="bg-red-400 flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
              style={{ width: `${rsvpPercentages.declined}%` }}
            >
              {rsvpPercentages.declined >= 8
                ? `${rsvpPercentages.declined.toFixed(1)}%`
                : ""}
            </div>
          )}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-text-muted">
              Confirmati ({stats.confirmed})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-text-muted">
              In asteptare ({stats.pending})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-text-muted">
              Refuzat ({stats.declined})
            </span>
          </div>
        </div>
      </div>

      {/* Row 3 - Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seating */}
        <div className="family-card flex flex-col items-center">
          <h2 className="text-sm font-medium text-text-heading mb-4 self-start">
            Aranjament mese
          </h2>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              fill="none"
              stroke="#22c55e"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={circleOffset}
              transform="rotate(-90 70 70)"
              className="transition-all duration-700"
            />
            <text
              x="70"
              y="70"
              textAnchor="middle"
              dominantBaseline="central"
              className="text-lg font-semibold"
              fill="#1a1a1a"
            >
              {seatingPct}%
            </text>
          </svg>
          <p className="text-sm text-text-muted mt-3">
            {stats.seatedGuests} din {stats.totalInvited} asezati
          </p>
          {/* Small utilization bar */}
          <div className="w-full mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${seatingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transport & Menu */}
        <div className="family-card">
          <h2 className="text-sm font-medium text-text-heading mb-4">
            Transport & meniu
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 17h14v-5H5zm0 0v2h2v-2m10 0v2h2v-2M3 12l2-7h14l2 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-heading">
                    {stats.needTransport}
                  </p>
                  <p className="text-xs text-text-muted">
                    Transport necesar (persoane)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <path d="M15 9l-6 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-heading">
                    {stats.vegetarianMenu}
                  </p>
                  <p className="text-xs text-text-muted">
                    Meniu vegetarian (persoane)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 - Financial overview */}
      <div className="family-card">
        <h2 className="text-sm font-medium text-text-heading mb-5">
          Buget & servicii
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Services breakdown */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-text-muted mb-3">
              Costuri servicii
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Cost total</span>
                <span className="text-sm font-medium text-text-heading">
                  {formatPrice(stats.totalServiceCost)} RON
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Total avans</span>
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(stats.totalAvans)} RON
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Rest de plata</span>
                <span className="text-sm font-medium text-red-600">
                  {formatPrice(stats.remainingToPay)} RON
                </span>
              </div>
            </div>
            {/* Avans progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Avans platit</span>
                <span>{avansPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${avansPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Gift estimation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wide text-text-muted">
                Estimare dar
              </h3>
              <button
                onClick={() => setOnlyConfirmed(!onlyConfirmed)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  onlyConfirmed
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {onlyConfirmed ? "Doar confirmati" : "Toti invitatii"}
              </button>
            </div>
            {/* Slider */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>Pesimist</span>
                <span className="font-medium text-text-heading">{optimismLevel}%</span>
                <span>Optimist</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={optimismLevel}
                onChange={(e) => setOptimismLevel(Number(e.target.value))}
                className="w-full accent-accent h-2 cursor-pointer"
              />
            </div>
            {/* Current value */}
            <p className="text-3xl font-semibold text-text-heading text-center my-2">
              {formatPrice(Math.round(stats.estimatedGift))} RON
            </p>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Min: {formatPrice(stats.estimatedGiftMin)} RON</span>
              <span>Max: {formatPrice(stats.estimatedGiftMax)} RON</span>
            </div>
            {/* Comparison with cost */}
            <div
              className={`mt-3 text-center py-2 rounded-lg ${
                stats.giftVsCost >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span className="text-sm font-medium">
                {stats.giftVsCost >= 0 ? "+" : ""}
                {formatPrice(Math.round(stats.giftVsCost))} RON
              </span>
              <span className="text-xs ml-1.5">vs. cost servicii</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5 - Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender distribution */}
        <div className="family-card">
          <h2 className="text-sm font-medium text-text-heading mb-4">
            Distributie gen
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Barbati (M)",
                count: stats.maleCount,
                color: "bg-blue-500",
              },
              {
                label: "Femei (F)",
                count: stats.femaleCount,
                color: "bg-pink-500",
              },
              {
                label: "Nespecificat",
                count: stats.unspecifiedCount,
                color: "bg-gray-400",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded transition-all duration-500`}
                    style={{
                      width: `${(item.count / genderMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="family-card">
          <h2 className="text-sm font-medium text-text-heading mb-4">
            Statistici rapide
          </h2>
          <div className="space-y-3">
            {[
              { label: "Invitati cu +1", value: stats.withPlusOne },
              { label: "Invitati cu slug", value: stats.withSlug },
              {
                label: "Servicii cu contract",
                value: stats.servicesWithContract,
              },
              {
                label: "Servicii cu loc la masa",
                value: stats.servicesWithSeat,
              },
              {
                label: "Zile pana la nunta",
                value:
                  stats.daysUntilWedding != null
                    ? stats.daysUntilWedding
                    : "N/A",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0"
              >
                <span className="text-sm text-text-muted">{item.label}</span>
                <span className="text-sm font-medium text-text-heading">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
