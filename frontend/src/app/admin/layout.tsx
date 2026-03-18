"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWeddingSettings, applyThemeColors } from "@/utils/settings";
import { AdminAuthContext } from "./_context";
import { API_URL, forceAdminTextColors } from "./_shared";
import { FormEvent } from "react";

// ─── Login Form ──────────────────────────────────────────

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
      localStorage.setItem("admin_token", token);
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

// ─── Sidebar Nav Items ───────────────────────────────────

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/admin/dashboard",
    label: "Panou de comanda",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/guests",
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
    href: "/admin/confirmari",
    label: "Confirmari",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    href: "/admin/mese",
    label: "Mese",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/servicii",
    label: "Costuri",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12.01" />
      </svg>
    ),
  },
  {
    href: "/admin/setari",
    label: "Setari",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ─── Admin Layout ────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
    }
    setChecked(true);
    fetchWeddingSettings().then((s) => {
      applyThemeColors(s);
      forceAdminTextColors();
    });
  }, []);

  // Redirect /admin to /admin/guests when authenticated
  useEffect(() => {
    if (checked && token && pathname === "/admin") {
      router.replace("/admin/guests");
    }
  }, [checked, token, pathname, router]);

  function handleLogin(jwt: string) {
    setToken(jwt);
    router.replace("/admin/guests");
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setToken("");
  }

  function handleUnauth() {
    localStorage.removeItem("admin_token");
    setToken("");
  }

  // Don't render anything until we've checked localStorage
  if (!checked) return null;

  // Show login if no token
  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <AdminAuthContext.Provider value={{ token, onUnauth: handleUnauth, handleLogout }}>
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

        {/* Sidebar - fixed pe desktop ca sa ramana vizibil la scroll */}
        <aside className={`fixed top-0 left-0 h-full w-60 bg-background border-r border-border-light z-50
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:z-20`}>
          <div className="px-6 py-6 border-b border-border-light">
            <h1 className="script-font text-2xl text-text-heading">Ade & Cristi</h1>
            <p className="text-[0.6rem] tracking-widest uppercase text-text-muted mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors
                    ${isActive
                      ? "bg-background-soft text-text-heading font-medium"
                      : "text-text-muted hover:text-text-heading hover:bg-background-soft/50"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-border-light space-y-1">
            <button onClick={() => { window.location.reload(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-heading hover:bg-background-soft/50 transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Reincarca
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-heading hover:bg-background-soft/50 transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Deconectare
            </button>
          </div>
        </aside>

        {/* Main content - ml-60 pe desktop ca sa nu se ascunda sub meniul fixed */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-60">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </AdminAuthContext.Provider>
  );
}
