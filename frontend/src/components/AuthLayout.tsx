import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAuthStore } from "../stores/authStore";
import { BrandingPanel } from "./BrandingPanel";
import { AnimatedPage } from "./AnimatedPage";
import { LandingLoadingScreen } from "../pages/landing/LandingLoadingScreen";
import { useTheme } from "../ThemeContext";
import { ThemeToggle } from "./ui/ThemeToggle";

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
        className="auth-form-panel relative flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto"
        style={{ background: isDark ? "#0e0e0e" : "#ffffff", transition: "background 200ms ease" }}
      >
        {/* Theme toggle — visible at top-right of panel */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle className="shadow-lg" />
        </div>

        <AnimatedPage key={location.pathname} fillHeight={false}>
          <div className="w-full flex justify-center">
            <Outlet />
          </div>
        </AnimatedPage>
      </div>
    </div>
  );
}
