import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { googleLoginApi, registerApi } from "../../lib/authApi";
import { FloatingInput } from "../../components/ui/FloatingInput";
import { ContinueWithGoogleButton } from "../../components/auth/ContinueWithGoogleButton";

type Status = "idle" | "loading" | "success" | "error";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Password strength ────────────────────────────────────────────────────── */
interface Strength {
  score: number;
  label: string;
  color: string;
}
function calcStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "", color: "#e5e7eb" };
  let pts = 0;
  if (pw.length >= 8) pts++;
  if (pw.length >= 12) pts++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) pts++;
  if (/[0-9]/.test(pw)) pts++;
  if (/[^A-Za-z0-9]/.test(pw)) pts++;
  if (pts <= 2) return { score: 33,  label: "Weak",   color: "#ef4444" };
  if (pts <= 3) return { score: 66,  label: "Fair",   color: "#f59e0b" };
  return              { score: 100, label: "Strong", color: "#10b981" };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [status, setStatus]           = useState<Status>("idle");
  const [shaking, setShaking]         = useState(false);
  const [leaving, setLeaving]         = useState(false);
  const [googleBusy, setGoogleBusy]   = useState(false);

  const strength = calcStrength(password);
  const busy = status === "loading" || status === "success" || googleBusy;

  async function triggerShake() {
    setShaking(true);
    await sleep(360);
    setShaking(false);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!validateEmail(email)) {
      e.email = "Enter a valid email address.";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (!confirm) {
      e.confirm = "Please confirm your password.";
    } else if (password !== confirm) {
      e.confirm = "Passwords do not match.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setServerError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      return;
    }
    setErrors({});
    setStatus("loading");

    try {
      const { user, accessToken, refreshToken } = await registerApi(email, password, name.trim());
      setAuth(user, accessToken, refreshToken);
      setStatus("success");
      await sleep(650);
      setLeaving(true);
      await sleep(280);
      await new Promise((r) => setTimeout(r, 0));
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; message?: string } }; message?: string })?.response;
      const msg =
        res?.data?.error ??
        res?.data?.message ??
        (res ? "Could not create account. Please try again." : "Connection error. Check your internet and try again.");
      setServerError(msg);
      setStatus("error");
      triggerShake();
    }
  }

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
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; message?: string } } })?.response;
      const msg =
        res?.data?.error ??
        res?.data?.message ??
        (res ? "Google sign-in failed. Try again or register with email." : "Connection error. Check your internet and try again.");
      setServerError(msg);
      triggerShake();
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div
      className={`auth-form-container w-full max-w-[380px] form-enter${shaking ? " form-shake" : ""}${leaving ? " page-leave" : ""}`}
    >
      {/* Heading */}
      <div className="field-1 mb-8">
        <h1 className="font-bold tracking-tight" style={{ fontSize: 28, color: "rgba(255,255,255,0.9)" }}>
          Create account
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Start your academic journey
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">

          <div className="field-2">
            <FloatingInput
              dark
              label="Full name"
              type="text"
              value={name}
              onChange={setName}
              error={errors.name}
              autoComplete="name"
              disabled={busy}
            />
          </div>

          <div className="field-3">
            <FloatingInput
              dark
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              disabled={busy}
            />
          </div>

          <div className="field-4">
            <FloatingInput
              dark
              label="Password"
              type="password"
              passwordToggle
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="new-password"
              disabled={busy}
            />
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: `${strength.score}%`, background: strength.color }}
                  />
                </div>
                <p
                  className="mt-1 text-xs font-medium transition-colors duration-300"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="field-5">
            <FloatingInput
              dark
              label="Confirm password"
              type="password"
              passwordToggle
              value={confirm}
              onChange={setConfirm}
              error={errors.confirm}
              autoComplete="new-password"
              disabled={busy}
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

          <div className="pt-1">
            <button
              type="submit"
              disabled={busy}
              className="btn-solid btn-auth w-full flex items-center justify-center gap-2.5 rounded-[10px] font-semibold"
              style={{ padding: "11px 14px", fontSize: "15px", letterSpacing: "0.01em" }}
            >
              {status === "loading" ? (
                <>
                  <span className="css-spinner" />
                  Creating account…
                </>
              ) : status === "success" ? (
                <>
                  <svg className="check-pop w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Account created!
                </>
              ) : (
                "Create account"
              )}
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ background: "#0a0a0a", color: "rgba(255,255,255,0.35)" }}>
                or continue with
              </span>
            </div>
          </div>

          <ContinueWithGoogleButton
            disabled={busy}
            loading={googleBusy}
            onCredential={handleGoogleCredential}
          />
        </div>
      </form>

      <p className="mt-7 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium hover:underline transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
