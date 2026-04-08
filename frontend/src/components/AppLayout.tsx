import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { AnimatedPage } from "./AnimatedPage";
import { Menu, Wifi } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { VtopSyncModal } from "./vtop/VtopSyncModal";
import { useTheme } from "../ThemeContext";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const SIDEBAR_START_COLLAPSED_KEY = "settings-sidebar-start-collapsed";
const DEFAULT_WIDTH = 264;
const COLLAPSED_WIDTH = 56;
const MIN_WIDTH = 60;
const MAX_WIDTH = 320;

export function AppLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed));
      }
      if (localStorage.getItem(SIDEBAR_START_COLLAPSED_KEY) === "true") return COLLAPSED_WIDTH;
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true") return COLLAPSED_WIDTH;
      return DEFAULT_WIDTH;
    } catch { return DEFAULT_WIDTH; }
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(sidebarWidth);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const location = useLocation();

  useEffect(() => { sidebarWidthRef.current = sidebarWidth; }, [sidebarWidth]);

  useDocumentTitle(location.pathname);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); }
    catch {}
  }, [sidebarWidth]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidthRef.current;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - dragStartX.current;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    }

    function onMouseUp() {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function handleToggleCollapse() {
    setSidebarWidth(w => w <= 80 ? DEFAULT_WIDTH : COLLAPSED_WIDTH);
  }

  const BG = isDark ? "#0c0c0c" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const [vtopOpen, setVtopOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 relative">
        <Sidebar
          layoutKey="desktop"
          width={sidebarWidth}
          isResizing={isResizing}
          onToggleCollapse={handleToggleCollapse}
        />
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 h-full z-20 group"
          style={{ width: 6, cursor: "col-resize" }}
          onMouseDown={handleResizeStart}
          onDoubleClick={() => setSidebarWidth(DEFAULT_WIDTH)}
        >
          <div
            className="absolute top-0 right-0 h-full w-px transition-colors duration-150"
            style={{
              background: isResizing
                ? "#E87040"
                : "transparent",
            }}
          />
          <div
            className="absolute top-0 right-0 h-full w-px opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}
          />
        </div>
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: BG }}>

        {/* Header */}
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
          <button
            type="button"
            onClick={() => setVtopOpen(true)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[12px] font-medium transition-all shrink-0"
            style={{
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <Wifi size={13} />
            <span className="hidden sm:inline">VTOP Sync</span>
          </button>
          <GlobalSearch />
        </header>
        <VtopSyncModal open={vtopOpen} onClose={() => setVtopOpen(false)} />

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
