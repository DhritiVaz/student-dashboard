import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Wifi, Calculator } from "lucide-react";
import { useVtopSync, useFetchCaptcha, useVtopAttendance, useVtopGrades, VtopAttendanceRecord, VtopGradeRecord } from "../../hooks/api/vtop";
import { AttendanceCalculator } from "../attendance/AttendanceCalculator";

export type VtopSyncVariant = "dashboard" | "full" | "syncAndGrades";

const VTOP_USERNAME_KEY = "vtop-remember-username";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VtopSync({ variant = "full" }: { variant?: VtopSyncVariant }) {
  const [rememberUsername, setRememberUsername] = useState(() => {
    try {
      return localStorage.getItem(VTOP_USERNAME_KEY) !== null;
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem(VTOP_USERNAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [captchaStr, setCaptchaStr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "calculator" | "grades">(() =>
    variant === "syncAndGrades" ? "grades" : "attendance"
  );
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const { sync, loading: syncing, error: syncError } = useVtopSync();
  const { fetchCaptcha } = useFetchCaptcha();
  const { data: attendance, fetch: fetchAttendance, loading: loadingAttendance } = useVtopAttendance();
  const { data: grades, fetch: fetchGrades, loading: loadingGrades } = useVtopGrades();

  useEffect(() => {
    fetchAttendance();
    fetchGrades();
  }, []);

  async function handleLoadCaptcha() {
    setLoadingCaptcha(true);
    setCaptchaImage(null);
    setCaptchaStr("");
    try {
      const result = await fetchCaptcha();
      if (result.hasCaptcha && result.captchaImage) {
        setCaptchaImage(result.captchaImage);
      } else {
        await handleSync(false);
      }
    } catch (e) {
      // error handled by hook
    } finally {
      setLoadingCaptcha(false);
    }
  }

  const persistUsername = useCallback(() => {
    try {
      if (rememberUsername && username.trim()) {
        localStorage.setItem(VTOP_USERNAME_KEY, username.trim().toUpperCase());
      } else {
        localStorage.removeItem(VTOP_USERNAME_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [rememberUsername, username]);

  async function handleSync(hasCaptcha = true) {
    if (!username.trim() || !password.trim()) return;
    if (hasCaptcha && !captchaStr.trim()) return;

    try {
      const res = await sync(username, password, hasCaptcha ? captchaStr : undefined);
      const detail =
        res && typeof res === "object" && "data" in res && res.data && typeof res.data === "object"
          ? (res.data as { message?: string }).message
          : null;
      setSyncMessage(detail ?? null);
      persistUsername();
      setSyncSuccess(true);
      setPassword("");
      if (!rememberUsername) setUsername("");
      setCaptchaStr("");
      setCaptchaImage(null);
      await fetchAttendance();
      await fetchGrades();
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch {
      // error shown via syncError
    }
  }

  const hasSyncedData = attendance.length > 0 || grades.length > 0;
  const lastSynced = attendance[0]?.syncedAt
    ? new Date(attendance[0].syncedAt).toLocaleString()
    : grades[0]?.syncedAt
      ? new Date(grades[0].syncedAt).toLocaleString()
      : null;

  const showDataSection =
    variant !== "dashboard" && hasSyncedData && (variant === "full" || variant === "syncAndGrades");

  const tabs =
    variant === "syncAndGrades"
      ? ([{ key: "grades", label: "Grades" }] as const)
      : ([
          { key: "attendance", label: "Attendance" },
          { key: "calculator", label: "Calculator" },
          { key: "grades", label: "Grades" },
        ] as const);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wifi size={18} className="text-neutral-400" />
          VTOP Sync
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Connect your VIT credentials to auto-sync attendance and grades.
          Your password is never stored.
        </p>
      </div>

      {/* Sync Form */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 space-y-4">
        {lastSynced && (
          <p className="text-xs text-neutral-500">Last synced: {lastSynced}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">VIT Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toUpperCase())}
              placeholder="e.g. 24BCE1723"
              autoComplete="username"
              className="w-full bg-[#0c0c0c] border border-neutral-800 rounded-lg px-3 py-2
                         text-sm text-white placeholder-neutral-600
                         focus:outline-none focus:border-neutral-600 transition-colors"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={e => {
                  const on = e.target.checked;
                  setRememberUsername(on);
                  try {
                    if (!on) localStorage.removeItem(VTOP_USERNAME_KEY);
                    else if (username.trim()) localStorage.setItem(VTOP_USERNAME_KEY, username.trim());
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded border-neutral-600"
              />
              <span className="text-xs text-neutral-500">Remember username on this device</span>
            </label>
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">VTOP Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your VTOP password"
                className="w-full bg-[#0c0c0c] border border-neutral-800 rounded-lg px-3 py-2 pr-10
                           text-sm text-white placeholder-neutral-600
                           focus:outline-none focus:border-neutral-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {captchaImage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <label className="text-xs text-neutral-400 block">CAPTCHA</label>
                <img
                  src={`data:image/jpeg;base64,${captchaImage}`}
                  alt="CAPTCHA"
                  className="rounded-lg border border-neutral-800 bg-white"
                  style={{ imageRendering: "pixelated" }}
                />
                <input
                  type="text"
                  value={captchaStr}
                  onChange={e => setCaptchaStr(e.target.value.toUpperCase())}
                  placeholder="Type the captcha above"
                  className="w-full bg-[#0c0c0c] border border-neutral-800 rounded-lg px-3 py-2
                             text-sm text-white placeholder-neutral-600 font-mono tracking-widest
                             focus:outline-none focus:border-neutral-600 transition-colors"
                  onKeyDown={e => e.key === "Enter" && handleSync(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {syncError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
            >
              <AlertCircle size={14} />
              {syncError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {syncSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2"
            >
              <CheckCircle size={14} />
              <span>
                Sync successful.
                {syncMessage ? (
                  <span className="block mt-1 text-neutral-300 font-normal">{syncMessage}</span>
                ) : (
                  " Data updated."
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!captchaImage ? (
          <button
            onClick={handleLoadCaptcha}
            disabled={loadingCaptcha || syncing || !username.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 bg-white text-black
                       text-sm font-medium rounded-lg py-2 px-4
                       hover:bg-neutral-200 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loadingCaptcha ? "animate-spin" : ""} />
            {loadingCaptcha ? "Loading..." : "Connect VTOP"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setCaptchaImage(null); setCaptchaStr(""); }}
              className="flex-1 text-sm text-neutral-400 border border-neutral-800 rounded-lg py-2
                         hover:border-neutral-600 hover:text-white transition-colors"
            >
              Refresh Captcha
            </button>
            <button
              onClick={() => handleSync(true)}
              disabled={syncing || !captchaStr.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black
                         text-sm font-medium rounded-lg py-2 px-4
                         hover:bg-neutral-200 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}
      </div>

      {/* Data Tabs (hidden on dashboard; on syncAndGrades only grades) */}
      {showDataSection && (
        <div className="space-y-4">
          {tabs.length > 1 && (
            <div className="flex gap-1 bg-[#141414] border border-neutral-800 rounded-lg p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.key ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab.key === "calculator" && <Calculator size={12} />}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Attendance Tab */}
          {variant === "full" && activeTab === "attendance" && (
            <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
              {loadingAttendance ? (
                <div className="p-6 text-center text-neutral-500 text-sm">Loading...</div>
              ) : attendance.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-sm">No attendance data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Course</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Type</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Attended</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Total</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row: VtopAttendanceRecord) => (
                      <tr key={row.id} className="border-b border-neutral-800/50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{row.courseCode}</div>
                          <div className="text-neutral-500 text-xs">{row.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-xs">{row.courseType ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{row.attended}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{row.conducted}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            row.attendancePercent >= 75 ? "text-green-500"
                              : row.attendancePercent >= 65 ? "text-yellow-400"
                              : "text-red-400"
                          }`}>
                            {row.attendancePercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Calculator Tab */}
          {variant === "full" && activeTab === "calculator" && (
            <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <Calculator size={13} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-300">Attendance Calculator</span>
                <span className="text-xs text-neutral-600 ml-auto">Target: 75%</span>
              </div>
              <AttendanceCalculator attendance={attendance} variant="vtop" />
            </div>
          )}

          {/* Grades Tab */}
          {(variant === "syncAndGrades" || activeTab === "grades") && (
            <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
              {loadingGrades ? (
                <div className="p-6 text-center text-neutral-500 text-sm">Loading...</div>
              ) : grades.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-sm">No grade data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Course</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium hidden sm:table-cell max-w-[140px]">Semester</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium hidden md:table-cell">Details</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Cr</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Gr</th>
                      <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row: VtopGradeRecord) => (
                      <tr key={row.id} className="border-b border-neutral-800/50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{row.courseCode}</div>
                          <div className="text-neutral-500 text-xs">{row.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs max-w-[140px] truncate hidden sm:table-cell" title={row.semesterLabel ?? undefined}>
                          {row.semesterLabel || "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs hidden md:table-cell max-w-[200px]">
                          {[row.faculty, row.slot].filter(Boolean).join(" · ") || row.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-300">{row.credits ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">{row.grade ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{row.gradePoint ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}