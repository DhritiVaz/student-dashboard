import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, Calculator } from "lucide-react";
import { useVtopAttendance } from "../hooks/api/vtop";
import { AttendanceCalculator } from "../components/attendance/AttendanceCalculator";
import { usePrefNum } from "../hooks/usePrefs";
import { PREF_ATTENDANCE_SAFE, PREF_ATTENDANCE_WARN } from "../lib/prefs";
import { useTheme } from "../ThemeContext";

export default function AttendancePage() {
  const { data: attendance, fetch: fetchAttendance, loading } = useVtopAttendance();
  const [activeTab, setActiveTab] = useState<"attendance" | "calculator">("attendance");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const safe = usePrefNum(PREF_ATTENDANCE_SAFE, 75);
  const warn = usePrefNum(PREF_ATTENDANCE_WARN, 65);

  useEffect(() => { fetchAttendance(); }, []);

  const overall = attendance.length
    ? attendance.reduce((s, r) => s + r.attendancePercent, 0) / attendance.length
    : null;

  function attendanceColor(pct: number) {
    return pct >= safe ? (isDark ? "#4ade80" : "#16a34a") : pct >= warn ? "#facc15" : "#f87171";
  }

  const bgCard = isDark ? "#141414" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cardHeaderBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const cardTitleColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
  const cardIconColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)";
  const tableHeaderColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)";
  const cellPrimaryColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
  const cellSecondaryColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
  const cellNormalColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
  const loadingColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const emptyIconColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)";
  const emptySubtitleColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";
  const emptyTitleColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)";
  const tabBarBg = isDark ? "#141414" : "#f3f4f6";
  const tabBarBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const activeTabBg = isDark ? "#ffffff" : "#ffffff";
  const activeTabText = isDark ? "#111" : "#111";
  const inactiveTabText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const inactiveTabHoverText = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";

  return (
    <div className="pt-4 px-6 pb-6 sm:pt-5 sm:px-8 sm:pb-8 w-full min-w-0">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.9)" }}>Attendance</h1>
        </div>
        {overall !== null && (
          <div className="text-right">
            <div className="text-6xl font-normal tracking-tight leading-none" style={{ color: attendanceColor(overall) }}>
              {overall.toFixed(1)}%
            </div>
            <div className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>overall average</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: loadingColor }}>Loading...</div>
      ) : attendance.length === 0 ? (
        <div className="space-y-4">
        <div className="text-center py-16 rounded-xl" style={{ background: bgCard, border: `1px solid ${cardBorder}` }}>
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: emptyIconColor }} />
          <p className="text-sm font-medium mb-1" style={{ color: emptyTitleColor }}>No attendance data yet</p>
          <p className="text-xs" style={{ color: emptySubtitleColor }}>Use VTOP Sync in the top bar to load data</p>
        </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: tabBarBg, border: `1px solid ${tabBarBorder}` }}>
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{
                background: activeTab === "attendance" ? activeTabBg : "transparent",
                color: activeTab === "attendance" ? activeTabText : inactiveTabText,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "attendance") (e.target as HTMLElement).style.color = inactiveTabHoverText;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "attendance") (e.target as HTMLElement).style.color = inactiveTabText;
              }}
            >
              <BarChart2 size={14} />
              Attendance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{
                background: activeTab === "calculator" ? activeTabBg : "transparent",
                color: activeTab === "calculator" ? activeTabText : inactiveTabText,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "calculator") (e.target as HTMLElement).style.color = inactiveTabHoverText;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "calculator") (e.target as HTMLElement).style.color = inactiveTabText;
              }}
            >
              <Calculator size={14} />
              Calculator
            </button>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: bgCard, border: `1px solid ${cardBorder}` }}>
            {activeTab === "attendance" ? (
              <>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${cardHeaderBorder}` }}>
                  <BarChart2 size={13} style={{ color: cardIconColor }} />
                  <span className="text-sm font-semibold" style={{ color: cardTitleColor }}>Course Attendance</span>
                  <span className="text-xs ml-auto" style={{ color: cardIconColor }}>{attendance.length} courses</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${cardHeaderBorder}` }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: tableHeaderColor }}>Course</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: tableHeaderColor }}>Type</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderColor }}>Attended</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderColor }}>Total</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderColor }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <Link to="/cgpa" className="hover:underline underline-offset-2">
                            <div className="font-medium" style={{ color: cellPrimaryColor }}>{row.courseCode}</div>
                            <div className="text-xs" style={{ color: cellSecondaryColor }}>{row.courseName}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: cellSecondaryColor }}>{row.courseType ?? "—"}</td>
                        <td className="px-4 py-3 text-right" style={{ color: cellNormalColor }}>{row.attended}</td>
                        <td className="px-4 py-3 text-right" style={{ color: cellNormalColor }}>{row.conducted}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: attendanceColor(row.attendancePercent) }}>
                          {row.attendancePercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${cardHeaderBorder}` }}>
                  <Calculator size={13} style={{ color: cardIconColor }} />
                  <span className="text-sm font-semibold" style={{ color: cardTitleColor }}>Attendance Calculator</span>
                  <span className="text-xs ml-auto" style={{ color: cardIconColor }}>Target: 75%</span>
                </div>
                <AttendanceCalculator attendance={attendance} variant="page" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
