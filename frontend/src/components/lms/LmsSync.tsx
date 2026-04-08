import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, BookMarked } from "lucide-react";
import { useLmsSync, useLmsCourses } from "../../hooks/api/lms";
import { useTheme } from "../../ThemeContext";

const LMS_USERNAME_KEY = "lms-remember-username";

export default function LmsSync() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem(LMS_USERNAME_KEY) ?? ""; } catch { return ""; }
  });
  const [rememberUsername, setRememberUsername] = useState(() => {
    try { return localStorage.getItem(LMS_USERNAME_KEY) !== null; } catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { sync, loading: syncing, error: syncError } = useLmsSync();
  const { data: courses, fetch: fetchCourses } = useLmsCourses();

  const lastSynced = courses[0]?.syncedAt
    ? new Date(courses[0].syncedAt).toLocaleString()
    : null;

  async function handleSync() {
    if (!username.trim() || !password.trim()) return;
    try {
      const result = await sync(username, password);
      setSyncMessage(result.message);
      setSyncSuccess(true);
      setPassword("");
      try {
        if (rememberUsername && username.trim()) localStorage.setItem(LMS_USERNAME_KEY, username.trim());
        else localStorage.removeItem(LMS_USERNAME_KEY);
      } catch { /* ignore */ }
      if (!rememberUsername) setUsername("");
      await fetchCourses();
      setTimeout(() => setSyncSuccess(false), 6000);
    } catch {
      // error shown via syncError
    }
  }

  const cardBg = isDark ? "#141414" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "#0c0c0c" : "#f5f5f5";
  const inputBorderColor = isDark ? "border-neutral-800" : "border-gray-200";
  const inputText = isDark ? "text-white" : "text-gray-900";
  const inputPlaceholder = isDark ? "placeholder-neutral-600" : "placeholder-gray-400";
  const labelColor = isDark ? "text-neutral-400" : "text-gray-500";
  const titleColor = isDark ? "text-white" : "text-gray-900";
  const subtitleColor = isDark ? "text-neutral-500" : "text-gray-500";
  const iconColor = isDark ? "text-neutral-400" : "text-gray-600";
  const checkboxColor = isDark ? "border-neutral-600" : "border-gray-400";

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${titleColor}`}>
          <BookMarked size={18} className={iconColor} />
          LMS Sync
        </h2>
        <p className={`text-sm mt-1 ${subtitleColor}`}>
          Connect your LMS credentials to sync courses, assignments, quizzes, files, and deadlines.
          Your password is never stored.
        </p>
      </div>

      <div className="rounded-xl p-5 space-y-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {lastSynced && (
          <p className={`text-xs ${subtitleColor}`}>Last synced: {lastSynced}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className={`text-xs mb-1 block ${labelColor}`}>LMS Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. 24bce1723@vitstudent.ac.in"
              autoComplete="username"
              className={`w-full rounded-lg px-3 py-2 text-sm border ${inputBg} ${inputBorderColor} ${inputText} ${inputPlaceholder} focus:outline-none transition-colors`}
              onFocus={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")}
              onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)")}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => {
                  const on = e.target.checked;
                  setRememberUsername(on);
                  try {
                    if (!on) localStorage.removeItem(LMS_USERNAME_KEY);
                    else if (username.trim()) localStorage.setItem(LMS_USERNAME_KEY, username.trim());
                  } catch { /* ignore */ }
                }}
                className={`rounded ${checkboxColor}`}
              />
              <span className={`text-xs ${subtitleColor}`}>Remember username on this device</span>
            </label>
          </div>

          <div>
            <label className={`text-xs mb-1 block ${labelColor}`}>LMS Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSync()}
                placeholder="Your LMS password"
                className={`w-full rounded-lg px-3 py-2 pr-10 text-sm border ${inputBg} ${inputBorderColor} ${inputText} ${inputPlaceholder} focus:outline-none transition-colors`}
                onFocus={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {syncError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{syncError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {syncSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-sm rounded-lg px-3 py-2"
              style={isDark
                ? { color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }
                : { color: "#16a34a", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{syncMessage ?? "Sync successful. Switch tabs to see your data."}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSync}
          disabled={syncing || !username.trim() || !password.trim()}
          className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg py-2 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-[#111] text-white hover:bg-[#222]"}`}
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing LMS..." : "Sync LMS"}
        </button>
      </div>

      {/* Info about what gets synced */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${subtitleColor}`}>What gets synced</p>
        <ul className="space-y-1.5 text-xs">
          {[
            { color: "#3b82f6", label: "All enrolled courses" },
            { color: isDark ? "#f97316" : "#ea580c", label: "Assignments and deadlines from the LMS calendar" },
            { color: "#a855f7", label: "Quizzes from each course page" },
            { color: "#f59e0b", label: "Uploaded files, folders, and resources" },
            { color: "#0ea5e9", label: "External links and pages" },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span style={{ color: item.color }}>●</span>
              <span className={labelColor}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
