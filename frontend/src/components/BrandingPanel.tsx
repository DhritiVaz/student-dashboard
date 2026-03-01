import React from "react";

const features = [
  { text: "Track every course" },
  { text: "Plan your semester" },
  { text: "Never miss a deadline" },
];

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "16px 18px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

export function BrandingPanel() {
  return (
    <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden bg-[#0a0a0a] py-20 px-28">

      {/* Breathing glow */}
      <div
        className="glow-pulse absolute pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* ── Title + tagline ──────────────────────────────────────────── */}
      <div className="relative z-10 stagger-1">
        <h1
          className="font-bold leading-[1] tracking-tight text-white"
          style={{ fontSize: "5rem" }}
        >
          Student
          <br />
          Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem", marginTop: 12 }}>
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
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>GPA</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>9.2</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>Spring 2025</p>
            <div style={{ marginTop: 10, height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: "92%", height: "100%", borderRadius: 9999, background: "rgba(255,255,255,0.5)" }} />
            </div>
          </div>

          {/* Card B — Due Soon (top-right) */}
          <div style={{
            ...card, position: "absolute", top: 0, right: "7%", width: 182,
            animation: "cardEnter 500ms cubic-bezier(0.16,1,0.3,1) 500ms both, floatB 4s ease-in-out 1s infinite",
          }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Due soon</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "CS301 Essay", sub: "Tomorrow" },
                { label: "Math Problem Set", sub: "In 3 days" },
              ].map(({ label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.2 }}>{label}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{sub}</p>
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
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Semester</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "Assignments", pct: "78%" },
                { label: "Attendance",  pct: "94%" },
                { label: "Labs",        pct: "60%" },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{pct}</p>
                  </div>
                  <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ height: "100%", width: pct, borderRadius: 9999, background: "rgba(255,255,255,0.38)" }} />
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
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Courses</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["CS 301", "88%"], ["MATH 201", "74%"], ["ENG 102", "91%"]].map(([c, w]) => (
                <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{c}</p>
                  <div style={{ height: 3, width: 52, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ height: "100%", width: w, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
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
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Tasks</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <p style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>12</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>/ 15 done</p>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 3 }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 5, borderRadius: 3,
                  background: i < 12 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
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
            style={{ color: "rgba(255,255,255,0.4)", animation: `bulletPulse 3.5s ease-in-out ${i * 0.9}s infinite` }}
          >
            <span style={{ width: 3, height: 3, borderRadius: "9999px", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
