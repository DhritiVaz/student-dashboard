import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sigma, Calculator, ChevronDown, ChevronRight } from "lucide-react";
import { useVtopGradesSummary } from "../hooks/api/vtop";
import { useCourses } from "../hooks/api/courses";
import { useSemesters } from "../hooks/api/semesters";
import { useTheme } from "../ThemeContext";
import { SkeletonCard } from "../components/ui/Skeleton";

const MAX_GP = 10;

function GpaBar({ gpa }: { gpa: number | null }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  if (gpa == null) return null;
  const pct = Math.min(100, (gpa / MAX_GP) * 100);
  return (
    <div className={`w-24 h-1.5 rounded-full overflow-hidden flex-shrink-0 ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
      <div className={`h-full rounded-full transition-all ${isDark ? "bg-emerald-400/80" : "bg-green-500/70"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const LETTER_TO_GP: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 4,
  F: 0,
  P: 10,
  N: 0,
};

type CalcRow = { id: string; title: string; credits: number; gradePoint: number };

function letterToGp(s: string): number | null {
  const u = s.trim().toUpperCase();
  if (u === "") return null;
  if (LETTER_TO_GP[u] !== undefined) return LETTER_TO_GP[u];
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : Math.min(10, Math.max(0, n));
}

export default function CgpaPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: summary, loading, fetch } = useVtopGradesSummary();
  const { data: semesters }    = useSemesters();
  const { data: allCourses = [] } = useCourses();
  const [tab, setTab] = useState<"record" | "calc">("record");
  const [openSem, setOpenSem] = useState<Record<string, boolean>>({});

  const [calcRows, setCalcRows] = useState<CalcRow[]>([]);

  useEffect(() => {
    fetch();
  }, []);

  const currentSemester = useMemo(() => {
    const day = new Date();
    if (!semesters?.length) return null;
    const active = semesters.find(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      const end   = s.endDate ? new Date(s.endDate) : null;
      return start != null && end != null && day >= start && day <= end;
    });
    return active ?? [...semesters].sort((a, b) => b.year - a.year)[0];
  }, [semesters]);

  const coursesThisSemester = useMemo(() => {
    if (!currentSemester) return [];
    return allCourses.filter(c => c.semesterId === currentSemester.id);
  }, [currentSemester, allCourses]);

  const importCurrent = () => {
    const rows: CalcRow[] = coursesThisSemester.map((c, i) => ({
      id: `c-${i}-${c.id}`,
      title: `${c.code} — ${c.name}`,
      credits: c.credits ?? 3,
      gradePoint: 8,
    }));
    setCalcRows(rows.length ? rows : [{ id: "r0", title: "Course 1", credits: 3, gradePoint: 8 }]);
  };

  const semGpaCalc = useMemo(() => {
    let c = 0;
    let w = 0;
    for (const r of calcRows) {
      if (r.credits > 0 && r.gradePoint >= 0) {
        c += r.credits;
        w += r.credits * r.gradePoint;
      }
    }
    return c > 0 ? w / c : null;
  }, [calcRows]);

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Sigma size={22} className={isDark ? "text-violet-400/90" : "text-violet-600/80"} />
        <h1 className="text-2xl font-bold" style={{ color: isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.95)" }}>
          CGPA & GPA
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>
        From VTOP grade history. Sync on the{" "}
        <Link to="/dashboard" className={`underline underline-offset-2 ${isDark ? "text-white/50 hover:text-white/80" : "text-zinc-400 hover:text-zinc-600"}`}>
          dashboard
        </Link>{" "}
        or{" "}
        <Link to="/attendance" className={`underline underline-offset-2 ${isDark ? "text-white/50 hover:text-white/80" : "text-zinc-400 hover:text-zinc-600"}`}>
          attendance
        </Link>{" "}
        page.
      </p>

      <div className="flex gap-1 p-1 rounded-lg w-fit mb-6" style={{ background: isDark ? "#141414" : "#f3f4f6", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)"}` }}>
        <button
          type="button"
          onClick={() => setTab("record")}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
            tab === "record"
              ? (isDark ? "bg-white text-black" : "bg-zinc-900 text-white")
              : (isDark ? "text-white/45 hover:text-white" : "text-zinc-500 hover:text-zinc-900")
          }`}
        >
          <Sigma size={14} />
          Record
        </button>
        <button
          type="button"
          onClick={() => setTab("calc")}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
            tab === "calc"
              ? (isDark ? "bg-white text-black" : "bg-zinc-900 text-white")
              : (isDark ? "text-white/45 hover:text-white" : "text-zinc-500 hover:text-zinc-900")
          }`}
        >
          <Calculator size={14} />
          Calculator
        </button>
      </div>

      {tab === "record" && (
        <>
          {loading && !summary ? (
            <div className="space-y-3">
              <SkeletonCard height={48} />
              <SkeletonCard height={120} />
            </div>
          ) : !summary || summary.semesters.length === 0 ? (
            <div className="rounded-xl p-10 text-center text-sm" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
              No grade data yet. Run a VTOP sync first.
            </div>
          ) : (
            <>
              <div
                className="rounded-xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4"
                style={{ background: isDark ? "#141414" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}
              >
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>
                    CGPA
                    {summary.cgpaFromPortal != null && (
                      <span className="normal-case font-normal ml-1" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>(VTOP)</span>
                    )}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: isDark ? "#f0f0f0" : "#111827" }}>{summary.cgpa != null ? summary.cgpa.toFixed(2) : "\u2014"}</p>
                  {summary.cgpaFromPortal != null &&
                    summary.cgpaComputed != null &&
                    Math.abs(summary.cgpaFromPortal - summary.cgpaComputed) > 0.02 && (
                      <p className="text-[11px] mt-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>
                        Calculated from grades: {summary.cgpaComputed.toFixed(2)}
                      </p>
                    )}
                </div>
                <div className="text-right text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>
                  <div>Total credits: {summary.totalCredits.toFixed(1)}</div>
                  <div>\u03a3 weighted: {summary.totalWeightedScore.toFixed(1)}</div>
                </div>
                <GpaBar gpa={summary.cgpa} />
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
                <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)", background: isDark ? "#1a1a1a" : "#f9fafb" }}>
                  By semester
                </div>
                {summary.semesters.map((sem) => {
                  const key = sem.semesterLabel ?? "default";
                  const open = openSem[key] ?? true;
                  return (
                    <div key={key} style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-black/[0.03]"
                        onClick={() => setOpenSem((s) => ({ ...s, [key]: !open }))}
                      >
                        {open ? <ChevronDown size={16} className={isDark ? "text-white/40" : "text-zinc-400"} /> : <ChevronRight size={16} className={isDark ? "text-white/40" : "text-zinc-400"} />}
                        <span className={`font-medium flex-1 truncate ${isDark ? "text-white" : "text-zinc-900"}`}>{sem.semesterLabel ?? "Grade history"}</span>
                        <span className={`text-sm tabular-nums ${isDark ? "text-emerald-400/80" : "text-green-600/80"}`} title={sem.gpaFromPortal != null ? "GPA from VTOP" : undefined}>
                          {sem.gpa != null ? sem.gpa.toFixed(2) : "\u2014"}
                          {sem.gpaFromPortal != null && <span className={`text-[10px] ml-1 font-normal ${isDark ? "text-white/35" : "text-zinc-400"}`}>VTOP</span>}
                        </span>
                        <GpaBar gpa={sem.gpa} />
                      </button>
                      {open && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Course</th>
                                <th className="text-right px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>#</th>
                                <th className="text-right px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Grade</th>
                                <th className="text-right px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Pt</th>
                                <th className="text-left px-4 py-2 text-xs font-medium hidden lg:table-cell" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Faculty / slot</th>
                                <th className="text-right px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.courses.map((c) => {
                                const cr = c.credits ?? 0;
                                const gp = c.gradePoint ?? 0;
                                const w = cr * gp;
                                return (
                                  <tr key={c.id} style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                                    <td className="px-4 py-2">
                                      <Link to="/courses" style={{ color: isDark ? "#f0f0f0" : "#111827" }} className="hover:underline">
                                        <span className="font-medium">{c.courseCode}</span>
                                        <span className="block text-xs truncate max-w-[220px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>{c.courseName}</span>
                                      </Link>
                                    </td>
                                    <td className="px-4 py-2 text-right" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>{cr || "\u2014"}</td>
                                    <td className="px-4 py-2 text-right" style={{ color: isDark ? "#f0f0f0" : "#111827" }}>{c.grade ?? "\u2014"}</td>
                                    <td className="px-4 py-2 text-right" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>{c.gradePoint ?? "\u2014"}</td>
                                    <td className="px-4 py-2 text-left" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>
                                      <span className="text-xs max-w-[200px] truncate inline-block">{[c.faculty, c.slot].filter(Boolean).join(" \u00b7 ") || (c.category ? c.category : "\u2014")}</span>
                                    </td>
                                    <td className="px-4 py-2 text-right" style={{ color: isDark ? "#22c55e" : "#22c55e" }}>{cr && c.gradePoint != null ? w.toFixed(1) : "\u2014"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
                                <td className="px-4 py-2 text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>SUM</td>
                                <td className="px-4 py-2 text-right text-xs font-semibold" style={{ color: isDark ? "#f0f0f0" : "#111827" }}>{sem.totalCredits.toFixed(1)}</td>
                                <td colSpan={3} />
                                <td className="px-4 py-2 text-right text-xs font-semibold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{sem.weightedScore.toFixed(1)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === "calc" && (
        <div className="rounded-xl overflow-hidden" style={{ background: isDark ? "#141414" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
          <div className="px-4 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
            <span className="text-sm font-medium" style={{ color: isDark ? "#f0f0f0" : "#111827" }}>Hypothetical semester GPA</span>
            <button
              type="button"
              onClick={importCurrent}
              title={
                currentSemester
                  ? `Uses courses in ${currentSemester.name}${currentSemester.year != null ? ` ${currentSemester.year}` : ""} only`
                  : "Add semesters and courses first"
              }
              className="text-xs text-violet-400 hover:text-violet-300 ml-auto"
            >
              Import current semester courses
            </button>
            <button
              type="button"
              onClick={() =>
                setCalcRows((r) => [...r, { id: `n-${Date.now()}`, title: "New course", credits: 3, gradePoint: 8 }])
              }
              className="text-xs text-white/50 hover:text-white"
            >
              + Row
            </button>
          </div>
          <div className="p-4 space-y-3">
            {calcRows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-start">
                <div className="sm:col-span-5">
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Course</label>
                  <input
                    value={row.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCalcRows((rows) => rows.map((x) => (x.id === row.id ? { ...x, title: v } : x)));
                    }}
                    className={`w-full mt-1 rounded-lg px-3 py-2 text-sm ${isDark ? "bg-[#2a2a2a] border-white/10 text-white" : "bg-gray-100 border-gray-200 text-zinc-900"}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Credits</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={row.credits}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setCalcRows((rows) => rows.map((x) => (x.id === row.id ? { ...x, credits: v } : x)));
                    }}
                    className={`w-full mt-1 rounded-lg px-3 py-2 text-sm ${isDark ? "bg-[#2a2a2a] border-white/10 text-white" : "bg-gray-100 border-gray-200 text-zinc-900"}`}
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Grade point (0–10) or letter</label>
                  <div className="mt-1 flex gap-2 items-center">
                    <input
                      defaultValue=""
                      placeholder="e.g. 8 or B"
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) return;
                        const gp = letterToGp(raw) ?? parseFloat(raw);
                        if (!Number.isNaN(gp)) {
                          setCalcRows((rows) =>
                            rows.map((x) => (x.id === row.id ? { ...x, gradePoint: Math.min(10, Math.max(0, gp)) } : x))
                          );
                        }
                      }}
                      className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm ${isDark ? "bg-[#2a2a2a] border-white/10 text-white" : "bg-gray-100 border-gray-200 text-zinc-900"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setCalcRows((rows) => rows.filter((x) => x.id !== row.id))}
                      className="flex-shrink-0 text-xs text-red-400/80 hover:text-red-400 py-2 whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="text-[11px] mt-0.5 block" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>Current: {row.gradePoint.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
            <span className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>Estimated semester GPA</span>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${isDark ? "text-emerald-400/80" : "text-green-600/80"}`}>{semGpaCalc != null ? semGpaCalc.toFixed(2) : "\u2014"}</span>
              <GpaBar gpa={semGpaCalc} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
