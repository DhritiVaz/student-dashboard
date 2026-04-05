import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAuthStore } from "../stores/authStore";
import { BrandingPanel } from "./BrandingPanel";
import { AnimatedPage } from "./AnimatedPage";
import { LandingLoadingScreen } from "../pages/landing/LandingLoadingScreen";
import { useTheme } from "../ThemeContext";

export function AuthLayout() {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore.persist.hasHydrated();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  useDocumentTitle(location.pathname);

  if (!hasHydrated) {
    return <LandingLoadingScreen />;
  }

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — mounted once, never re-animates on route change */}
      <BrandingPanel />

      {/* Right panel */}
      <div
        className="auth-form-panel flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto"
        style={{ background: isDark ? "#0e0e0e" : "#fafafa" }}
      >
        <AnimatedPage key={location.pathname} fillHeight={false}>
          {/* motion.div is w-full; center the form inside the right panel (was left-aligned) */}
          <div className="w-full flex justify-center">
            <Outlet />
          </div>
        </AnimatedPage>
      </div>
    </div>
  );
}
