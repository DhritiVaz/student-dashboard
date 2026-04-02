import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, BookMarked } from "lucide-react";
import { useLmsSync, useLmsCourses } from "../../hooks/api/lms";

const LMS_USERNAME_KEY = "lms-remember-username";

export default function LmsSync() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookMarked size={18} className="text-neutral-400" />
          LMS Sync
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Connect your LMS credentials to sync courses, assignments, quizzes, files, and deadlines.
          Your password is never stored.
        </p>
      </div>

      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 space-y-4">
        {lastSynced && (
          <p className="text-xs text-neutral-500">Last synced: {lastSynced}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">LMS Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. 24bce1723@vitstudent.ac.in"
              autoComplete="username"
              className="w-full bg-[#0c0c0c] border border-neutral-800 rounded-lg px-3 py-2
                         text-sm text-white placeholder-neutral-600
                         focus:outline-none focus:border-neutral-600 transition-colors"
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
                className="rounded border-neutral-600"
              />
              <span className="text-xs text-neutral-500">Remember username on this device</span>
            </label>
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">LMS Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSync()}
                placeholder="Your LMS password"
                className="w-full bg-[#0c0c0c] border border-neutral-800 rounded-lg px-3 py-2 pr-10
                           text-sm text-white placeholder-neutral-600
                           focus:outline-none focus:border-neutral-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
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
              className="flex items-start gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2"
            >
              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{syncMessage ?? "Sync successful. Switch tabs to see your data."}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSync}
          disabled={syncing || !username.trim() || !password.trim()}
          className="w-full flex items-center justify-center gap-2 bg-white text-black
                     text-sm font-medium rounded-lg py-2 px-4
                     hover:bg-neutral-200 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing LMS..." : "Sync LMS"}
        </button>
      </div>

      {/* Info about what gets synced */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">What gets synced</p>
        <ul className="space-y-1.5 text-xs text-neutral-500">
          <li className="flex items-center gap-2"><span className="text-blue-400">●</span> All enrolled courses</li>
          <li className="flex items-center gap-2"><span className="text-orange-400">●</span> Assignments and deadlines from the LMS calendar</li>
          <li className="flex items-center gap-2"><span className="text-purple-400">●</span> Quizzes from each course page</li>
          <li className="flex items-center gap-2"><span className="text-amber-400">●</span> Uploaded files, folders, and resources</li>
          <li className="flex items-center gap-2"><span className="text-sky-400">●</span> External links and pages</li>
        </ul>
      </div>
    </div>
  );
}
