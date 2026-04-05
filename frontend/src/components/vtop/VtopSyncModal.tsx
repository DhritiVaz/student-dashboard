import { useState, useEffect } from "react";
import {
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  X,
  AlertCircle,
} from "lucide-react";
import { useFetchCaptcha, useVtopQuickSync, useVtopCredentials } from "../../hooks/api/vtop";
import { useTheme } from "../../ThemeContext";

export function VtopSyncModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaStr, setCaptchaStr] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needCredentials, setNeedCredentials] = useState(false);
  const [credsChecked, setCredsChecked] = useState(false);

  const { fetchCaptcha, loading: loadingCaptcha } = useFetchCaptcha();
  const { sync: quickSync, loading: syncing, error: syncError } = useVtopQuickSync();
  const {
    data: credData,
    fetch: fetchCreds,
    save: saveCreds,
    loading: credsLoading,
    error: credsError,
  } = useVtopCredentials();

  useEffect(() => {
    if (open) {
      setCredsChecked(false);
      setCaptchaImage(null);
      setCaptchaStr("");
      setSyncSuccess(false);
      setSyncMessage(null);
      setUsername("");
      setPassword("");
      setNeedCredentials(false);
      fetchCreds();
    }
  }, [open]);

  useEffect(() => {
    if (credsChecked) return;
    if (open && credData.hasCredentials !== false) {
      setCredsChecked(true);
      if (credData.hasCredentials) {
        setUsername(credData.username ?? "");
        loadCaptcha();
      } else if (!credData.hasCredentials) {
        setNeedCredentials(true);
      }
    }
  }, [credData.hasCredentials, open, credsChecked, credData.username]);

  async function loadCaptcha() {
    setCaptchaImage(null);
    setCaptchaStr("");
    try {
      const res = await fetchCaptcha();
      if (res.hasCaptcha && res.captchaImage) {
        setCaptchaImage(res.captchaImage);
      }
    } catch {
      // error shown via hook
    }
  }

  async function handleSaveCredentials() {
    if (!username.trim() || !password.trim()) return;
    try {
      await saveCreds(username.trim(), password);
      setNeedCredentials(false);
      loadCaptcha();
    } catch {
      // error via credsError
    }
  }

  async function handleQuickSync() {
    if (!captchaStr.trim()) return;
    try {
      const res = await quickSync(captchaStr);
      const detail =
        res && typeof res === "object" && "data" in res && res.data && typeof res.data === "object"
          ? (res.data as { message?: string }).message
          : null;
      setSyncMessage(detail ?? null);
      setSyncSuccess(true);
      setCaptchaStr("");
      setCaptchaImage(null);
      setPassword("");
      setTimeout(() => {
        setSyncSuccess(false);
        onClose();
      }, 3000);
    } catch {
      // error shown via syncError
    }
  }

  if (!open) return null;

  const bg = isDark ? "#0d0d0d" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const inputText = isDark ? "rgba(255,255,255,0.8)" : "#111";
  const labelColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)";
  const titleColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      style={{ paddingTop: "10vh" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-xl"
        style={{
          background: bg,
          border: `1px solid ${borderColor}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "#E87040" }} />
            <h2 className="text-sm font-semibold" style={{ color: titleColor }}>VTOP Sync</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Success */}
          {syncSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
              <CheckCircle size={14} />
              <span>
                Sync successful.
                {syncMessage && (
                  <span className="block mt-1 text-neutral-300 font-normal">{syncMessage}</span>
                )}
              </span>
            </div>
          )}

          {/* Error */}
          {(syncError || credsError) && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              <span>{syncError || credsError}</span>
            </div>
          )}

          {/* Need credentials form */}
          {needCredentials && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: labelColor }}>
                Enter your VIT credentials to enable VTOP sync. Your password is encrypted and stored securely.
              </p>
              <div>
                <label className="text-xs mb-1 block" style={{ color: labelColor }}>VIT Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="e.g. 24BCE1723"
                  autoComplete="username"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: inputText,
                  }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: labelColor }}>VTOP Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your VTOP password"
                    className="w-full rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none transition-colors"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: inputText,
                    }}
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
              <button
                onClick={handleSaveCredentials}
                disabled={credsLoading || !username.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-medium rounded-lg py-2 px-4 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Shield size={14} />
                Save & Continue
              </button>
            </div>
          )}

          {/* Captcha form */}
          {!needCredentials && (
            <div className="space-y-3">
              {credData.username && (
                <p className="text-xs" style={{ color: labelColor }}>
                  Signed in as <span className="font-mono tracking-wide" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>{credData.username}</span>
                </p>
              )}

              {captchaImage ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium block" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>CAPTCHA</label>
                  <img
                    src={`data:image/jpeg;base64,${captchaImage}`}
                    alt="CAPTCHA"
                    className="rounded-lg bg-white"
                    style={{ imageRendering: "pixelated", width: "100%", maxWidth: 160 }}
                  />
                  <input
                    type="text"
                    value={captchaStr}
                    onChange={(e) => setCaptchaStr(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleQuickSync()}
                    placeholder="Type the captcha above"
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none transition-colors"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: inputText,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: labelColor }}>
                  {loadingCaptcha ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)" }} />
                      Loading captcha…
                    </div>
                  ) : (
                    <button
                      onClick={loadCaptcha}
                      className="flex items-center justify-center gap-2 mx-auto bg-white text-black text-xs font-medium rounded-lg py-2 px-4 hover:bg-neutral-200 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Load CAPTCHA
                    </button>
                  )}
                </div>
              )}

              {/* Buttons under captcha */}
              {captchaImage && (
                <div className="flex gap-2">
                  <button
                    onClick={loadCaptcha}
                    disabled={syncing || loadingCaptcha}
                    className="flex-1 text-xs text-neutral-400 border border-neutral-800 rounded-lg py-2 hover:border-neutral-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={handleQuickSync}
                    disabled={syncing || !captchaStr.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black text-xs font-medium rounded-lg py-2 px-4 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing…" : "Sync Now"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
