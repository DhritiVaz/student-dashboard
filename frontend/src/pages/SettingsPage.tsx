import { useEffect, useRef, useState } from "react";
import { User, ShieldCheck, Palette, LayoutDashboard, GraduationCap, LogOut, Wifi, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { FloatingInput } from "../components/ui/FloatingInput";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../stores/authStore";
import { useMe, useUpdateProfile, useChangePassword, useLogoutAllSessions } from "../hooks/api/users";
import { logoutApi } from "../lib/authApi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import {
  PREF_SIDEBAR_START, PREF_REDUCED_MOTION,
  PREF_SHOW_GREETING, PREF_DEADLINE_DAYS,
  PREF_ATTENDANCE_SAFE, PREF_ATTENDANCE_WARN, PREF_ATTENDANCE_TARGET,
  readBool, readNum, writeBool, writeNum, writeStr,
} from "../lib/prefs";
import { useFetchCaptcha, useVtopCredentials } from "../hooks/api/vtop";

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab = "profile" | "appearance" | "dashboard" | "academics" | "vtop" | "account";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",    label: "Profile",    icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "academics",  label: "Academics",  icon: GraduationCap },
  { id: "vtop",       label: "VTOP",       icon: Wifi },
  { id: "account",    label: "Account",    icon: ShieldCheck },
];

// ─── Reusable primitives ────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Colors
  const trackOff = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const trackOn = isDark ? "rgba(255,255,255,0.88)" : "#E87040";
  const knobUnchecked = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const knobChecked = isDark ? "#111" : "#ffffff";

  const trackBorder = isDark
    ? checked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"
    : checked ? "rgba(232,112,64,0.6)" : "rgba(0,0,0,0.2)";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex", alignItems: "center",
        width: 40, height: 22, borderRadius: 999, padding: 2, cursor: "pointer", flexShrink: 0,
        background: checked ? trackOn : trackOff,
        border: `1.5px solid ${checked ? trackBorder : trackBorder}`,
        transition: "background 180ms, border-color 180ms",
      }}
    >
      <span style={{
        display: "block", width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
        background: checked ? knobChecked : knobUnchecked,
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 180ms, background 180ms",
      }} />
    </button>
  );
}

function Row({
  label, desc, danger = false, children,
}: { label: string; desc?: string; danger?: boolean; children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const labelColor = danger ? "#f87171" : isDark ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.78)";
  const descColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)";

  return (
    <div className="flex items-center justify-between gap-6" style={{ minHeight: 40 }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: labelColor }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: descColor }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Divider() {
  const { theme } = useTheme();
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  return <div style={{ borderTop: `1px solid ${borderColor}` }} />;
}

function Card({ title, desc, children }: { title?: string; desc?: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#111" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const titleColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
  const descColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)";

  return (
    <div className="rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
      {(title || desc) && (
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
          {title && <p className="text-sm font-semibold" style={{ color: titleColor }}>{title}</p>}
          {desc && <p className="text-xs mt-0.5" style={{ color: descColor }}>{desc}</p>}
        </div>
      )}
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function NumInput({
  value, onChange, min, max, unit,
}: { value: number; onChange: (n: number) => void; min: number; max: number; unit?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit(s: string) {
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    setRaw(String(value));
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
        style={{
          width: 70, padding: "5px 8px", textAlign: "center",
          background: isDark ? "#1a1a1a" : "#f3f4f6",
          color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)",
          border: `1.5px solid ${isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.2)"}`,
          borderRadius: 8,
          fontSize: 14, outline: "none", fontVariantNumeric: "tabular-nums",
          transition: "border-color 150ms",
        }}
        onFocus={e => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)")}
        onBlurCapture={e => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.2)")}
      />
      {unit && <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>{unit}</span>}
    </div>
  );
}

function RadioGroup<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; desc?: string }[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-2">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors"
            style={{
              background: active ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : "transparent",
              border: `1.5px solid ${active
                ? (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)")
                : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`,
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              border: `1.5px solid ${active
                ? (isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)")
                : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.2)")}`,
              background: active ? (isDark ? "rgba(255,255,255,0.88)" : "#E87040") : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "border-color 150ms, background 150ms",
            }}>
              {active && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isDark ? "#111" : "#fff",
                }} />
              )}
            </span>
            <span>
              <span className="block text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)" }}>{opt.label}</span>
              {opt.desc && <span className="block text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>{opt.desc}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? (parts[0][0] ?? "?").toUpperCase()
    : ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

// ─── Profile tab ──────────────────────────────────────────────────────────
function ProfileTab() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const toast = useToast();
  const { user: authUser, refreshToken, setAuth } = useAuthStore();
  const { data: me, refetch } = useMe();
  const updateProfile = useUpdateProfile();

  const live = me ?? authUser;
  const [name,  setName]  = useState(live?.name  ?? "");
  const [email, setEmail] = useState(live?.email ?? "");

  useEffect(() => {
    if (live) { setName(live.name ?? ""); setEmail(live.email ?? ""); }
  }, [live?.name, live?.email]);

  const dirty = name !== (live?.name ?? "") || email !== (live?.email ?? "");

  async function save() {
    try {
      const updated = await updateProfile.mutateAsync({ name, email });
      const at = useAuthStore.getState().accessToken;
      if (authUser && at && refreshToken) setAuth({ ...authUser, name: updated.name, email: updated.email }, at, refreshToken);
      await refetch();
      toast.success("Profile updated.");
    } catch {
      toast.error("Could not update profile.");
    }
  }

  const avatarBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const avatarColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const nameTextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
  const emailTextColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)";

  return (
    <div className="space-y-4">
      <Card title="Personal information">
        <div className="flex items-center gap-4 pb-1">
          <div className="flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0"
            style={{ width: 52, height: 52, background: avatarBg, color: avatarColor, letterSpacing: "-0.02em" }}>
            {getInitials(name || live?.name)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: nameTextColor }}>{name || "No name"}</p>
            <p className="text-xs mt-0.5" style={{ color: emailTextColor }}>{email || "No email"}</p>
          </div>
        </div>
        <Divider />
        <FloatingInput dark={isDark} label="Full name"      value={name}  onChange={setName}  autoComplete="name" />
        <FloatingInput dark={isDark} label="Email address"  type="email"  value={email} onChange={setEmail} autoComplete="email" />
        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={save} loading={updateProfile.isPending} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Security section (inside Account tab) ────────────────────────────────
function PasswordSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const toast = useToast();
  const changePassword = useChangePassword();
  const [cur, setCur] = useState("");
  const [nw,  setNw]  = useState("");
  const [cnf, setCnf] = useState("");

  async function submit() {
    if (!cur || !nw || !cnf)  { toast.error("Fill in all password fields."); return; }
    if (nw.length < 8)         { toast.error("New password must be at least 8 characters."); return; }
    if (nw !== cnf)            { toast.error("New passwords do not match."); return; }
    try {
      await changePassword.mutateAsync({ currentPassword: cur, newPassword: nw });
      setCur(""); setNw(""); setCnf("");
      toast.success("Password changed successfully.");
    } catch {
      toast.error("Incorrect current password or server error.");
    }
  }

  return (
    <Card title="Change password" desc="Must be at least 8 characters. Google-linked accounts need an existing password to use this.">
      <FloatingInput dark={isDark} label="Current password" type="password" passwordToggle value={cur} onChange={setCur} autoComplete="current-password" />
      <FloatingInput dark={isDark} label="New password"      type="password" passwordToggle value={nw}  onChange={setNw}  autoComplete="new-password" />
      <FloatingInput dark={isDark} label="Confirm new password" type="password" passwordToggle value={cnf} onChange={setCnf} autoComplete="new-password" />
      <div className="flex justify-end pt-1">
        <Button size="sm" variant="secondary" onClick={submit} loading={changePassword.isPending}>
          Update password
        </Button>
      </div>
    </Card>
  );
}

// ─── Appearance tab ────────────────────────────────────────────────────────
function AppearanceTab() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();

  const [sidebarStart, setSidebarStart] = useState(() => readBool(PREF_SIDEBAR_START, false));
  const [motion, setMotion] = useState<"system" | "on" | "off">(() => {
    const v = localStorage.getItem(PREF_REDUCED_MOTION);
    if (v === "true")  return "on";
    if (v === "false") return "off";
    return "system";
  });

  function toggleSidebar(v: boolean) {
    writeBool(PREF_SIDEBAR_START, v);
    setSidebarStart(v);
    toast.success("Sidebar preference saved.");
  }

  function changeMotion(mode: "system" | "on" | "off") {
    writeStr(PREF_REDUCED_MOTION, mode === "system" ? null : mode === "on" ? "true" : "false");
    setMotion(mode);
    toast.success("Motion preference updated.");
  }

  return (
    <div className="space-y-4">
      <Card title="Layout">
        <Row label="Collapse sidebar on start" desc="Sidebar will start collapsed on every page load.">
          <Toggle checked={sidebarStart} onChange={toggleSidebar} />
        </Row>
      </Card>

      <Card title="Theme">
        <RadioGroup
          value={theme}
          onChange={(t) => setTheme(t as "light" | "dark")}
          options={[
            { value: "light", label: "Light", desc: "Light background with dark text" },
            { value: "dark", label: "Dark", desc: "Dark background with light text" },
          ]}
        />
      </Card>

      <Card title="Motion & animations">
        <RadioGroup
          value={motion}
          onChange={changeMotion}
          options={[
            { value: "system", label: "Follow system",   desc: "Uses your OS reduced-motion preference" },
            { value: "on",     label: "Always reduce",   desc: "Disables most animations and transitions" },
            { value: "off",    label: "Full animations", desc: "All animations on, regardless of OS setting" },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Dashboard tab ─────────────────────────────────────────────────────────
function DashboardTab() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const toast = useToast();

  const [showGreeting, setShowGreeting] = useState(() => readBool(PREF_SHOW_GREETING, true));
  const [deadlineDays, setDeadlineDays] = useState(() => readNum(PREF_DEADLINE_DAYS, 14));

  function toggleGreeting(v: boolean) {
    writeBool(PREF_SHOW_GREETING, v);
    setShowGreeting(v);
    toast.success(v ? "Greeting restored." : "Greeting hidden.");
  }

  const dlBgActive = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const dlBgInactive = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const dlTextActive = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
  const dlTextInactive = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const dlBorderActive = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
  const dlBorderInactive = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  function changeDeadlineDays(n: number) {
    writeNum(PREF_DEADLINE_DAYS, n);
    setDeadlineDays(n);
    toast.success("Deadline window updated.");
  }

  return (
    <div className="space-y-4">
      <Card title="Header" desc="Controls what appears at the top of the dashboard.">
        <Row label="Show greeting" desc='Displays "Good morning / afternoon / evening, Name" at the top.'>
          <Toggle checked={showGreeting} onChange={toggleGreeting} />
        </Row>
      </Card>

      <Card title="Upcoming deadlines" desc="How far ahead to show upcoming assignments and tasks.">
        <Row label="Lookahead window" desc="Assignments and tasks due within this many days appear in the deadlines card.">
          <div className="flex items-center gap-2">
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => changeDeadlineDays(d)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: deadlineDays === d ? dlBgActive : dlBgInactive,
                  color: deadlineDays === d ? dlTextActive : dlTextInactive,
                  border: "1.5px solid " + (deadlineDays === d ? dlBorderActive : dlBorderInactive),
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </Row>
      </Card>
    </div>
  );
}

// ─── Academics tab ─────────────────────────────────────────────────────────
function AcademicsTab() {
  const toast = useToast();

  const [safe,   setSafe]   = useState(() => readNum(PREF_ATTENDANCE_SAFE,   75));
  const [warn,   setWarn]   = useState(() => readNum(PREF_ATTENDANCE_WARN,   65));
  const [target, setTarget] = useState(() => readNum(PREF_ATTENDANCE_TARGET, 75));

  // Saved ref to debounce: save 600ms after last change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleThresholdSave(s: number, w: number, t: number) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      writeNum(PREF_ATTENDANCE_SAFE,   s);
      writeNum(PREF_ATTENDANCE_WARN,   w);
      writeNum(PREF_ATTENDANCE_TARGET, t);
      toast.success("Attendance thresholds saved.");
    }, 600);
  }

  function changeSafe(n: number) {
    const clamped = Math.max(n, warn + 1);
    setSafe(clamped);
    scheduleThresholdSave(clamped, warn, target);
  }

  function changeWarn(n: number) {
    const clamped = Math.min(n, safe - 1);
    setWarn(clamped);
    scheduleThresholdSave(safe, clamped, target);
  }

  function changeTarget(n: number) {
    setTarget(n);
    scheduleThresholdSave(safe, warn, n);
  }

  return (
    <div className="space-y-4">
      <Card
        title="Attendance thresholds"
        desc="Controls the green / yellow / red colour coding in Attendance and the Dashboard."
      >
        <Row
          label="Safe threshold"
          desc={`Attendance at or above this is shown in green. Currently ${safe}%.`}
        >
          <NumInput value={safe} onChange={changeSafe} min={warn + 1} max={100} unit="%" />
        </Row>
        <Divider />
        <Row
          label="Warning threshold"
          desc={`Attendance between warning and safe is yellow; below warning is red. Currently ${warn}%.`}
        >
          <NumInput value={warn} onChange={changeWarn} min={0} max={safe - 1} unit="%" />
        </Row>

        {/* Visual preview */}
        <div className="flex gap-2 pt-1 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
            ≥ {safe}% safe
          </span>
          <span className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.2)" }}>
            {warn}–{safe - 1}% warning
          </span>
          <span className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            &lt; {warn}% critical
          </span>
        </div>
      </Card>

      <Card
        title="Attendance calculator"
        desc="Default target used when you open the calculator on the Attendance page."
      >
        <Row label="Default target" desc="Pre-fills the calculator's target percentage field.">
          <NumInput value={target} onChange={changeTarget} min={40} max={99} unit="%" />
        </Row>
      </Card>
    </div>
  );
}

// ─── Account tab ───────────────────────────────────────────────────────────
function AccountTab() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user: authUser, refreshToken, logout } = useAuthStore();
  const logoutAll = useLogoutAllSessions();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOutOthers() {
    if (!refreshToken) { toast.error("No active session."); return; }
    try {
      await logoutAll.mutateAsync(refreshToken);
      toast.success("All other sessions signed out.");
    } catch {
      toast.error("Could not sign out other sessions.");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try { if (refreshToken) await logoutApi(refreshToken); } finally {
      logout();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="space-y-4">
      <PasswordSection />

      <Card title="Active sessions" desc="Manage where you're signed in.">
        <Row label="Sign out other devices" desc="Keeps this session active but revokes all others.">
          <Button size="sm" variant="secondary" onClick={handleSignOutOthers} loading={logoutAll.isPending}>
            Sign out others
          </Button>
        </Row>
        <Divider />
        <Row label={`Signed in as ${authUser?.email ?? "you"}`} desc="You will be redirected to the login page." danger>
          <Button size="sm" variant="danger" onClick={handleSignOut} loading={signingOut}>
            <LogOut size={13} />
            Sign out
          </Button>
        </Row>
      </Card>
    </div>
  );
}

// ─── VTOP tab ──────────────────────────────────────────────────────────────
function VtopTab() {
  const toast = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { fetchCaptcha, loading: loadingCaptcha } = useFetchCaptcha();
  const { data: credData, fetch, save, remove, loading, error } = useVtopCredentials();

  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaStr, setCaptchaStr] = useState("");

  useEffect(() => { fetch(); }, []);
  useEffect(() => { if (credData.hasCredentials && credData.username) setUsername(credData.username); }, [credData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    try {
      await save(username.trim(), password);
      toast.success("VTOP credentials saved.");
      setPassword("");
    } catch {
      toast.error("Could not save credentials.");
    }
  }

  async function handleLoadCaptcha(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const res = await fetchCaptcha();
      if (res.hasCaptcha && res.captchaImage) setCaptchaImage(res.captchaImage);
    } catch {
      toast.error("Failed to load captcha.");
    }
  }

  async function handleRemove() {
    try {
      await remove();
      setUsername("");
      setCaptchaImage(null);
      setEditing(false);
      toast.success("VTOP credentials removed.");
    } catch {
      toast.error("Could not remove credentials.");
    }
  }

  const masked = credData.username
    ? credData.username.slice(0, 2) + "•".repeat(Math.max(0, credData.username.length - 2))
    : "";

  return (
    <div className="space-y-4">
      <Card title="VTOP Connection" desc="Your VIT credentials are encrypted and stored securely.">
        {credData.hasCredentials && !editing && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)" }}>
                Username: <span className="font-mono">{masked}</span>
              </p>
              <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)" }}>Credentials stored</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Update</Button>
              <Button size="sm" variant="danger" onClick={handleRemove}><Trash2 size={12} /></Button>
            </div>
          </div>
        )}

        {(editing || !credData.hasCredentials) && (
          <form onSubmit={handleSave} className="space-y-3">
            <FloatingInput dark={isDark} label="VIT Username" value={username} onChange={setUsername} autoComplete="username" />
            <div className="relative">
              <FloatingInput dark={isDark} label="VTOP Password" type={showPassword ? "text" : "password"} passwordToggle value={password} onChange={setPassword} autoComplete="current-password" />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {editing && <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setUsername(credData.username ?? ""); setPassword(""); }}>Cancel</Button>}
              <Button size="sm" type="submit" loading={loading} disabled={!username.trim() || !password.trim()}>
                {credData.hasCredentials ? "Update" : "Save"} credentials
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const titleColor = isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.9)";
  const subtitleColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)";

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="max-w-[600px] mx-auto">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: titleColor }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: subtitleColor }}>Manage your profile, preferences, and account.</p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-0.5 p-1 mb-6 rounded-xl w-fit max-w-full overflow-x-auto"
          style={{ background: isDark ? "#141414" : "#f3f4f6", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}` }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  background: active ? (isDark ? "rgba(255,255,255,0.09)" : "#ffffff") : "transparent",
                  color: active ? (isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)") : (isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.4)"),
                }}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.6} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content — max width for readability */}
        <div>
          {tab === "profile"    && <ProfileTab />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "dashboard"  && <DashboardTab />}
          {tab === "academics"  && <AcademicsTab />}
          {tab === "vtop"       && <VtopTab />}
          {tab === "account"    && <AccountTab />}
        </div>
      </div>
    </div>
  );
}
