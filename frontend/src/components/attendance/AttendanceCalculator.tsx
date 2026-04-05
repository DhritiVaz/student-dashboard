import { useState, useMemo } from "react";
import { readNum, PREF_ATTENDANCE_TARGET } from "../../lib/prefs";
import { useTheme } from "../../ThemeContext";

export type AttendanceCalcRow = {
  id: string;
  courseCode: string;
  courseName: string;
  courseType?: string | null;
  attended: number;
  conducted: number;
  attendancePercent: number;
};

const DEFAULT_TARGET = 75;
const MIN_TARGET = 40;
const MAX_TARGET = 99;

type Variant = "page" | "vtop";

function clampTarget(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_TARGET;
  return Math.round(Math.min(MAX_TARGET, Math.max(MIN_TARGET, n)));
}

export function AttendanceCalculator({
  attendance,
  variant = "page",
}: {
  attendance: AttendanceCalcRow[];
  variant?: Variant;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [targetPercent, setTargetPercent] = useState(() => readNum(PREF_ATTENDANCE_TARGET, DEFAULT_TARGET));
  const TARGET = useMemo(() => clampTarget(targetPercent), [targetPercent]);

  const inputClass =
    variant === "vtop"
      ? "w-16 rounded-md border border-neutral-700 bg-[#0c0c0c] px-2 py-1 text-sm text-white text-center tabular-nums focus:outline-none focus:border-neutral-500"
      : `w-16 rounded-md px-2 py-1 text-sm text-center tabular-nums focus:outline-none`;
  const inputStyle = variant === "page" ? {
    background: isDark ? "#0c0c0c" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)"}`,
    color: isDark ? "#ffffff" : "#111827",
  } : undefined;
  const labelStyle = variant === "vtop" ? undefined : { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" };
  const titleStyle = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.9)" : "#111827" } : undefined;
  const subtitleStyle = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" } : undefined;
  const mutedStyle = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" } : undefined;
  const headerColor = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" } : undefined;
  const hintColor = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" } : undefined;
  const emptyColor = variant === "page" ? { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" } : undefined;
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const miniCardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const barTrackBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  if (!attendance.length) {
    return (
      <div
        className={variant === "vtop" ? "p-6 text-center text-neutral-500 text-sm" : "p-6 text-center text-sm"}
        style={variant === "page" ? emptyColor : undefined}
      >
        {variant === "vtop"
          ? "No attendance data yet. Sync to calculate."
          : "No attendance data. Sync VTOP from the dashboard."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div
        className={`flex flex-wrap items-center gap-3 text-xs ${variant === "vtop" ? "text-neutral-400" : ""}`}
        style={variant === "page" ? headerColor : undefined}
      >
        <label htmlFor="attendance-target-pct" className="font-medium shrink-0">
          Target attendance
        </label>
        <div className="flex items-center gap-2">
          <input
            id="attendance-target-pct"
            type="number"
            min={MIN_TARGET}
            max={MAX_TARGET}
            step={1}
            value={targetPercent}
            onChange={(e) => setTargetPercent(Number(e.target.value))}
            onBlur={() => setTargetPercent((t) => clampTarget(t))}
            className={inputClass}
            style={variant === "page" ? inputStyle : undefined}
            aria-describedby="attendance-target-hint"
          />
          <span className="tabular-nums" style={variant === "page" ? { color: isDark ? "#f0f0f0" : "#111827" } : undefined}>%</span>
        </div>
        <span
          id="attendance-target-hint"
          style={variant === "page" ? hintColor : undefined}
        >
          Default {DEFAULT_TARGET}%. Adjust to see bunk / classes needed for your goal (e.g. 90%).
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {attendance.map((row) => {
          const { attended, conducted, attendancePercent, courseCode, courseName, courseType } = row;
          const t = TARGET / 100;
          const needToAttend =
            attendancePercent < TARGET ? Math.ceil((t * conducted - attended) / (1 - t)) : 0;
          const safeBunk = Math.max(0, Math.floor(attended / t - conducted));
          const isGood = attendancePercent >= TARGET;
          const warnLow = Math.max(0, TARGET - 10);
          const isWarning = !isGood && attendancePercent >= warnLow && attendancePercent < TARGET;

          return (
            <div key={row.id} className="rounded-xl px-4 py-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium" style={titleStyle}>
                    {courseCode}
                  </div>
                  <div className="text-xs" style={subtitleStyle}>
                    {courseName}
                  </div>
                  {courseType && (
                    <div className="text-xs" style={mutedStyle}>
                      {courseType}
                    </div>
                  )}
                </div>
                <span
                  className="text-lg font-bold"
                  style={{
                    color: isGood ? "#4ade80" : isWarning ? "#facc15" : "#f87171",
                  }}
                >
                  {attendancePercent.toFixed(1)}%
                </span>
              </div>

              <div
                className="w-full rounded-full h-1.5 mb-3"
                style={{ background: barTrackBg }}
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(attendancePercent, 100)}%`,
                    background: isGood ? "#4ade80" : isWarning ? "#facc15" : "#f87171",
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  className="rounded-lg px-3 py-2 text-center"
                  style={{ background: miniCardBg }}
                >
                  <div className="mb-0.5" style={labelStyle}>
                    Attended
                  </div>
                  <div className="font-semibold" style={titleStyle}>
                    {attended}/{conducted}
                  </div>
                </div>

                {isGood ? (
                  <div
                    className="rounded-lg px-3 py-2 text-center"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}
                  >
                    <div className="mb-0.5" style={{ color: "rgba(74,222,128,0.7)" }}>
                      Can bunk
                    </div>
                    <div className="font-semibold" style={{ color: "#4ade80" }}>
                      {safeBunk} more
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-3 py-2 text-center"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
                  >
                    <div className="mb-0.5" style={{ color: "rgba(248,113,113,0.7)" }}>
                      Need to attend
                    </div>
                    <div className="font-semibold" style={{ color: "#f87171" }}>
                      {needToAttend} more
                    </div>
                  </div>
                )}

                <div
                  className="rounded-lg px-3 py-2 text-center"
                  style={{ background: miniCardBg }}
                >
                  <div className="mb-0.5" style={labelStyle}>
                    Target
                  </div>
                  <div className="font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>
                    {TARGET}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
