"use client";

import { Suspense, useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../_context";
import { API_URL, authHeaders, SearchInput, FilterButton, Pagination, PAGE_SIZE } from "../_shared";
import { useTabParam } from "@/hooks/useTabParam";
import { Wine, Coffee, ForkKnife, CookingPot, BowlFood, IceCream, Eye, PencilSimple, Trash } from "@phosphor-icons/react";

// ─── Types ──────────────────────────────────────────────

interface TableSettings {
  numar_mese: number | null;
  max_persoane_masa: number | null;
}

interface TableAssignment {
  guest_id: number;
  table_number: number;
}

interface ServiceAssignment {
  service_id: number;
  table_number: number;
  numar_persoane: number;
}

interface SimpleGuest {
  id: number;
  plus_one: boolean;
  partner_id: number | null;
  children: { id?: number }[];
}

interface BarItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "alcoolic" | "non_alcoolic";
  ordine: number;
  created_at: string;
}

interface MenuItem {
  id: number;
  titlu: string;
  descriere: string | null;
  categorie: "aperitiv" | "fel_principal" | "fel_secundar" | "desert";
  ordine: number;
  created_at: string;
}

// ─── Category Icons (SVG inline) ────────────────────────

const BAR_CATEGORY_ICONS: Record<BarItem["categorie"], React.ReactNode> = {
  alcoolic: <Wine size={16} weight="duotone" />,
  non_alcoolic: <Coffee size={16} weight="duotone" />,
};

const MENU_CATEGORY_ICONS: Record<MenuItem["categorie"], React.ReactNode> = {
  aperitiv: <ForkKnife size={16} weight="duotone" />,
  fel_principal: <CookingPot size={16} weight="duotone" />,
  fel_secundar: <BowlFood size={16} weight="duotone" />,
  desert: <IceCream size={16} weight="duotone" />,
};

const BAR_CATEGORY_LABELS: Record<BarItem["categorie"], string> = {
  alcoolic: "Alcoolic",
  non_alcoolic: "Non-alcoolic",
};

const MENU_CATEGORY_LABELS: Record<MenuItem["categorie"], string> = {
  aperitiv: "Aperitiv",
  fel_principal: "Fel principal",
  fel_secundar: "Fel secundar",
  desert: "Desert",
};

// ─── CRUD List Component ────────────────────────────────

function CrudList<T extends { id: number; titlu: string; descriere: string | null; categorie: string; ordine: number }>({
  items,
  categoryLabels,
  categoryIcons,
  categoryFilter,
  setCategoryFilter,
  categories,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onPreview,
  entityName,
}: {
  items: T[];
  categoryLabels: Record<string, string>;
  categoryIcons: Record<string, React.ReactNode>;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: string[];
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onPreview: () => void;
  entityName: string;
}) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = items;
    if (categoryFilter !== "all") result = result.filter((i) => i.categorie === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.titlu.toLowerCase().includes(q) || (i.descriere && i.descriere.toLowerCase().includes(q)));
    }
    return result;
  }, [items, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const categoryBadgeColors: Record<string, string> = {
    alcoolic: "bg-purple-100 text-purple-700",
    non_alcoolic: "bg-sky-100 text-sky-700",
    aperitiv: "bg-amber-100 text-amber-700",
    fel_principal: "bg-red-100 text-red-700",
    fel_secundar: "bg-blue-100 text-blue-700",
    desert: "bg-pink-100 text-pink-700",
  };

  return (
    <div>
      {/* Header with add + preview buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onAdd}
          className="bg-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
          + Adauga {entityName}
        </button>
        {items.length > 0 && (
          <button onClick={onPreview}
            className="border border-button text-button px-4 py-2 rounded-lg text-sm font-medium hover:bg-button/5 transition-colors cursor-pointer flex items-center gap-2">
            <Eye size={16} weight="bold" />
            Preview & Download
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {categories.map((cat) => {
          const count = items.filter((i) => i.categorie === cat).length;
          return (
            <div key={cat} className="family-card px-3 py-2.5 flex items-center gap-2">
              <span className="text-text-muted">{categoryIcons[cat]}</span>
              <div>
                <p className="text-lg font-light text-text-heading leading-tight">{count}</p>
                <p className="text-[10px] text-text-muted">{categoryLabels[cat]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Cauta dupa titlu sau descriere..." />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterButton label="Toate" active={categoryFilter === "all"} count={items.length} onClick={() => setCategoryFilter("all")} />
          {categories.map((cat) => (
            <FilterButton key={cat} label={categoryLabels[cat]} active={categoryFilter === cat}
              count={items.filter((i) => i.categorie === cat).length}
              onClick={() => setCategoryFilter(cat)} />
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="family-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              {search || categoryFilter !== "all" ? "Niciun rezultat gasit." : `Niciun ${entityName} adaugat.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light/50">
            {paginated.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-text-muted mt-0.5 shrink-0">{categoryIcons[item.categorie]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-heading">{item.titlu}</p>
                    {item.descriere && (
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.descriere}</p>
                    )}
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${categoryBadgeColors[item.categorie] || "bg-gray-100 text-gray-600"}`}>
                      {categoryLabels[item.categorie]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => onEdit(item)}
                    className="text-foreground/50 hover:text-accent transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50"
                    title="Editeaza">
                    <PencilSimple size={16} weight="bold" />
                  </button>
                  <button onClick={() => onDelete(item)}
                    className="text-foreground/50 hover:text-accent-rose transition-colors cursor-pointer p-2 rounded-lg hover:bg-background-soft/50"
                    title="Sterge">
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <p className="text-xs text-text-muted">
          {filtered.length} din {items.length} {entityName === "item bar" ? "bauturi" : "preparate"}
        </p>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Form Modal ─────────────────────────────────────────

function ItemFormModal<C extends string>({
  show,
  onClose,
  onSave,
  saving,
  editItem,
  categories,
  categoryLabels,
  entityName,
}: {
  show: boolean;
  onClose: () => void;
  onSave: (data: { titlu: string; descriere: string; categorie: C; ordine: number }) => void;
  saving: boolean;
  editItem: { titlu: string; descriere: string | null; categorie: C; ordine: number } | null;
  categories: C[];
  categoryLabels: Record<C, string>;
  entityName: string;
}) {
  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [categorie, setCategorie] = useState<C>(categories[0]);
  const [ordine, setOrdine] = useState(0);

  useEffect(() => {
    if (editItem) {
      setTitlu(editItem.titlu);
      setDescriere(editItem.descriere || "");
      setCategorie(editItem.categorie);
      setOrdine(editItem.ordine);
    } else {
      setTitlu("");
      setDescriere("");
      setCategorie(categories[0]);
      setOrdine(0);
    }
  }, [editItem, categories]);

  if (!show) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ titlu, descriere, categorie, ordine });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="p-5 pb-3">
          <h3 className="serif-font text-lg text-text-heading">
            {editItem ? `Editeaza ${entityName}` : `${entityName[0].toUpperCase() + entityName.slice(1)} nou`}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 overflow-y-auto flex-1 space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Titlu</label>
              <input type="text" value={titlu} onChange={(e) => setTitlu(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Descriere</label>
              <textarea value={descriere} onChange={(e) => setDescriere(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Categorie</label>
              <div className="flex rounded-lg border border-border-light overflow-hidden">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setCategorie(cat)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      categorie === cat ? "bg-button text-white" : "bg-background-soft text-text-muted hover:text-text-heading"
                    }`}>
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Ordine (0 = implicit)</label>
              <input type="number" value={ordine} onChange={(e) => setOrdine(Number(e.target.value))} min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>
          <div className="sticky bottom-0 p-5 pt-3 bg-white border-t border-border-light rounded-b-xl flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-button text-white py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? "Se salveaza..." : "Salveaza"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer">
              Anuleaza
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ───────────────────────────────

function DeleteModal({ item, onClose, onDelete, deleting }: {
  item: { titlu: string } | null;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl w-full max-w-xs flex flex-col">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash size={24} weight="bold" className="text-red-600" />
          </div>
          <h3 className="serif-font text-lg text-text-heading mb-2">Sterge</h3>
          <p className="text-sm text-text-muted mb-1">Esti sigur ca vrei sa stergi</p>
          <p className="text-sm font-medium text-text-heading">{item.titlu}?</p>
        </div>
        <div className="p-5 pt-0 flex gap-3 border-t border-border-light">
          <button onClick={onClose}
            className="flex-1 border border-border py-2.5 rounded-lg text-sm text-foreground hover:bg-background-soft transition-colors cursor-pointer mt-3">
            Anuleaza
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer mt-3">
            {deleting ? "Se sterge..." : "Sterge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mese Tab ───────────────────────────────────────────

function getTableOccupancyColor(count: number, max: number | null): string {
  if (count === 0) return "bg-green-50 text-green-700 border-green-300";
  if (!max || max <= 0) return "bg-amber-50 text-amber-700 border-amber-300";
  const ratio = count / max;
  if (ratio < 0.5) return "bg-green-100 text-green-800 border-green-400";
  if (ratio < 0.75) return "bg-amber-100 text-amber-800 border-amber-400";
  if (ratio < 1) return "bg-orange-100 text-orange-800 border-orange-400";
  return "bg-red-100 text-red-800 border-red-400";
}

function MeseTab() {
  const { token, onUnauth } = useAdminAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<TableSettings | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]);
  const [guests, setGuests] = useState<SimpleGuest[]>([]);

  useEffect(() => {
    (async () => {
      const [settingsRes, guestsRes, assignRes] = await Promise.all([
        fetch(`${API_URL}/api/wedding-settings`),
        fetch(`${API_URL}/api/admin/guests`, { headers: authHeaders(token) }),
        fetch(`${API_URL}/api/admin/table-assignments`, { headers: authHeaders(token) }),
      ]);
      if (guestsRes.status === 401 || assignRes.status === 401) { onUnauth(); return; }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings({ numar_mese: s.numar_mese, max_persoane_masa: s.max_persoane_masa });
      }
      if (guestsRes.ok) setGuests(await guestsRes.json());
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.guests || []);
        setServiceAssignments(data.services || []);
      }
    })();
  }, [token, onUnauth]);

  // Count people per table
  const tableCounts = useMemo(() => {
    const counts = new Map<number, number>();
    const partnerIds = new Set(guests.filter((g) => g.partner_id && g.plus_one).map((g) => g.partner_id));
    const mainGuests = guests.filter((g) => !partnerIds.has(g.id));

    assignments.forEach((a) => {
      const guest = mainGuests.find((g) => g.id === a.guest_id);
      if (!guest) return;
      const people = (guest.plus_one ? 2 : 1) + (guest.children ? guest.children.length : 0);
      counts.set(a.table_number, (counts.get(a.table_number) || 0) + people);
    });

    serviceAssignments.forEach((sa) => {
      counts.set(sa.table_number, (counts.get(sa.table_number) || 0) + sa.numar_persoane);
    });

    return counts;
  }, [guests, assignments, serviceAssignments]);

  if (!settings) return <p className="text-sm text-text-muted text-center py-8">Se incarca...</p>;

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

  return (
    <div>
      <p className="text-sm text-text-muted mb-2">Selecteaza o masa pentru a genera un design de afis.</p>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" /> Goala
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block" /> Partial
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-400 inline-block" /> Aproape plina
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" /> Plina
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
        {Array.from({ length: settings.numar_mese! }, (_, i) => i + 1).map((n) => {
          const count = tableCounts.get(n) || 0;
          const colorClass = selectedTable === n
            ? "bg-button text-white border-button"
            : getTableOccupancyColor(count, settings.max_persoane_masa);
          return (
            <button
              key={n}
              onClick={() => setSelectedTable(n)}
              className={`py-3 rounded-lg text-sm font-medium cursor-pointer transition-colors border ${colorClass}`}
            >
              <span className="block">{n}</span>
              <span className="block text-[10px] opacity-70">{count}p</span>
            </button>
          );
        })}
      </div>

      {selectedTable && (
        <div className="text-center">
          <button
            onClick={() => router.push(`/admin/assets/preview-mese?table=${selectedTable}`)}
            className="bg-button text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Eye size={16} weight="bold" />
            Preview Masa {selectedTable}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Assets Page ───────────────────────────────────

function AssetsContent() {
  const { token, onUnauth } = useAdminAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useTabParam("tab", "mese", ["mese", "bar", "meniu"] as const);

  // Bar items state
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [barSearch, setBarSearch] = useState("");
  const [barFilter, setBarFilter] = useState("all");
  const [barShowForm, setBarShowForm] = useState(false);
  const [barEditItem, setBarEditItem] = useState<BarItem | null>(null);
  const [barDeleteItem, setBarDeleteItem] = useState<BarItem | null>(null);
  const [barSaving, setBarSaving] = useState(false);
  const [barDeleting, setBarDeleting] = useState(false);

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState("all");
  const [menuShowForm, setMenuShowForm] = useState(false);
  const [menuEditItem, setMenuEditItem] = useState<MenuItem | null>(null);
  const [menuDeleteItem, setMenuDeleteItem] = useState<MenuItem | null>(null);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuDeleting, setMenuDeleting] = useState(false);

  const fetchBarItems = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/bar-items`, { headers: authHeaders(token) });
    if (res.status === 401) { onUnauth(); return; }
    if (res.ok) setBarItems(await res.json());
  }, [token, onUnauth]);

  const fetchMenuItems = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/menu-items`, { headers: authHeaders(token) });
    if (res.status === 401) { onUnauth(); return; }
    if (res.ok) setMenuItems(await res.json());
  }, [token, onUnauth]);

  useEffect(() => {
    fetchBarItems();
    fetchMenuItems();
  }, [fetchBarItems, fetchMenuItems]);

  // Bar CRUD
  async function handleBarSave(data: { titlu: string; descriere: string; categorie: BarItem["categorie"]; ordine: number }) {
    setBarSaving(true);
    const method = barEditItem ? "PUT" : "POST";
    const url = barEditItem
      ? `${API_URL}/api/admin/bar-items/${barEditItem.id}`
      : `${API_URL}/api/admin/bar-items`;
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(data) });
    setBarSaving(false);
    setBarShowForm(false);
    setBarEditItem(null);
    fetchBarItems();
  }

  async function handleBarDelete() {
    if (!barDeleteItem) return;
    setBarDeleting(true);
    await fetch(`${API_URL}/api/admin/bar-items/${barDeleteItem.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setBarDeleting(false);
    setBarDeleteItem(null);
    fetchBarItems();
  }

  // Menu CRUD
  async function handleMenuSave(data: { titlu: string; descriere: string; categorie: MenuItem["categorie"]; ordine: number }) {
    setMenuSaving(true);
    const method = menuEditItem ? "PUT" : "POST";
    const url = menuEditItem
      ? `${API_URL}/api/admin/menu-items/${menuEditItem.id}`
      : `${API_URL}/api/admin/menu-items`;
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(data) });
    setMenuSaving(false);
    setMenuShowForm(false);
    setMenuEditItem(null);
    fetchMenuItems();
  }

  async function handleMenuDelete() {
    if (!menuDeleteItem) return;
    setMenuDeleting(true);
    await fetch(`${API_URL}/api/admin/menu-items/${menuDeleteItem.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setMenuDeleting(false);
    setMenuDeleteItem(null);
    fetchMenuItems();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-font text-2xl text-text-heading">Resurse</h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-light mb-6">
        {([
          { id: "mese" as const, label: "Mese" },
          { id: "bar" as const, label: "Bar" },
          { id: "meniu" as const, label: "Meniu" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-button text-text-heading"
                : "border-transparent text-text-muted hover:text-text-heading"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mese Tab */}
      {activeTab === "mese" && <MeseTab />}

      {/* Bar Tab */}
      {activeTab === "bar" && (
        <>
          <CrudList
            items={barItems}
            categoryLabels={BAR_CATEGORY_LABELS}
            categoryIcons={BAR_CATEGORY_ICONS}
            categoryFilter={barFilter}
            setCategoryFilter={setBarFilter}
            categories={["alcoolic", "non_alcoolic"]}
            search={barSearch}
            setSearch={setBarSearch}
            onAdd={() => { setBarEditItem(null); setBarShowForm(true); }}
            onEdit={(item) => { setBarEditItem(item as BarItem); setBarShowForm(true); }}
            onDelete={(item) => setBarDeleteItem(item as BarItem)}
            onPreview={() => router.push("/admin/assets/preview-bar")}
            entityName="item bar"
          />
          <ItemFormModal
            show={barShowForm}
            onClose={() => { setBarShowForm(false); setBarEditItem(null); }}
            onSave={handleBarSave}
            saving={barSaving}
            editItem={barEditItem}
            categories={["alcoolic", "non_alcoolic"] as BarItem["categorie"][]}
            categoryLabels={BAR_CATEGORY_LABELS}
            entityName="item bar"
          />
          <DeleteModal
            item={barDeleteItem}
            onClose={() => setBarDeleteItem(null)}
            onDelete={handleBarDelete}
            deleting={barDeleting}
          />
        </>
      )}

      {/* Meniu Tab */}
      {activeTab === "meniu" && (
        <>
          <CrudList
            items={menuItems}
            categoryLabels={MENU_CATEGORY_LABELS}
            categoryIcons={MENU_CATEGORY_ICONS}
            categoryFilter={menuFilter}
            setCategoryFilter={setMenuFilter}
            categories={["aperitiv", "fel_principal", "fel_secundar", "desert"]}
            search={menuSearch}
            setSearch={setMenuSearch}
            onAdd={() => { setMenuEditItem(null); setMenuShowForm(true); }}
            onEdit={(item) => { setMenuEditItem(item as MenuItem); setMenuShowForm(true); }}
            onDelete={(item) => setMenuDeleteItem(item as MenuItem)}
            onPreview={() => router.push("/admin/assets/preview-meniu")}
            entityName="preparat"
          />
          <ItemFormModal
            show={menuShowForm}
            onClose={() => { setMenuShowForm(false); setMenuEditItem(null); }}
            onSave={handleMenuSave}
            saving={menuSaving}
            editItem={menuEditItem}
            categories={["aperitiv", "fel_principal", "fel_secundar", "desert"] as MenuItem["categorie"][]}
            categoryLabels={MENU_CATEGORY_LABELS}
            entityName="preparat"
          />
          <DeleteModal
            item={menuDeleteItem}
            onClose={() => setMenuDeleteItem(null)}
            onDelete={handleMenuDelete}
            deleting={menuDeleting}
          />
        </>
      )}
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>Se incarca...</div>}>
      <AssetsContent />
    </Suspense>
  );
}
