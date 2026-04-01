import { useState, useEffect, useCallback } from "react";

const REDUCED_PREF_KEY = "settings-force-reduced-motion";

function readReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(REDUCED_PREF_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns true if the user prefers reduced motion (system, or Settings override).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);

  const sync = useCallback(() => setReduced(readReducedMotion()), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => sync();
    mq.addEventListener("change", onMq);
    window.addEventListener("dashboard-prefs-changed", sync);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("dashboard-prefs-changed", sync);
    };
  }, [sync]);

  return reduced;
}

export { REDUCED_PREF_KEY };
