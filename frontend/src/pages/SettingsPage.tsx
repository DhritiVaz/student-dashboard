import { useEffect, useRef, useState } from "react";
import { User, ShieldCheck, Palette, LayoutDashboard, GraduationCap, LogOut } from "lucide-react";
import { FloatingInput } from "../components/ui/FloatingInput";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../stores/authStore";
import { useMe, useUpdateProfile, useChangePassword, useLogoutAllSessions } from "../hooks/api/users";
import { logoutApi } from "../lib/authApi";
import { useNavigate } from "react-router-dom";
import {
  PREF_SIDEBAR_START, PREF_REDUCED_MOTION,
  PREF_SHOW_GREETING, PREF_DEADLINE_DAYS,
  PREF_ATTENDANCE_SAFE, PREF_ATTENDANCE_WARN, PREF_ATTENDANCE_TARGET,
  readBool, readNum, writeBool, writeNum, writeStr,
} from "../lib/prefs";

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab = "profile" | "appearance" | "dashboard" | "academics" | "account";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",    label: "Profile",    icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "academics",  label: "Academics",  icon: GraduationCap },
  { id: "account",    label: "Account",    icon: ShieldCheck },
];

// ─── Reusable primitives ────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex", alignItems: "center",
        width: 40, height: 22, borderRadius: 999, padding: 2, cursor: "pointer", flexShrink: 0,
        background: checked ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.1)",
        border: "1.5px solid " + (checked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"),
        transition: "background 180ms, border-color 180ms",
      }}
    >
      <span style={{
        display: "block", width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
        background: checked ? "#111" : "rgba(255,255,255,0.4)",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 180ms, background 180ms",
      }} />
    </button>
  );
}

function Row({
  label, desc, danger = false, children,
}: { label: string; desc?: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6" style={{ minHeight: 40 }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: danger ? "#f87171" : "rgba(255,255,255,0.78)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />;
}

function Card({ title, desc, children }: { title?: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
      {(title || desc) && (
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {title && <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{title}</p>}
          {desc  && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>}
        </div>
      )}
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function NumInput({
  value, onChange, min, max, unit,
}: { value: number; onChange: (n: number) => void; min: number; max: number; unit?: string }) {
  const [raw, setRaw] = useState(String(value));
  // sync if parent value changes (e.g. on reset)
  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit(s: string) {
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    setRaw(String(value)); // reset display to actual value
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
          background: "#1a1a1a", color: "rgba(255,255,255,0.85)",
          border: "1.5px solid rgba(255,255,255,0.13)", borderRadius: 8,
          fontSize: 14, outline: "none", fontVariantNumeric: "tabular-nums",
          transition: "border-color 150ms",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
        onBlurCapture={e => (e.target.style.borderColor = "rgba(255,255,255,0.13)")}
      />
      {unit && <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{unit}</span>}
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
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors"
          style={{
            background: value === opt.value ? "rgba(255,255,255,0.06)" : "transparent",
            border: "1.5px solid " + (value === opt.value ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"),
          }}
        >
          <span style={{
            width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
            border: "1.5px solid " + (value === opt.value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)"),
            background: value === opt.value ? "rgba(255,255,255,0.88)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 150ms, background 150ms",
          }}>
            {value === opt.value && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#111" }} />
            )}
          </span>
          <span>
            <span className="block text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{opt.label}</span>
            {opt.desc && <span className="block text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{opt.desc}</span>}
          </span>
        </button>
      ))}
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

  return (
    <div className="space-y-4">
      <Card title="Personal information">
        <div className="flex items-center gap-4 pb-1">
          <div className="flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0"
            style={{ width: 52, height: 52, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", letterSpacing: "-0.02em" }}>
            {getInitials(name || live?.name)}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{name || "No name"}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{email || "No email"}</p>
          </div>
        </div>
        <Divider />
        <FloatingInput dark label="Full name"      value={name}  onChange={setName}  autoComplete="name" />
        <FloatingInput dark label="Email address"  type="email"  value={email} onChange={setEmail} autoComplete="email" />
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
      <FloatingInput dark label="Current password" type="password" passwordToggle value={cur} onChange={setCur} autoComplete="current-password" />
      <FloatingInput dark label="New password"      type="password" passwordToggle value={nw}  onChange={setNw}  autoComplete="new-password" />
      <FloatingInput dark label="Confirm new password" type="password" passwordToggle value={cnf} onChange={setCnf} autoComplete="new-password" />
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
  const toast = useToast();

  const [showGreeting, setShowGreeting] = useState(() => readBool(PREF_SHOW_GREETING, true));
  const [deadlineDays, setDeadlineDays] = useState(() => readNum(PREF_DEADLINE_DAYS, 14));

  function toggleGreeting(v: boolean) {
    writeBool(PREF_SHOW_GREETING, v);
    setShowGreeting(v);
    toast.success(v ? "Greeting restored." : "Greeting hidden.");
  }

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
                  background: deadlineDays === d ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                  color: deadlineDays === d ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  border: "1.5px solid " + (deadlineDays === d ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"),
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

// ─── Main page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Manage your profile, preferences, and account.</p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-0.5 p-1 mb-6 rounded-xl w-fit max-w-full overflow-x-auto"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)" }}
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
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)",
              }}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.6} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content — max width for readability */}
      <div className="max-w-[600px]">
        {tab === "profile"    && <ProfileTab />}
        {tab === "appearance" && <AppearanceTab />}
        {tab === "dashboard"  && <DashboardTab />}
        {tab === "academics"  && <AcademicsTab />}
        {tab === "account"    && <AccountTab />}
      </div>
    </div>
  );
}
