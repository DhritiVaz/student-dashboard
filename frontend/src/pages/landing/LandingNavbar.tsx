import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg = scrolled ? (isDark ? "rgba(10,10,10,0.9)" : "rgba(245,244,242,0.9)") : "transparent";
  const border = scrolled ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent";
  const logoColor = isDark ? "#ffffff" : "#111827";
  const linkColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  const linkHoverColor = isDark ? "#ffffff" : "#111827";
  const primaryBtnBg = isDark ? "#ffffff" : "#111827";
  const primaryBtnColor = isDark ? "#0a0a0a" : "#ffffff";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out"
      style={{
        background: bg,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg" style={{ color: logoColor }}>
          Student Dashboard
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: linkColor }}
            onMouseEnter={(e) => (e.currentTarget.style.color = linkHoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-input text-sm font-semibold transition-all duration-150"
            style={{ background: primaryBtnBg, color: primaryBtnColor }}
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-input transition-colors"
          style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t"
            style={{ background: isDark ? "#0a0a0a" : "#f5f4f2", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              <Link
                to="/register"
                className="px-4 py-3 rounded-input font-semibold text-center transition-all duration-150"
                style={{ background: primaryBtnBg, color: primaryBtnColor }}
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="px-4 py-3 rounded-input text-sm font-medium text-center transition-colors"
                style={{ color: linkColor }}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
