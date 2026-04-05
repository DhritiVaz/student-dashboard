import { createContext, useContext, useEffect, useState } from "react";
import { usePrefStr } from "./hooks/usePrefs";
import { PREF_THEME, writeStr } from "./lib/prefs";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePrefStr(PREF_THEME, "light") as Theme;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: (t) => writeStr(PREF_THEME, t) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
