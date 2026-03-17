"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
export const PAGE_SIZE = 10;

export interface RsvpEntry {
  id: number;
  person_count: number;
  name: string;
  partner_name: string | null;
  message: string | null;
  attending: boolean;
  created_at: string;
}

export interface Guest {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  slug: string | null;
  sex: "M" | "F" | null;
  partner_id: number | null;
  created_at: string;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function forceAdminTextColors() {
  const root = document.documentElement;
  root.style.setProperty("--color-text-heading", "#1a1a1a");
  root.style.setProperty("--color-foreground", "#333333");
  root.style.setProperty("--color-text-muted", "#666666");
  root.style.setProperty("--color-dark", "#000000");
}

// ─── Pagination ──────────────────────────────────────────

export function Pagination({
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

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
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

export function FilterButton({
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
