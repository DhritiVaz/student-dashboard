import { useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { googleLoginApi, loginApi } from "../../lib/authApi";
import { FloatingInput } from "../../components/ui/FloatingInput";
import { ContinueWithGoogleButton } from "../../components/auth/ContinueWithGoogleButton";
import { useTheme } from "../../ThemeContext";

type Status = "idle" | "loading" | "success" | "error";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [shaking, setShaking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const from = (location.state as { from?: string })?.from ?? "/dashboard";

  async function triggerShake() {
    setShaking(true);
    await sleep(360);
    setShaking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;
    setServerError("");
    setStatus("loading");

    try {
      const { user, accessToken, refreshToken } = await loginApi(email, password);
      setAuth(user, accessToken, refreshToken);
      setStatus("success");
      await sleep(650);
      setLeaving(true);
      await sleep(280);
      // Allow store to settle before navigation so dashboard receives token on first render
      await new Promise((r) => setTimeout(r, 0));
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; message?: string } }; message?: string })?.response;
      const msg =
        res?.data?.error ??
        res?.data?.message ??
        (res ? "Invalid email or password. Please try again." : "Connection error. Check your internet and try again.");
      setServerError(msg);
      setStatus("error");
      triggerShake();
    }
  }

  const formLocked = status === "loading" || status === "success" || googleBusy;
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const iconColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  async function handleGoogleCredential(idToken: string) {
    if (status === "success") return;
    setServerError("");
    setGoogleBusy(true);
    try {
      const { user, accessToken, refreshToken } = await googleLoginApi(idToken);
      setAuth(user, accessToken, refreshToken);
      setStatus("success");
      await sleep(650);
      setLeaving(true);
      await sleep(280);
      await new Promise((r) => setTimeout(r, 0));
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; message?: string } } })?.response;
      const msg =
        res?.data?.error ??
        res?.data?.message ??
        (res ? "Google sign-in failed. Try again or use email." : "Connection error. Check your internet and try again.");
      setServerError(msg);
      triggerShake();
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div
      ref={formRef}
      className={`auth-form-container w-full max-w-[380px] form-enter${shaking ? " form-shake" : ""}${leaving ? " page-leave" : ""}`}
    >
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: iconColor }}
        onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)")}
        title={isDark ? "Switch to light" : "Switch to dark"}
      >
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div className="field-1 mb-8">
        <h1 className="font-bold tracking-tight" style={{ fontSize: 28, color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}>
          Continue where you left off
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">

          <div className="field-2">
            <FloatingInput
              dark={isDark}
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled={formLocked}
            />
          </div>

          <div className="field-3">
            <FloatingInput
              dark={isDark}
              label="Password"
              type="password"
              passwordToggle
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              disabled={formLocked}
            />
          </div>

          {serverError && (
            <div
              className="error-slide rounded-lg px-4 py-3 text-sm text-red-600"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              {serverError}
            </div>
          )}

          <div className="field-4 pt-1">
            <button
              type="submit"
              disabled={formLocked}
              className="btn-solid btn-auth w-full flex items-center justify-center gap-2.5 rounded-[10px] font-semibold"
              style={{ padding: "11px 14px", fontSize: "15px", letterSpacing: "0.01em" }}
            >
              {status === "loading" ? (
                <>
                  <span className="css-spinner" />
                  Signing in…
                </>
              ) : status === "success" ? (
                <>
                  <svg className="check-pop w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Signed in!
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ background: isDark ? "#0a0a0a" : "#fafafa", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                or continue with
              </span>
            </div>
          </div>

          <ContinueWithGoogleButton
            disabled={formLocked}
            loading={googleBusy}
            onCredential={handleGoogleCredential}
          />
        </div>
      </form>

      <p className="field-5 mt-7 text-center text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium hover:underline transition-colors duration-150"
          style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
