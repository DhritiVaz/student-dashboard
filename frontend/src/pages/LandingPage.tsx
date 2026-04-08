import { lazy, Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingNavbar } from "./landing/LandingNavbar";
import { LandingHero } from "./landing/LandingHero";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingLoadingScreen } from "./landing/LandingLoadingScreen";
import { useTheme } from "../ThemeContext";

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 rounded-lg transition-colors ${className}`}
      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)")}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}

const LandingFeatures = lazy(() =>
  import("./landing/LandingFeatures").then((m) => ({ default: m.LandingFeatures }))
);
const LandingHowItWorks = lazy(() =>
  import("./landing/LandingHowItWorks").then((m) => ({ default: m.LandingHowItWorks }))
);
const LandingCTABanner = lazy(() =>
  import("./landing/LandingCTABanner").then((m) => ({
    default: m.LandingCTABanner,
  }))
);

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LandingLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="landing-page min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <LandingNavbar />
            <LandingHero />
            <Suspense fallback={null}>
              <LandingFeatures />
              <LandingHowItWorks />
              <LandingCTABanner />
            </Suspense>
            <LandingFooter />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
