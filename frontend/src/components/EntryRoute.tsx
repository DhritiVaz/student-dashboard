import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import LandingPage from "../pages/LandingPage";
import { LandingLoadingScreen } from "../pages/landing/LandingLoadingScreen";

const MIN_LOADING_MS = 600;

/**
 * Handles the root "/" path:
 * - Logged out: loading screen → landing page (login/register via nav links)
 * - Logged in: loading screen → redirect to dashboard
 */
export function EntryRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore.persist.hasHydrated();
  const [canRedirect, setCanRedirect] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("landing-route");
    return () => document.documentElement.classList.remove("landing-route");
  }, []);

  useEffect(() => {
    if (!hasHydrated || !accessToken) return;
    const timer = setTimeout(() => setCanRedirect(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, [hasHydrated, accessToken]);

  if (!hasHydrated) {
    return <LandingLoadingScreen />;
  }

  if (accessToken && !canRedirect) {
    return <LandingLoadingScreen />;
  }

  if (accessToken) {
    return <Navigate to="/dashboard" replace state={{ fromEntryRoute: true }} />;
  }

  return <LandingPage />;
}
