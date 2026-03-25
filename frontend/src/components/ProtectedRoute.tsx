import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { LandingLoadingScreen } from "../pages/landing/LandingLoadingScreen";

const MIN_LOADING_MS = 600;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { accessToken } = useAuthStore();
  const location = useLocation();
  const skipLoading = (location.state as { fromEntryRoute?: boolean })?.fromEntryRoute ?? false;
  const [showLoading, setShowLoading] = useState(!skipLoading);

  const hasHydrated = useAuthStore.persist.hasHydrated();

  useEffect(() => {
    if (!hasHydrated || !accessToken || skipLoading) return;
    const timer = setTimeout(() => setShowLoading(false), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, [hasHydrated, accessToken, skipLoading]);

  if (!hasHydrated) {
    return <LandingLoadingScreen />;
  }
  // TEMP: bypass auth for visual testing — revert before committing
   if (!accessToken) {
     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
   }
  // TEMP bypass
  if (!accessToken) {
     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
   }
   if (showLoading) {
     return <LandingLoadingScreen />;
   }

  return <>{children}</>;
}
