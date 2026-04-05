import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
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
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
