import { useEffect, useState } from "react";
import { BarChart2, Calculator } from "lucide-react";
import { useVtopAttendance } from "../hooks/api/vtop";
import { AttendanceCalculator } from "../components/attendance/AttendanceCalculator";

export default function AttendancePage() {
  const { data: attendance, fetch: fetchAttendance, loading } = useVtopAttendance();
  const [activeTab, setActiveTab] = useState<"attendance" | "calculator">("attendance");

  useEffect(() => { fetchAttendance(); }, []);

  const overall = attendance.length
    ? attendance.reduce((s, r) => s + r.attendancePercent, 0) / attendance.length
    : null;

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>Attendance</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Use VTOP sync on the dashboard to load attendance—details stay on this page.
          </p>
        </div>
        {overall !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: overall >= 75 ? "#4ade80" : overall >= 65 ? "#facc15" : "#f87171" }}>
              {overall.toFixed(1)}%
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>overall average</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</div>
      ) : attendance.length === 0 ? (
        <div className="space-y-4">
        <div className="text-center py-16 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>No attendance data yet</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sync VTOP from the dashboard</p>
        </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "attendance" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <BarChart2 size={14} />
              Attendance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "calculator" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Calculator size={14} />
              Calculator
            </button>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
            {activeTab === "attendance" ? (
              <>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <BarChart2 size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Course Attendance</span>
                  <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>{attendance.length} courses</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Course</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Type</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Attended</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Total</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{row.courseCode}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{row.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{row.courseType ?? "—"}</td>
                        <td className="px-4 py-3 text-right" style={{ color: "rgba(255,255,255,0.7)" }}>{row.attended}</td>
                        <td className="px-4 py-3 text-right" style={{ color: "rgba(255,255,255,0.7)" }}>{row.conducted}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: row.attendancePercent >= 75 ? "#4ade80" : row.attendancePercent >= 65 ? "#facc15" : "#f87171" }}>
                          {row.attendancePercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Calculator size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Attendance Calculator</span>
                  <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>Target: 75%</span>
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