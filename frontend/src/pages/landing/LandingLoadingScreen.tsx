import { useTheme } from "../../ThemeContext";

export function LandingLoadingScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#ffffff";
  const ringColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <div
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
        transition: "background 200ms ease",
      }}
    >
      {/* Small circle spinner */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9999,
          border: `2.5px solid ${ringColor}`,
          borderTopColor: isDark ? "#ffffff" : "#111827",
          animation: "spin 600ms linear infinite",
        }}
      />
    </div>
  );
}
