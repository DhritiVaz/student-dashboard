import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { AnimatedPage } from "./AnimatedPage";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  useDocumentTitle(location.pathname);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#000" }}>
      {/* Skip to main content for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ── Desktop sidebar (black, collapsible) ───────────────────────────── */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          layoutKey="desktop"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-250 ease-out"
        style={{ transform: drawerOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <Sidebar layoutKey="mobile" onClose={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main area: full width content ────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "#000" }}
      >
        <div
          className="flex-1 flex flex-col overflow-hidden border border-black"
          style={{ background: "#0e0e0e", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}
        >
          {/* Header */}
          <header
            className="flex-shrink-0 h-12 flex items-center gap-3 px-4 sm:px-6"
            style={{
              background: "#111111",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} aria-hidden />
            </button>

            <div className="flex-1" />
            <GlobalSearch />
          </header>

          {/* Scrollable content */}
          <main
            id="main-content"
            role="main"
            className="flex-1 overflow-y-auto"
            style={{ background: "#0e0e0e" }}
          >
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </main>
        </div>
      </div>
    </div>
  );
}
