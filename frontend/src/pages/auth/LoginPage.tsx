import { useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { loginApi } from "../../lib/authApi";
import { FloatingInput } from "../../components/ui/FloatingInput";

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

  return (
    <div
      ref={formRef}
      className={`auth-form-container w-full max-w-[380px] form-enter${shaking ? " form-shake" : ""}${leaving ? " page-leave" : ""}`}
    >
      <div className="field-1 mb-8">
        <h1 className="font-bold tracking-tight" style={{ fontSize: 28, color: "rgba(255,255,255,0.9)" }}>
          Continue where you left off
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">

          <div className="field-2">
            <FloatingInput
              dark
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled={status === "loading" || status === "success"}
            />
          </div>

          <div className="field-3">
            <FloatingInput
              dark
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              disabled={status === "loading" || status === "success"}
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
              disabled={status === "loading" || status === "success"}
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
        </div>
      </form>

      <p className="field-5 mt-7 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium hover:underline transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
