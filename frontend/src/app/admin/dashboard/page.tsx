"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useAdminAuth } from "../_context";
import { API_URL, Guest, RsvpEntry, authHeaders } from "../_shared";
import { useTabParam } from "@/hooks/useTabParam";
import { Car, Leaf, Baby } from "@phosphor-icons/react";

interface Service {
  id: number;
  nume: string;
  numar_persoane: number;
  pret: number;
  avans: number | null;
  pret_per_invitat: number | null;
  has_pret_per_invitat: boolean;
  loc_la_masa: boolean;
  is_restaurant: boolean;
  contract_path: string | null;
  type: "supplier" | "expense";
}

interface TableAssignment {
  guest_id: number;
  table_number: number;
}

interface InvitationLog {
  guest_id: number;
  open_count: number;
  last_open_at: string | null;
  device: string | null;
  browser: string | null;
  nume: string;
  prenume: string;
  slug: string | null;
  plus_one: boolean;
  partner_id: number | null;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `acum ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `acum ${hours}h`;
  const days = Math.floor(hours / 24);
  return `acum ${days}z`;
}

function formatPriceRaw(v: number) {
  return Number(v).toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function DashboardContent() {
  const { token, onUnauth } = useAdminAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [invitationLogs, setInvitationLogs] = useState<InvitationLog[]>([]);
  const [optimismLevel, setOptimismLevel] = useState(50);
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const [subtractAvans, setSubtractAvans] = useState(false);
  const [showEuro, setShowEuro] = useState(false);
  const [subtractExtra, setSubtractExtra] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [costSearch, setCostSearch] = useState("");
  const [logSearchState, setLogSearchState] = useState("");
  const [miniLogSearch, setMiniLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [dashTab, setDashTab] = useTabParam("tab", "sumar", ["sumar", "financiar", "invitati"] as const);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [guestsRes, rsvpRes, servicesRes, settingsRes, assignRes, logsRes] =
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
          fetch(`${API_URL}/api/admin/invitation-logs`, {
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
      if (rsvpRes.ok) {
        const rsvpData = await rsvpRes.json();
        setRsvps(rsvpData.map((r: Record<string, unknown>) => ({
          ...r,
          attending: Boolean(r.attending),
          needs_transport: Boolean(r.needs_transport),
          vegetarian_menu: Boolean(r.vegetarian_menu),
        })));
      }
      if (servicesRes.ok) setServices(await servicesRes.json());
      setSettings(await settingsRes.json());
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(assignData.guests || []);
      }
      if (logsRes.ok) {
        setInvitationLogs(await logsRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [token, onUnauth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const cursEuro = settings.curs_euro ? Number(settings.curs_euro) : null;
  const currency = showEuro && cursEuro ? "EUR" : "RON";
  const conv = (v: number) => showEuro && cursEuro ? v / cursEuro : v;
  const formatPrice = (v: number) => formatPriceRaw(conv(v));

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

      // Gift estimation: confirmed only or all invited, adjusted by status
      const includeInGift = onlyConfirmed
        ? rsvpStatus === true
        : true;
      if (includeInGift) {
        const giftMultiplier = g.status === "incertitudine" ? 0 : g.status === "doar_dar" ? 0.4 : 1;
        estimatedGiftMin += Number(g.estimated_gift_min || 0) * giftMultiplier;
        estimatedGiftMax += Number(g.estimated_gift_max || 0) * giftMultiplier;
      }
    });

    const seatedGuests = assignments.length;
    const unseatedGuests = totalInvited - seatedGuests;


    // Count guests by status
    let prezentaSiDarAdults = 0;
    let prezentaSiDarChildren = 0;
    let doarDarCount = 0;
    let incertitudineCount = 0;
    mainGuests.forEach((g) => {
      if (g.status === "prezenta_si_dar") {
        prezentaSiDarAdults += g.plus_one ? 2 : 1;
        prezentaSiDarChildren += g.children ? g.children.length : 0;
      } else if (g.status === "doar_dar") {
        doarDarCount += g.plus_one ? 2 : 1;
      } else if (g.status === "incertitudine") {
        incertitudineCount += g.plus_one ? 2 : 1;
      }
    });
    const seatedPersonCount = prezentaSiDarAdults + prezentaSiDarChildren;
    // Service staff with loc_la_masa
    const serviceStaffCount = services
      .filter((s) => s.type === "supplier" && s.loc_la_masa)
      .reduce((sum, s) => sum + Number(s.numar_persoane || 0), 0);

    // Fictitious menu cost for minimum menus
    const nrMinimMeniuri = Number(settings.nr_minim_meniuri) || 0;
    const procentPretMeniu = Number(settings.procent_pret_meniu ?? 100);
    const restaurant = services.find((s) => Boolean(s.is_restaurant));
    const pretPerMeniu = restaurant?.pret_per_invitat ? Number(restaurant.pret_per_invitat) : 0;
    const actualMenuCount = seatedPersonCount + serviceStaffCount;
    const menuDifference = Math.max(0, nrMinimMeniuri - actualMenuCount);
    const fictitiousMenuCost = menuDifference * pretPerMeniu * (procentPretMeniu / 100);

    const filteredServices = subtractExtra ? services.filter((s) => s.type !== "expense") : services;
    const restaurantMenuCount = seatedPersonCount + serviceStaffCount;
    const totalServiceCost = filteredServices.reduce(
      (sum, s) => {
        if (s.has_pret_per_invitat && s.pret_per_invitat != null) {
          // Restaurant uses seated guests + staff; other services use all invited
          const count = Boolean(s.is_restaurant) ? restaurantMenuCount : totalInvited;
          return sum + Number(s.pret_per_invitat) * count;
        }
        return sum + Number(s.pret);
      },
      0
    ) + fictitiousMenuCost;
    const totalAvans = filteredServices.reduce(
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
    const childrenMenu = rsvps
      .filter((r) => r.attending && r.children_menu)
      .length;

    const estimatedGift =
      estimatedGiftMin +
      (estimatedGiftMax - estimatedGiftMin) * (optimismLevel / 100);
    const giftVsCost = estimatedGift - totalServiceCost;

    // Gender distribution — plus_one pairs split as 1M + 1F
    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedCount = 0;
    mainGuests.forEach((g) => {
      if (g.plus_one) {
        // Couple: count 1 male + 1 female
        maleCount++;
        femaleCount++;
      } else {
        if (g.sex === "M") maleCount++;
        else if (g.sex === "F") femaleCount++;
        else unspecifiedCount++;
      }
    });

    // Quick stats
    const withPlusOne = mainGuests.filter((g) => g.plus_one).length;
    const withChildren = mainGuests.filter((g) => g.children && g.children.length > 0).length;
    const totalChildren = mainGuests.reduce((sum, g) => sum + (g.children ? g.children.length : 0), 0);
    const withSlug = mainGuests.filter((g) => g.slug).length;
    const servicesWithContract = services.filter(
      (s) => s.contract_path
    ).length;
    const servicesWithSeat = services.filter((s) => s.loc_la_masa).length;

    // Din partea distribution
    const dinPartea: Record<string, number> = {};
    mainGuests.forEach((g) => {
      const key = g.din_partea || "neatribuit";
      dinPartea[key] = (dinPartea[key] || 0) + 1;
    });

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
      childrenMenu,
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
      withChildren,
      totalChildren,
      dinPartea,
      daysUntilWedding,
      fictitiousMenuCost,
      menuDifference,
      restaurantMenuCount,
      // Debug data
      prezentaSiDarAdults,
      prezentaSiDarChildren,
      doarDarCount,
      incertitudineCount,
      seatedPersonCount,
      serviceStaffCount,
      nrMinimMeniuri,
      procentPretMeniu,
      pretPerMeniu,
      serviceCostBreakdown: filteredServices.map((s) => {
        const hasPPI = Boolean(s.has_pret_per_invitat) && s.pret_per_invitat != null;
        const isRest = Boolean(s.is_restaurant);
        const count = isRest ? restaurantMenuCount : totalInvited;
        const cost = hasPPI ? Number(s.pret_per_invitat) * count : Number(s.pret);
        return { name: s.nume, isRestaurant: isRest, hasPPI, ppiValue: Number(s.pret_per_invitat || 0), count, cost, avans: Number(s.avans || 0) };
      }),
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
    subtractExtra,
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
      <div className="flex items-center justify-between">
        <h1 className="serif-font text-2xl text-text-heading">
          Panou de comanda
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-light">
        {([
          { id: "sumar" as const, label: "Sumar" },
          { id: "financiar" as const, label: "Financiar" },
          { id: "invitati" as const, label: "Invitati" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              dashTab === tab.id
                ? "border-button text-text-heading"
                : "border-transparent text-text-muted hover:text-text-heading"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Row 1 - Key metrics (always visible) */}
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

      {dashTab === "sumar" && (<>
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
                  <Car size={20} weight="duotone" color="#3b82f6" />
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
                  <Leaf size={20} weight="duotone" color="#10b981" />
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
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Baby size={20} weight="duotone" color="#8b5cf6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-heading">
                    {stats.childrenMenu}
                  </p>
                  <p className="text-xs text-text-muted">
                    Meniu copii (confirmari)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>)}

      {dashTab === "financiar" && (<>
      {/* Global financial filters */}
      <div className="flex flex-wrap items-center gap-4">
        {cursEuro && (
          <button
            onClick={() => setShowEuro(!showEuro)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer font-medium ${
              showEuro
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-50 text-text-muted border-gray-200"
            }`}
          >
            {showEuro ? `EUR (1€ = ${cursEuro} RON)` : "RON"}
          </button>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={subtractAvans}
            onChange={(e) => setSubtractAvans(e.target.checked)}
            className="w-3.5 h-3.5 accent-accent cursor-pointer"
          />
          <span className="text-xs text-text-muted">Scade avansul</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={subtractExtra}
            onChange={(e) => setSubtractExtra(e.target.checked)}
            className="w-3.5 h-3.5 accent-accent cursor-pointer"
          />
          <span className="text-xs text-text-muted">Scade costuri personale</span>
        </label>
      </div>

      {/* Row 4 - Financial overview */}
      <div className="family-card">
        <h2 className="text-sm font-medium text-text-heading mb-5">
          Buget & servicii
        </h2>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">Cost total</span>
            <span className="text-sm font-medium text-text-heading">
              {formatPrice(stats.totalServiceCost)} {currency}
            </span>
          </div>
          {stats.fictitiousMenuCost > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-amber-600">incl. {stats.menuDifference} meniuri diferenta</span>
              <span className="text-xs text-amber-600">+{formatPrice(stats.fictitiousMenuCost)} {currency}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">Total avans</span>
            <span className="text-sm font-medium text-green-600">
              {formatPrice(stats.totalAvans)} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">{subtractAvans ? "Rest de plata" : "De achitat"}</span>
            <span className="text-sm font-medium text-red-600">
              {formatPrice(subtractAvans ? stats.remainingToPay : stats.totalServiceCost)} {currency}
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
        {/* Dar vs Servicii progress bar */}
        {stats.estimatedGift > 0 && (
          <div className="mt-4">
            {(() => {
              const costRef = subtractAvans ? stats.remainingToPay : stats.totalServiceCost;
              const darPct = costRef > 0 ? Math.min(100, Math.round((stats.estimatedGift / costRef) * 100)) : 0;
              const isPositive = stats.estimatedGift >= costRef;
              return (
                <>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Dar estimat vs. {subtractAvans ? "rest plata" : "cost total"}</span>
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>{darPct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isPositive ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${darPct}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        )}
        {/* Avans + Dar vs Cost total */}
        {stats.totalServiceCost > 0 && (
          <div className="mt-4">
            {(() => {
              const costRef = subtractAvans ? stats.remainingToPay : stats.totalServiceCost;
              const darPctSlice = costRef > 0 ? Math.min(100, Math.round((stats.estimatedGift / costRef) * 100)) : 0;
              const remaining = Math.max(0, costRef - stats.estimatedGift);
              if (subtractAvans) {
                return (
                  <>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Dar estimat vs. rest de plata</span>
                      <span className={darPctSlice >= 100 ? "text-green-600" : "text-text-heading"}>{darPctSlice}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${darPctSlice}%` }} />
                    </div>
                    <div className="flex gap-4 text-[10px] text-text-muted mt-1">
                      <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" />Dar ({formatPrice(Math.round(stats.estimatedGift))})</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gray-200" />Rest ({formatPrice(remaining)})</span>
                    </div>
                  </>
                );
              }
              const covered = stats.totalAvans + stats.estimatedGift;
              const coveredPct = Math.min(100, Math.round((covered / stats.totalServiceCost) * 100));
              const avansPctSlice = Math.round((stats.totalAvans / stats.totalServiceCost) * 100);
              const darSlice = Math.min(100 - avansPctSlice, Math.round((stats.estimatedGift / stats.totalServiceCost) * 100));
              return (
                <>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Acoperire cost total (avans + dar)</span>
                    <span className={coveredPct >= 100 ? "text-green-600" : "text-text-heading"}>{coveredPct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${avansPctSlice}%` }} />
                    <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${darSlice}%` }} />
                  </div>
                  <div className="flex gap-4 text-[10px] text-text-muted mt-1">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Avans ({formatPrice(stats.totalAvans)})</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" />Dar ({formatPrice(Math.round(stats.estimatedGift))})</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gray-200" />Rest ({formatPrice(Math.max(0, stats.totalServiceCost - covered))})</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        {/* Debug section */}
        <div className="mt-4 pt-3 border-t border-border-light">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] text-text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {showDebug ? "Ascunde detalii calcul" : "Detalii calcul"}
          </button>
          {showDebug && (
            <div className="mt-3 space-y-3 text-[11px] text-foreground/70 font-mono bg-background-soft/50 rounded-lg p-3">
              {/* Guest breakdown */}
              <div>
                <p className="text-text-muted font-sans font-medium mb-1 text-[10px] uppercase tracking-wider">Invitati per status</p>
                <p>Prezenta si dar: {stats.prezentaSiDarAdults} adulti + {stats.prezentaSiDarChildren} copii = {stats.seatedPersonCount} persoane</p>
                <p>Doar dar: {stats.doarDarCount} persoane (40% din estimare)</p>
                <p>Incertitudine: {stats.incertitudineCount} persoane (0% din estimare)</p>
                <p className="font-medium">Total invitati: {stats.totalInvited}</p>
              </div>

              {/* Restaurant menus */}
              <div>
                <p className="text-text-muted font-sans font-medium mb-1 text-[10px] uppercase tracking-wider">Calcul meniuri restaurant</p>
                <p>Invitati cu loc la masa: {stats.seatedPersonCount}</p>
                <p>Staff furnizori cu loc la masa: {stats.serviceStaffCount}</p>
                <p className="font-medium">Total meniuri reale: {stats.restaurantMenuCount}</p>
                {stats.nrMinimMeniuri > 0 && (
                  <>
                    <p className="mt-1">Nr. minim meniuri (din setari): {stats.nrMinimMeniuri}</p>
                    <p>Diferenta: max(0, {stats.nrMinimMeniuri} - {stats.restaurantMenuCount}) = {stats.menuDifference}</p>
                    {stats.menuDifference > 0 && (
                      <>
                        <p>Pret per meniu: {formatPrice(stats.pretPerMeniu)} {currency}</p>
                        <p>Procent aplicat: {stats.procentPretMeniu}%</p>
                        <p className="font-medium">Cost fictiv: {stats.menuDifference} x {formatPrice(stats.pretPerMeniu)} x {stats.procentPretMeniu}% = {formatPrice(stats.fictitiousMenuCost)} {currency}</p>
                      </>
                    )}
                  </>
                )}
                {stats.nrMinimMeniuri === 0 && <p className="text-text-muted italic">Nr. minim meniuri nu este configurat in setari.</p>}
              </div>

              {/* Per-service cost breakdown */}
              <div>
                <p className="text-text-muted font-sans font-medium mb-1 text-[10px] uppercase tracking-wider">Cost per serviciu</p>
                {stats.serviceCostBreakdown.map((s, i) => (
                  <div key={i} className="mb-1.5">
                    <p className="font-medium">{s.name} {s.isRestaurant ? "(restaurant)" : ""}</p>
                    {s.hasPPI ? (
                      <p className="pl-2">{formatPrice(s.ppiValue)} {currency}/buc x {s.count} = {formatPrice(s.cost)} {currency} {s.avans > 0 ? `(avans: ${formatPrice(s.avans)} ${currency})` : ""}</p>
                    ) : (
                      <p className="pl-2">Pret fix: {formatPrice(s.cost)} {currency} {s.avans > 0 ? `(avans: ${formatPrice(s.avans)} ${currency})` : ""}</p>
                    )}
                  </div>
                ))}
                {stats.fictitiousMenuCost > 0 && (
                  <div className="mb-1.5">
                    <p className="font-medium text-amber-600">Meniuri diferenta (fictiv)</p>
                    <p className="pl-2 text-amber-600">{stats.menuDifference} x {formatPrice(stats.pretPerMeniu)} x {stats.procentPretMeniu}% = {formatPrice(stats.fictitiousMenuCost)} {currency}</p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border-light pt-2">
                <p className="text-text-muted font-sans font-medium mb-1 text-[10px] uppercase tracking-wider">Totaluri</p>
                <p>Cost total servicii: {formatPrice(stats.totalServiceCost)} {currency}</p>
                <p>Total avans: {formatPrice(stats.totalAvans)} {currency}</p>
                <p>Rest de plata: {formatPrice(stats.remainingToPay)} {currency}</p>
                <p>Dar estimat (min): {formatPrice(stats.estimatedGiftMin)} {currency}</p>
                <p>Dar estimat (max): {formatPrice(stats.estimatedGiftMax)} {currency}</p>
                <p className="font-medium">Dar estimat (curent): {formatPrice(Math.round(stats.estimatedGift))} {currency}</p>
                <p className={stats.giftVsCost >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  Diferenta dar - cost: {stats.giftVsCost >= 0 ? "+" : ""}{formatPrice(Math.round(stats.giftVsCost))} {currency}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estimare dar - full width card */}
      <div className="family-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-heading">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Slider */}
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Pesimist</span>
              <span className="font-medium text-text-heading">{optimismLevel}%</span>
              <span>Optimist</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={optimismLevel}
              onChange={(e) => setOptimismLevel(Number(e.target.value))}
              className="w-full accent-accent h-2 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1.5">
              <span>Min: {formatPrice(stats.estimatedGiftMin)} {currency}</span>
              <span>Max: {formatPrice(stats.estimatedGiftMax)} {currency}</span>
            </div>
          </div>
          {/* Current value */}
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-heading">
              {formatPrice(Math.round(stats.estimatedGift))} {currency}
            </p>
          </div>
          {/* Comparison with cost */}
          {(() => {
            const costRef = subtractAvans ? stats.remainingToPay : stats.totalServiceCost;
            const diff = stats.estimatedGift - costRef;
            return (
              <div
                className={`text-center py-3 rounded-lg ${
                  diff >= 0
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <span className="text-sm font-medium">
                  {diff >= 0 ? "+" : ""}
                  {formatPrice(Math.round(diff))} {currency}
                </span>
                <span className="text-xs ml-1.5">vs. {subtractAvans ? "rest plata" : "cost servicii"}</span>
              </div>
            );
          })()}
        </div>
      </div>

      </>)}

      {dashTab === "invitati" && (<>
      {/* Row 5 - Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distributie */}
        <div className="family-card">
          <h2 className="text-sm font-medium text-text-heading mb-4">
            Distributie
          </h2>

          {/* Gen */}
          {(() => {
            const segments = [
              { label: "Barbati", count: stats.maleCount, color: "bg-blue-500" },
              { label: "Femei", count: stats.femaleCount, color: "bg-pink-500" },
            ].filter((s) => s.count > 0);
            const total = segments.reduce((sum, s) => sum + s.count, 0);
            if (total === 0) return null;
            return (
              <div className="mb-5">
                <h3 className="text-xs text-text-muted mb-3">Gen</h3>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  {segments.map((s) => (
                    <div key={s.label} className={`${s.color} transition-all duration-500`}
                      style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs text-text-muted">{s.label}</span>
                      <span className="text-xs font-medium text-text-heading">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Persoane */}
          {(() => {
            const singuri = mainGuests.filter((g) => !g.plus_one).length;
            const cupluri = stats.withPlusOne;
            const copii = stats.totalChildren;
            const total = singuri + cupluri + copii;
            if (total === 0) return null;
            const segments = [
              { label: "Singuri", count: singuri, color: "bg-emerald-500" },
              { label: "Cupluri (+1)", count: cupluri, color: "bg-indigo-500" },
              { label: "Copii", count: copii, color: "bg-amber-500" },
            ].filter((s) => s.count > 0);
            return (
              <div className="mb-5 pt-4 border-t border-border-light">
                <h3 className="text-xs text-text-muted mb-3">Persoane</h3>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  {segments.map((s) => (
                    <div key={s.label} className={`${s.color} transition-all duration-500`}
                      style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs text-text-muted">{s.label}</span>
                      <span className="text-xs font-medium text-text-heading">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Din partea */}
          {Object.keys(stats.dinPartea).length > 0 && (() => {
            const labels: Record<string, string> = {
              mire: "Mire", mireasa: "Mireasa", nasi: "Nasi",
              parintii_mire: "Par. mire", parintii_mireasa: "Par. mireasa",
              neatribuit: "Neatribuit",
            };
            const colors: Record<string, string> = {
              mire: "bg-blue-500", mireasa: "bg-pink-500", nasi: "bg-purple-500",
              parintii_mire: "bg-cyan-500", parintii_mireasa: "bg-rose-400",
              neatribuit: "bg-gray-300",
            };
            const entries = Object.entries(stats.dinPartea).sort((a, b) => b[1] - a[1]);
            const total = entries.reduce((sum, [, v]) => sum + v, 0);
            if (entries.length === 0) return null;
            return (
              <div className="pt-4 border-t border-border-light">
                <h3 className="text-xs text-text-muted mb-3">Din partea</h3>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  {entries.map(([key, count]) => (
                    <div key={key} className={`${colors[key] || "bg-gray-300"} transition-all duration-500`}
                      style={{ width: `${(count / total) * 100}%` }} title={`${labels[key] || key}: ${count}`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {entries.map(([key, count]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[key] || "bg-gray-300"}`} />
                      <span className="text-xs text-text-muted">{labels[key] || key}</span>
                      <span className="text-xs font-medium text-text-heading">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Statistici rapide */}
        <div className="family-card">
          <h2 className="text-sm font-medium text-text-heading mb-4">
            Statistici rapide
          </h2>
          <div className="space-y-4">
            {(() => {
              const totalWithSlug = mainGuests.filter((g) => g.slug).length;
              const openedCount = invitationLogs.filter((l) => l.open_count > 0).length;
              const bars = [
                { label: "Invitatii deschise", count: openedCount, total: totalWithSlug, color: "bg-purple-500" },
              ];
              return bars.map((b) => {
                const pct = b.total > 0 ? Math.round((b.count / b.total) * 100) : 0;
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{b.label}</span>
                      <span>{b.count}/{b.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Mini invitation logs table */}
          {(() => {
            const q = miniLogSearch.toLowerCase().trim();
            const sorted = [...invitationLogs]
              .filter((l) => l.open_count > 0)
              .filter((l) => !q || l.prenume.toLowerCase().includes(q) || l.nume.toLowerCase().includes(q))
              .sort((a, b) => new Date(b.last_open_at || 0).getTime() - new Date(a.last_open_at || 0).getTime())
              .slice(0, 3);
            return (
              <div className="mt-4 pt-4 border-t border-border-light">
                <input
                  type="text"
                  value={miniLogSearch}
                  onChange={(e) => setMiniLogSearch(e.target.value)}
                  placeholder="Cauta invitat..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-accent transition-colors mb-3"
                />
                {sorted.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-2">{q ? "Niciun rezultat" : "Nicio invitatie deschisa"}</p>
                ) : (
                  <div className="space-y-2">
                    {sorted.map((l) => (
                      <div key={l.guest_id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-text-heading">{l.prenume} {l.nume}</p>
                          <p className="text-[10px] text-text-muted">{l.last_open_at ? relativeTime(l.last_open_at) : "\u2014"}</p>
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{l.open_count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Row: Invitation analytics table ── */}
      {invitationLogs.length > 0 && (() => {
        const LOG_PAGE_SIZE = 5;
        const logSearch = logSearchState;
        const filtered = invitationLogs.filter((l) => {
          if (!logSearch.trim()) return true;
          const q = logSearch.toLowerCase();
          return l.prenume.toLowerCase().includes(q) || l.nume.toLowerCase().includes(q) || (l.slug && l.slug.toLowerCase().includes(q));
        }).sort((a, b) => b.open_count - a.open_count);
        const totalLogPages = Math.max(1, Math.ceil(filtered.length / LOG_PAGE_SIZE));
        const safeLogPage = Math.min(logPage, totalLogPages);
        const paginated = filtered.slice((safeLogPage - 1) * LOG_PAGE_SIZE, safeLogPage * LOG_PAGE_SIZE);
        const maxCount = Math.max(...invitationLogs.map((l) => l.open_count), 1);
        return (
          <div className="family-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-text-heading">Vizualizari invitatii</h2>
              <span className="text-xs text-text-muted">{invitationLogs.length} invitatii deschise</span>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={logSearchState}
                onChange={(e) => { setLogSearchState(e.target.value); setLogPage(1); }}
                placeholder="Cauta dupa nume..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Invitat</th>
                    <th className="text-center px-3 py-2 text-xs text-text-muted font-medium">Vizualizari</th>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Ultima deschidere</th>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((l) => (
                    <tr key={l.guest_id} className="border-b border-border-light/50">
                      <td className="px-3 py-2.5">
                        <span className="text-text-heading font-medium">{l.prenume} {l.nume}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(l.open_count / maxCount) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-text-heading w-6 text-right">{l.open_count}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-text-muted">
                        {l.last_open_at ? relativeTime(l.last_open_at) : "\u2014"}
                      </td>
                      <td className="px-3 py-2.5">
                        {l.device ? <span className="text-[10px] bg-gray-100 text-text-muted px-1.5 py-0.5 rounded">{l.device}</span> : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalLogPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <button onClick={() => setLogPage(Math.max(1, safeLogPage - 1))} disabled={safeLogPage === 1}
                  className="px-2 py-1 text-xs rounded border border-border-light text-text-muted hover:bg-background-soft disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default">&lsaquo;</button>
                {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setLogPage(p)}
                    className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${p === safeLogPage ? "bg-button text-white border-button" : "border-border-light text-text-muted hover:bg-background-soft"}`}>{p}</button>
                ))}
                <button onClick={() => setLogPage(Math.min(totalLogPages, safeLogPage + 1))} disabled={safeLogPage === totalLogPages}
                  className="px-2 py-1 text-xs rounded border border-border-light text-text-muted hover:bg-background-soft disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default">&rsaquo;</button>
              </div>
            )}
          </div>
        );
      })()}
      </>)}

      {/* ── Row 6: Cost per invitat (financiar tab) ── */}
      {dashTab === "financiar" && (<>
      {/* ── Cost per invitat ── */}
      {services.length > 0 && stats.totalInvited > 0 && (
        <div className="family-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-wide text-text-muted">
              Cost per invitat
            </h3>
            <input
              type="text"
              value={costSearch}
              onChange={(e) => setCostSearch(e.target.value)}
              placeholder="Cauta cost..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-accent transition-colors w-40"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {(subtractExtra ? services.filter((s) => s.type !== "expense") : services)
              .filter((s) => !costSearch.trim() || s.nume.toLowerCase().includes(costSearch.toLowerCase()))
              .map((s) => {
              const hasPPI = Boolean(s.has_pret_per_invitat) && s.pret_per_invitat != null;
              const isRest = Boolean(s.is_restaurant);
              const count = isRest ? stats.restaurantMenuCount : stats.totalInvited;
              const pret = hasPPI ? Number(s.pret_per_invitat) * count : Number(s.pret);
              const avans = Number(s.avans || 0);
              const suma = subtractAvans ? pret - avans : pret;
              const perGuest = suma / stats.totalInvited;
              return (
                <div key={s.id} className="rounded-lg border border-border-light p-3">
                  <p className="text-sm font-medium text-text-heading mb-2 truncate">
                    {s.nume}
                    {hasPPI && <span className="text-[10px] text-purple-600 ml-1.5 font-normal">{isRest ? "per meniu" : "per invitat"}</span>}
                  </p>
                  <div className="space-y-1 text-xs">
                    {hasPPI && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">{isRest ? "Pret/meniu" : "Pret/invitat"}</span>
                        <span className="text-purple-600">{formatPrice(Number(s.pret_per_invitat))} {currency} × {count}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-muted">{hasPPI ? "Pret calculat" : "Pret total"}</span>
                      <span className="text-foreground">{formatPrice(pret)} {currency}</span>
                    </div>
                    {subtractAvans && avans > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Avans platit</span>
                        <span className="text-green-600">-{formatPrice(avans)} {currency}</span>
                      </div>
                    )}
                    {subtractAvans && (
                      <div className="flex justify-between border-t border-border-light pt-1">
                        <span className="text-text-muted">Rest de plata</span>
                        <span className="font-medium text-foreground">{formatPrice(suma)} {currency}</span>
                      </div>
                    )}
                    <div className={`flex justify-between bg-background-soft rounded px-2 py-1.5 ${subtractAvans ? "mt-1" : ""}`}>
                      <span className="text-text-muted">Per invitat</span>
                      <span className="font-semibold text-text-heading">{formatPrice(Math.ceil(perGuest))} {currency}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Total card */}
          {(() => {
            const totalSum = subtractAvans ? stats.remainingToPay : stats.totalServiceCost;
            return (
              <div className="rounded-xl border-2 border-button/30 bg-button/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-heading">Total servicii</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {subtractAvans ? "Rest de plata" : "Cost total"}: {formatPrice(totalSum)} {currency} / {stats.totalInvited} invitati
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-text-heading">
                      {formatPrice(Math.ceil(totalSum / stats.totalInvited))} {currency}
                    </p>
                    <p className="text-xs text-text-muted">per invitat</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </>)}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
