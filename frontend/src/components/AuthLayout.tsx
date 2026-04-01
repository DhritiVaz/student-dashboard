import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAuthStore } from "../stores/authStore";
import { BrandingPanel } from "./BrandingPanel";
import { AnimatedPage } from "./AnimatedPage";
import { LandingLoadingScreen } from "../pages/landing/LandingLoadingScreen";

export function AuthLayout() {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore.persist.hasHydrated();
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

      {/* Right panel — dark grey to match main site */}
      <div
        className="auth-form-panel flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto"
        style={{ background: "#0e0e0e" }}
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
