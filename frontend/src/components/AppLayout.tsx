import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { AnimatedPage } from "./AnimatedPage";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useTheme } from "../ThemeContext";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const SIDEBAR_START_COLLAPSED_KEY = "settings-sidebar-start-collapsed";

export function AppLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      if (localStorage.getItem(SIDEBAR_START_COLLAPSED_KEY) === "true") return true;
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  useDocumentTitle(location.pathname);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed)); }
    catch {}
  }, [sidebarCollapsed]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const BG = isDark ? "#0c0c0c" : "#fafafa";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          layoutKey="desktop"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      )}

      {/* Mobile drawer */}
      <div className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200 ease-out"
        style={{ transform: drawerOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <Sidebar layoutKey="mobile" onClose={() => setDrawerOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: BG }}>

        {/* Header — same bg as content, just a thin bottom border */}
        <header className="flex-shrink-0 h-11 flex items-center gap-3 px-5"
          style={{
            background: BG,
            borderBottom: `1px solid ${borderColor}`,
          }}>
          <button type="button" aria-label="Open menu"
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}
            onClick={() => setDrawerOpen(true)}>
            <Menu size={17} />
          </button>
          <div className="flex-1" />
          <GlobalSearch />
        </header>

        {/* Content */}
        <main id="main-content" role="main"
          className="flex-1 min-w-0 overflow-y-auto w-full"
          style={{ background: BG }}>
          <AnimatedPage key={location.pathname}>
            <div className="w-full min-w-0 min-h-full box-border">
              <Outlet />
            </div>
          </AnimatedPage>
        </main>
      </div>
    </div>
  );
}