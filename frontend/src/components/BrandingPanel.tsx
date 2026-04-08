import React from "react";
import { useTheme } from "../ThemeContext";

const features = [
  { text: "Track every course" },
  { text: "Plan your semester" },
  { text: "Never miss a deadline" },
];

function useBrandingTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    isDark,
    bg: isDark ? "#0a0a0a" : "#ffffff",
    titleColor: isDark ? "#ffffff" : "#111827",
    subtitleColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    bulletColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
    bulletDotColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
    cardBg: isDark ? "#141414" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    cardShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.08)",
    cardTitleColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    cardTextColor: isDark ? "#fff" : "#111827",
    cardSubtextColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
    cardLabelColor: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
    cardPercentColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
    cardBarBg: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    cardBarFill: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.35)",
    cardCourseColor: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
    cardMiniBarBg: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    cardMiniBarFill: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
    cardDoneColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
    cardDoneBarBg: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
    cardDoneBarFill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)",
    glowColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(232,112,64,0.06)",
    titleMarginTop: -20,
  };
}

export function BrandingPanel() {
  const t = useBrandingTheme();

  const card = React.useMemo<React.CSSProperties>(() => ({
    background: t.cardBg,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 16,
    padding: "16px 18px",
    backdropFilter: "blur(8px)",
    boxShadow: t.cardShadow,
  }), [t]);

  return (
    <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden py-20 px-28"
      style={{ background: t.bg, transition: "background 200ms ease" }}>

      {/* Breathing glow */}
      <div
        className="glow-pulse absolute pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${t.glowColor} 0%, transparent 70%)`,
          transition: "background 200ms ease",
        }}
      />

      {/* ── Title + tagline ──────────────────────────────────────────── */}
      <div className="relative z-10 stagger-1" style={{ marginTop: t.titleMarginTop }}>
        <h1
          className="font-bold leading-[1] tracking-tight"
          style={{ fontSize: "5rem", color: t.titleColor, transition: "color 200ms ease" }}
        >
          Student
          <br />
          Dashboard
        </h1>
        <p style={{ color: t.subtitleColor, fontSize: "0.9rem", marginTop: 12 }}>
          Your academic life, beautifully organized.
        </p>
      </div>

      {/* ── Floating preview cards ───────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="relative w-full" style={{ height: 300 }}>

          {/* Card A — GPA (top-left) */}
          <div style={{
            ...card, position: "absolute", top: 0, left: "7%", width: 168,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 300ms both, floatA 5s ease-in-out 800ms infinite",
          }}>
            <p style={{ fontSize: 10, color: t.cardTitleColor, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>GPA</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: t.cardTextColor, lineHeight: 1 }}>9.2</p>
            <p style={{ fontSize: 11, color: t.cardSubtextColor, marginTop: 5 }}>Spring 2025</p>
            <div style={{ marginTop: 10, height: 3, borderRadius: 9999, background: t.cardBarBg }}>
              <div style={{ width: "92%", height: "100%", borderRadius: 9999, background: t.cardDoneBarFill }} />
            </div>
          </div>

          {/* Card B — Due Soon (top-right) */}
          <div style={{
            ...card, position: "absolute", top: 0, right: "7%", width: 182,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 500ms both, floatB 4s ease-in-out 1s infinite",
          }}>
            <p style={{ fontSize: 10, color: t.cardTitleColor, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Due soon</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "CS301 Essay", sub: "Tomorrow" },
                { label: "Math Problem Set", sub: "In 3 days" },
              ].map(({ label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 9999, background: t.bulletDotColor, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, color: t.cardTextColor, lineHeight: 1.2, opacity: 0.75 }}>{label}</p>
                    <p style={{ fontSize: 10, color: t.cardSubtextColor }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card C — Semester Progress (center) */}
          <div style={{
            ...card,
            position: "absolute",
            top: "45%",
            left: "41%",
            transform: "translate(-50%, -50%)",
            width: 190,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 600ms both, floatC 7s ease-in-out 1.1s infinite",
          }}>
            <p style={{ fontSize: 10, color: t.cardTitleColor, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Semester</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "Assignments", pct: "78%" },
                { label: "Attendance",  pct: "94%" },
                { label: "Labs",        pct: "60%" },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: t.cardLabelColor }}>{label}</p>
                    <p style={{ fontSize: 11, color: t.cardPercentColor }}>{pct}</p>
                  </div>
                  <div style={{ height: 3, borderRadius: 9999, background: t.cardBarBg }}>
                    <div style={{ height: "100%", width: pct, borderRadius: 9999, background: t.cardBarFill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card D — Courses (bottom-left) */}
          <div style={{
            ...card, position: "absolute", bottom: 0, left: "7%", width: 182,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 700ms both, floatA 6s ease-in-out 1.3s infinite",
          }}>
            <p style={{ fontSize: 10, color: t.cardTitleColor, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Courses</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["CS 301", "88%"], ["MATH 201", "74%"], ["ENG 102", "91%"]].map(([c, w]) => (
                <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: t.cardCourseColor }}>{c}</p>
                  <div style={{ height: 3, width: 52, borderRadius: 9999, background: t.cardMiniBarBg }}>
                    <div style={{ height: "100%", width: w, borderRadius: 9999, background: t.cardMiniBarFill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card E — Tasks (bottom-right) */}
          <div style={{
            ...card, position: "absolute", bottom: 0, right: "7%", width: 168,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 900ms both, floatB 5.5s ease-in-out 1.5s infinite",
          }}>
            <p style={{ fontSize: 10, color: t.cardTitleColor, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Tasks</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <p style={{ fontSize: 30, fontWeight: 700, color: t.cardTextColor, lineHeight: 1 }}>12</p>
              <p style={{ fontSize: 11, color: t.cardDoneColor, marginBottom: 3 }}>/ 15 done</p>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 3 }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 5, borderRadius: 3,
                  background: i < 12 ? t.cardDoneBarFill : t.cardDoneBarBg,
                }} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Feature bullets ──────────────────────────────────────────── */}
      <div className="relative z-10 stagger-2 flex flex-col gap-2">
        {features.map(({ text }, i) => (
          <div
            key={text}
            className="flex items-center gap-2.5 text-sm"
            style={{ color: t.bulletColor, animation: `bulletPulse 3.5s ease-in-out ${i * 0.9}s infinite` }}
          >
            <span style={{ width: 3, height: 3, borderRadius: "9999px", background: t.bulletDotColor, flexShrink: 0 }} />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
