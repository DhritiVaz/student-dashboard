import { useState, useMemo } from "react";
import { readNum, PREF_ATTENDANCE_TARGET } from "../../lib/prefs";

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
  const [targetPercent, setTargetPercent] = useState(() => readNum(PREF_ATTENDANCE_TARGET, DEFAULT_TARGET));
  const TARGET = useMemo(() => clampTarget(targetPercent), [targetPercent]);

  const inputClass =
    variant === "vtop"
      ? "w-16 rounded-md border border-neutral-700 bg-[#0c0c0c] px-2 py-1 text-sm text-white text-center tabular-nums focus:outline-none focus:border-neutral-500"
      : "w-16 rounded-md border border-white/15 bg-[#0c0c0c] px-2 py-1 text-sm text-center tabular-nums focus:outline-none focus:border-white/30";
  const labelStyle = variant === "vtop" ? undefined : { color: "rgba(255,255,255,0.45)" };

  if (!attendance.length) {
    return (
      <div
        className={variant === "vtop" ? "p-6 text-center text-neutral-500 text-sm" : "p-6 text-center text-sm"}
        style={variant === "page" ? { color: "rgba(255,255,255,0.3)" } : undefined}
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
        style={variant === "page" ? { color: "rgba(255,255,255,0.45)" } : undefined}
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
            aria-describedby="attendance-target-hint"
          />
          <span className="tabular-nums">%</span>
        </div>
        <span
          id="attendance-target-hint"
          className={variant === "vtop" ? "text-neutral-600" : ""}
          style={variant === "page" ? { color: "rgba(255,255,255,0.25)" } : undefined}
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

          const cardClass =
            variant === "vtop"
              ? "rounded-xl px-4 py-4 bg-white/[0.03] border border-white/[0.06]"
              : "rounded-xl px-4 py-4";
          const cardStyle =
            variant === "page"
              ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
              : undefined;

          return (
            <div key={row.id} className={cardClass} style={cardStyle}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div
                    className={variant === "vtop" ? "text-white font-medium text-sm" : "text-sm font-medium"}
                    style={variant === "page" ? { color: "rgba(255,255,255,0.9)" } : undefined}
                  >
                    {courseCode}
                  </div>
                  <div
                    className={variant === "vtop" ? "text-neutral-500 text-xs" : "text-xs"}
                    style={variant === "page" ? { color: "rgba(255,255,255,0.4)" } : undefined}
                  >
                    {courseName}
                  </div>
                  {courseType && (
                    <div
                      className={variant === "vtop" ? "text-neutral-600 text-xs" : "text-xs"}
                      style={variant === "page" ? { color: "rgba(255,255,255,0.25)" } : undefined}
                    >
                      {courseType}
                    </div>
                  )}
                </div>
                <span
                  className={`text-lg font-bold ${
                    variant === "vtop"
                      ? isGood
                        ? "text-green-400"
                        : isWarning
                          ? "text-yellow-400"
                          : "text-red-400"
                      : ""
                  }`}
                  style={
                    variant === "page"
                      ? {
                          color: isGood ? "#4ade80" : isWarning ? "#facc15" : "#f87171",
                        }
                      : undefined
                  }
                >
                  {attendancePercent.toFixed(1)}%
                </span>
              </div>

              <div
                className={variant === "vtop" ? "w-full bg-neutral-800 rounded-full h-1.5 mb-3" : "w-full rounded-full h-1.5 mb-3"}
                style={variant === "page" ? { background: "rgba(255,255,255,0.08)" } : undefined}
              >
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    variant === "vtop"
                      ? isGood
                        ? "bg-green-400"
                        : isWarning
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      : ""
                  }`}
                  style={{
                    width: `${Math.min(attendancePercent, 100)}%`,
                    ...(variant === "page"
                      ? {
                          background: isGood ? "#4ade80" : isWarning ? "#facc15" : "#f87171",
                        }
                      : {}),
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  className={variant === "vtop" ? "bg-[#0c0c0c] rounded-lg px-3 py-2 text-center" : "rounded-lg px-3 py-2 text-center"}
                  style={variant === "page" ? { background: "rgba(255,255,255,0.04)" } : undefined}
                >
                  <div
                    className={variant === "vtop" ? "text-neutral-500 mb-0.5" : "mb-0.5"}
                    style={labelStyle}
                  >
                    Attended
                  </div>
                  <div
                    className={variant === "vtop" ? "text-white font-semibold" : "font-semibold"}
                    style={variant === "page" ? { color: "rgba(255,255,255,0.9)" } : undefined}
                  >
                    {attended}/{conducted}
                  </div>
                </div>

                {isGood ? (
                  <div
                    className={
                      variant === "vtop"
                        ? "bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 text-center"
                        : "rounded-lg px-3 py-2 text-center"
                    }
                    style={
                      variant === "page"
                        ? {
                            background: "rgba(74,222,128,0.1)",
                            border: "1px solid rgba(74,222,128,0.2)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className={variant === "vtop" ? "text-green-400/70 mb-0.5" : "mb-0.5"}
                      style={variant === "page" ? { color: "rgba(74,222,128,0.7)" } : undefined}
                    >
                      Can bunk
                    </div>
                    <div
                      className={variant === "vtop" ? "text-green-400 font-semibold" : "font-semibold"}
                      style={variant === "page" ? { color: "#4ade80" } : undefined}
                    >
                      {safeBunk} more
                    </div>
                  </div>
                ) : (
                  <div
                    className={
                      variant === "vtop"
                        ? "bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center"
                        : "rounded-lg px-3 py-2 text-center"
                    }
                    style={
                      variant === "page"
                        ? {
                            background: "rgba(248,113,113,0.1)",
                            border: "1px solid rgba(248,113,113,0.2)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className={variant === "vtop" ? "text-red-400/70 mb-0.5" : "mb-0.5"}
                      style={variant === "page" ? { color: "rgba(248,113,113,0.7)" } : undefined}
                    >
                      Need to attend
                    </div>
                    <div
                      className={variant === "vtop" ? "text-red-400 font-semibold" : "font-semibold"}
                      style={variant === "page" ? { color: "#f87171" } : undefined}
                    >
                      {needToAttend} more
                    </div>
                  </div>
                )}

                <div
                  className={variant === "vtop" ? "bg-[#0c0c0c] rounded-lg px-3 py-2 text-center" : "rounded-lg px-3 py-2 text-center"}
                  style={variant === "page" ? { background: "rgba(255,255,255,0.04)" } : undefined}
                >
                  <div
                    className={variant === "vtop" ? "text-neutral-500 mb-0.5" : "mb-0.5"}
                    style={labelStyle}
                  >
                    Target
                  </div>
                  <div
                    className={variant === "vtop" ? "text-neutral-300 font-semibold" : "font-semibold"}
                    style={variant === "page" ? { color: "rgba(255,255,255,0.7)" } : undefined}
                  >
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
