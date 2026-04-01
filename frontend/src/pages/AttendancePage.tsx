import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart2, RefreshCw } from "lucide-react";
import { useVtopAttendance } from "../hooks/api/vtop";

function AttendanceCalculator({ attendance }: { attendance: any[] }) {
  const TARGET = 75;
  if (!attendance.length) return (
    <div className="p-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
      No attendance data. Sync VTOP from the Dashboard first.
    </div>
  );

  return (
    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      {attendance.map((row) => {
        const { attended, conducted, attendancePercent, courseCode, courseName, courseType } = row;
        const isGood = attendancePercent >= TARGET;
        const safeBunk = Math.max(0, Math.floor(attended / (TARGET / 100) - conducted));
        const needToAttend = !isGood ? Math.ceil((TARGET / 100 * conducted - attended) / (1 - TARGET / 100)) : 0;

        return (
          <div key={row.id} className="px-4 py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{courseCode}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{courseName}</div>
                {courseType && <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{courseType}</div>}
              </div>
              <span className="text-lg font-bold" style={{ color: isGood ? "#4ade80" : attendancePercent >= 65 ? "#facc15" : "#f87171" }}>
                {attendancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full rounded-full h-1.5 mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(attendancePercent, 100)}%`, background: isGood ? "#4ade80" : attendancePercent >= 65 ? "#facc15" : "#f87171" }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div style={{ color: "rgba(255,255,255,0.4)" }} className="mb-0.5">Attended</div>
                <div className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{attended}/{conducted}</div>
              </div>
              {isGood ? (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                  <div className="mb-0.5" style={{ color: "rgba(74,222,128,0.7)" }}>Can bunk</div>
                  <div className="font-semibold" style={{ color: "#4ade80" }}>{safeBunk} more</div>
                </div>
              ) : (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  <div className="mb-0.5" style={{ color: "rgba(248,113,113,0.7)" }}>Need to attend</div>
                  <div className="font-semibold" style={{ color: "#f87171" }}>{needToAttend} more</div>
                </div>
              )}
              <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div style={{ color: "rgba(255,255,255,0.4)" }} className="mb-0.5">Target</div>
                <div className="font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{TARGET}%</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AttendancePage() {
  const { data: attendance, fetch: fetchAttendance, loading } = useVtopAttendance();

  useEffect(() => { fetchAttendance(); }, []);

  const overall = attendance.length
    ? attendance.reduce((s, r) => s + r.attendancePercent, 0) / attendance.length
    : null;

  return (
    <div className="p-6 sm:p-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>Attendance</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Sync from{" "}
            <Link to="/dashboard" className="underline underline-offset-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Dashboard → VTOP Sync
            </Link>{" "}
            to update
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
        <div className="text-center py-20 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>No attendance data yet</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Go to Dashboard and sync your VTOP account</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                {attendance.map((row, i) => (
                  <tr key={row.id} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
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
          </div>

          {/* Calculator */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <RefreshCw size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Attendance Calculator</span>
              <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>Target: 75%</span>
            </div>
            <AttendanceCalculator attendance={attendance} />
          </div>
        </div>
      )}
    </div>
  );
}