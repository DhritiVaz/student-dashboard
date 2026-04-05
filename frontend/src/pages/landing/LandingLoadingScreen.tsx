import { useTheme } from "../../ThemeContext";

export function LandingLoadingScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f5f4f2";
  const text = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div
      className="landing-loading-spinner w-8 h-8 rounded-full border-2"
      style={{
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        inset: 0,
        zIndex: 100,
      }}
    >
      <div style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", borderTopColor: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)" }} />
      <p className="mt-6 text-sm font-medium" style={{ color: text }}>Student Dashboard</p>
    </div>
  );
}
