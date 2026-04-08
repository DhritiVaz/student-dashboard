import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Wifi, Calculator } from "lucide-react";
import { useVtopSync, useFetchCaptcha, useVtopAttendance, useVtopGrades, VtopAttendanceRecord, VtopGradeRecord } from "../../hooks/api/vtop";
import { AttendanceCalculator } from "../attendance/AttendanceCalculator";
import { useTheme } from "../../ThemeContext";

export type VtopSyncVariant = "dashboard" | "full" | "syncAndGrades";

const VTOP_USERNAME_KEY = "vtop-remember-username";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VtopSync({ variant = "full" }: { variant?: VtopSyncVariant }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [rememberUsername, setRememberUsername] = useState(() => {
    try { return localStorage.getItem(VTOP_USERNAME_KEY) !== null; }
    catch { return false; }
  });
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem(VTOP_USERNAME_KEY) ?? ""; }
    catch { return ""; }
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

  // Theme tokens
  const cardBg         = isDark ? "#141414" : "#ffffff";
  const cardBorder     = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const inputBg        = isDark ? "#0c0c0c" : "#f5f5f5";
  const inputBorder    = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";
  const inputBorderFocus = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)";
  const inputText      = isDark ? "#ffffff" : "#111827";
  const labelColor     = isDark ? "#a1a1aa" : "#6b7280";
  const headingColor   = isDark ? "#ffffff" : "#111827";
  const subTextColor   = isDark ? "#6b7280" : "#6b7280";
  const tabBarBg       = isDark ? "#141414" : "#f4f4f5";
  const tabBarBorder   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tabActiveBg    = isDark ? "#ffffff" : "#111827";
  const tabActiveText  = isDark ? "#000000" : "#ffffff";
  const tabInactiveText = isDark ? "#a1a1aa" : "#6b7280";
  const tabInactiveHover = isDark ? "#ffffff" : "#111827";
  const primaryBtnBg   = isDark ? "#ffffff" : "#111827";
  const primaryBtnText = isDark ? "#000000" : "#ffffff";
  const primaryBtnHover = isDark ? "#e5e5e5" : "#1f2937";
  const secondaryBtnText = isDark ? "#a1a1aa" : "#6b7280";
  const secondaryBtnBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";
  const secondaryBtnHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const eyeColor       = isDark ? "#71717a" : "#9ca3af";
  const eyeHover       = isDark ? "#d4d4d8" : "#374151";
  const mutedText      = isDark ? "#52525b" : "#9ca3af";
  const tableHeaderText = isDark ? "#71717a" : "#9ca3af";
  const tableBorder    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tableMainText  = isDark ? "#ffffff" : "#111827";
  const tableSubText   = isDark ? "#71717a" : "#6b7280";
  const tableNumText   = isDark ? "#d4d4d8" : "#374151";
  const checkboxBorder = isDark ? "#52525b" : "#d1d5db";

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
    } catch {
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
    } catch { /* ignore */ }
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    color: inputText,
    outline: "none",
    transition: "border-color 150ms",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: headingColor }}>
          <Wifi size={18} style={{ color: isDark ? "#71717a" : "#9ca3af" }} />
          VTOP Sync
        </h2>
        <p className="text-sm mt-1" style={{ color: subTextColor }}>
          Connect your VIT credentials to auto-sync attendance and grades.
          Your password is never stored.
        </p>
      </div>

      {/* Sync Form */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "20px" }}
        className="space-y-4">
        {lastSynced && (
          <p className="text-xs" style={{ color: mutedText }}>Last synced: {lastSynced}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: labelColor }}>VIT Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toUpperCase())}
              placeholder="e.g. 24BCE1723"
              autoComplete="username"
              style={{ ...inputStyle, caretColor: inputText }}
              onFocus={e => (e.currentTarget.style.borderColor = inputBorderFocus)}
              onBlur={e => (e.currentTarget.style.borderColor = inputBorder)}
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
                  } catch { /* ignore */ }
                }}
                style={{ accentColor: isDark ? "#ffffff" : "#111827", borderColor: checkboxBorder }}
              />
              <span className="text-xs" style={{ color: mutedText }}>Remember username on this device</span>
            </label>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: labelColor }}>VTOP Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your VTOP password"
                style={{ ...inputStyle, paddingRight: "40px", caretColor: inputText }}
                onFocus={e => (e.currentTarget.style.borderColor = inputBorderFocus)}
                onBlur={e => (e.currentTarget.style.borderColor = inputBorder)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: eyeColor }}
                onMouseEnter={e => (e.currentTarget.style.color = eyeHover)}
                onMouseLeave={e => (e.currentTarget.style.color = eyeColor)}
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
                <label className="text-xs block" style={{ color: labelColor }}>CAPTCHA</label>
                <img
                  src={`data:image/jpeg;base64,${captchaImage}`}
                  alt="CAPTCHA"
                  className="rounded-lg bg-white"
                  style={{ border: `1px solid ${cardBorder}`, imageRendering: "pixelated" }}
                />
                <input
                  type="text"
                  value={captchaStr}
                  onChange={e => setCaptchaStr(e.target.value.toUpperCase())}
                  placeholder="Type the captcha above"
                  style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.1em", caretColor: inputText }}
                  onFocus={e => (e.currentTarget.style.borderColor = inputBorderFocus)}
                  onBlur={e => (e.currentTarget.style.borderColor = inputBorder)}
                  onKeyDown={e => e.key === "Enter" && handleSync(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {syncError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={14} />
              {syncError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {syncSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
              style={{ color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <CheckCircle size={14} />
              <span>
                Sync successful.
                {syncMessage ? (
                  <span className="block mt-1 font-normal" style={{ color: isDark ? "#d4d4d8" : "#374151" }}>{syncMessage}</span>
                ) : " Data updated."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!captchaImage ? (
          <button
            onClick={handleLoadCaptcha}
            disabled={loadingCaptcha || syncing || !username.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg py-2 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: primaryBtnBg, color: primaryBtnText }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.background = primaryBtnHover; }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = primaryBtnBg}
          >
            <RefreshCw size={14} className={loadingCaptcha ? "animate-spin" : ""} />
            {loadingCaptcha ? "Loading..." : "Connect VTOP"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setCaptchaImage(null); setCaptchaStr(""); }}
              className="flex-1 text-sm rounded-lg py-2 transition-colors"
              style={{ color: secondaryBtnText, border: `1px solid ${secondaryBtnBorder}`, background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = secondaryBtnHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Refresh Captcha
            </button>
            <button
              onClick={() => handleSync(true)}
              disabled={syncing || !captchaStr.trim()}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium rounded-lg py-2 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: primaryBtnBg, color: primaryBtnText }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.background = primaryBtnHover; }}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = primaryBtnBg}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}
      </div>

      {/* Data Tabs */}
      {showDataSection && (
        <div className="space-y-4">
          {tabs.length > 1 && (
            <div
              className="flex gap-1 rounded-lg p-1 w-fit"
              style={{ background: tabBarBg, border: `1px solid ${tabBarBorder}` }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  style={activeTab === tab.key
                    ? { background: tabActiveBg, color: tabActiveText }
                    : { color: tabInactiveText, background: "transparent" }}
                  onMouseEnter={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLButtonElement).style.color = tabInactiveHover; }}
                  onMouseLeave={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLButtonElement).style.color = tabInactiveText; }}
                >
                  {tab.key === "calculator" && <Calculator size={12} />}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Attendance Tab */}
          {variant === "full" && activeTab === "attendance" && (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              {loadingAttendance ? (
                <div className="p-6 text-center text-sm" style={{ color: mutedText }}>Loading...</div>
              ) : attendance.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: mutedText }}>No attendance data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${tableBorder}` }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Course</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Type</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Attended</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Total</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row: VtopAttendanceRecord) => (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${tableBorder}` }} className="last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: tableMainText }}>{row.courseCode}</div>
                          <div className="text-xs" style={{ color: tableSubText }}>{row.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: tableSubText }}>{row.courseType ?? "—"}</td>
                        <td className="px-4 py-3 text-right" style={{ color: tableNumText }}>{row.attended}</td>
                        <td className="px-4 py-3 text-right" style={{ color: tableNumText }}>{row.conducted}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            row.attendancePercent >= 75 ? "text-green-500"
                              : row.attendancePercent >= 65 ? "text-yellow-500"
                              : "text-red-500"
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
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <Calculator size={13} style={{ color: isDark ? "#a1a1aa" : "#9ca3af" }} />
                <span className="text-xs font-semibold" style={{ color: isDark ? "#d4d4d8" : "#374151" }}>Attendance Calculator</span>
                <span className="text-xs ml-auto" style={{ color: mutedText }}>Target: 75%</span>
              </div>
              <AttendanceCalculator attendance={attendance} variant="vtop" />
            </div>
          )}

          {/* Grades Tab */}
          {(variant === "syncAndGrades" || activeTab === "grades") && (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              {loadingGrades ? (
                <div className="p-6 text-center text-sm" style={{ color: mutedText }}>Loading...</div>
              ) : grades.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: mutedText }}>No grade data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${tableBorder}` }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Course</th>
                      <th className="text-left px-4 py-3 text-xs font-medium hidden sm:table-cell max-w-[140px]" style={{ color: tableHeaderText }}>Semester</th>
                      <th className="text-left px-4 py-3 text-xs font-medium hidden md:table-cell" style={{ color: tableHeaderText }}>Details</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Cr</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Gr</th>
                      <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: tableHeaderText }}>Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row: VtopGradeRecord) => (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${tableBorder}` }} className="last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: tableMainText }}>{row.courseCode}</div>
                          <div className="text-xs" style={{ color: tableSubText }}>{row.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[140px] truncate hidden sm:table-cell" style={{ color: tableSubText }} title={row.semesterLabel ?? undefined}>
                          {row.semesterLabel || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs hidden md:table-cell max-w-[200px]" style={{ color: isDark ? "#52525b" : "#9ca3af" }}>
                          {[row.faculty, row.slot].filter(Boolean).join(" · ") || row.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: tableNumText }}>{row.credits ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: tableMainText }}>{row.grade ?? "—"}</td>
                        <td className="px-4 py-3 text-right" style={{ color: tableNumText }}>{row.gradePoint ?? "—"}</td>
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
