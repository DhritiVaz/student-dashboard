import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { FloatingInput } from "../components/ui/FloatingInput";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../stores/authStore";
import {
  useMe,
  useUpdateProfile,
  useChangePassword,
  useLogoutAllSessions,
} from "../hooks/api/users";
import { REDUCED_PREF_KEY } from "../hooks/useReducedMotion";

const SIDEBAR_START_KEY = "settings-sidebar-start-collapsed";

export default function SettingsPage() {
  const toast = useToast();
  const { user: authUser, refreshToken, setAuth } = useAuthStore();
  const { data: me, refetch } = useMe();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logoutAll = useLogoutAllSessions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [sidebarStartCollapsed, setSidebarStartCollapsed] = useState(false);
  const [forceReducedMotion, setForceReducedMotion] = useState<"system" | "on" | "off">("system");

  useEffect(() => {
    const u = me ?? authUser;
    if (u) {
      setName(u.name ?? "");
      setEmail(u.email ?? "");
    }
  }, [me, authUser]);

  useEffect(() => {
    try {
      setSidebarStartCollapsed(localStorage.getItem(SIDEBAR_START_KEY) === "true");
      const v = localStorage.getItem(REDUCED_PREF_KEY);
      if (v === "true") setForceReducedMotion("on");
      else if (v === "false") setForceReducedMotion("off");
      else setForceReducedMotion("system");
    } catch {
      /* ignore */
    }
  }, []);

  function persistSidebarPref(on: boolean) {
    try {
      if (on) localStorage.setItem(SIDEBAR_START_KEY, "true");
      else localStorage.removeItem(SIDEBAR_START_KEY);
    } catch {
      /* ignore */
    }
    setSidebarStartCollapsed(on);
    toast.success("Preference saved. Reload the app to apply sidebar default.");
  }

  function persistMotionPref(mode: "system" | "on" | "off") {
    try {
      if (mode === "system") localStorage.removeItem(REDUCED_PREF_KEY);
      else localStorage.setItem(REDUCED_PREF_KEY, mode === "on" ? "true" : "false");
    } catch {
      /* ignore */
    }
    setForceReducedMotion(mode);
    window.dispatchEvent(new Event("dashboard-prefs-changed"));
    toast.success("Motion preference updated.");
  }

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} className="text-white/40" />
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
          Settings
        </h1>
      </div>
      <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
        Profile, security, and interface preferences.
      </p>

      <section className="mb-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Profile
        </h2>
        <FloatingInput dark label="Name" value={name} onChange={setName} autoComplete="name" />
        <FloatingInput dark label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Button
          size="sm"
          onClick={async () => {
            try {
              const updated = await updateProfile.mutateAsync({ name, email });
              const at = useAuthStore.getState().accessToken;
              if (authUser && at && refreshToken) {
                setAuth(
                  { ...authUser, name: updated.name, email: updated.email },
                  at,
                  refreshToken
                );
              }
              await refetch();
              toast.success("Profile updated.");
            } catch {
              toast.error("Could not update profile.");
            }
          }}
          loading={updateProfile.isPending}
        >
          Save profile
        </Button>
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Password
        </h2>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Google-only accounts cannot set a password here until you add email/password sign-in from the backend.
        </p>
        <FloatingInput
          dark
          label="Current password"
          type="password"
          passwordToggle
          value={curPw}
          onChange={setCurPw}
          autoComplete="current-password"
        />
        <FloatingInput
          dark
          label="New password"
          type="password"
          passwordToggle
          value={newPw}
          onChange={setNewPw}
          autoComplete="new-password"
        />
        <FloatingInput
          dark
          label="Confirm new password"
          type="password"
          passwordToggle
          value={confirmPw}
          onChange={setConfirmPw}
          autoComplete="new-password"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            if (newPw !== confirmPw) {
              toast.error("New passwords do not match.");
              return;
            }
            try {
              await changePassword.mutateAsync({ currentPassword: curPw, newPassword: newPw });
              setCurPw("");
              setNewPw("");
              setConfirmPw("");
              toast.success("Password changed.");
            } catch {
              toast.error("Could not change password.");
            }
          }}
          loading={changePassword.isPending}
        >
          Update password
        </Button>
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Interface
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sidebarStartCollapsed}
            onChange={(e) => persistSidebarPref(e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Start with sidebar collapsed (new visits / reload)
          </span>
        </label>
        <div>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
            Reduced motion
          </p>
          <select
            value={forceReducedMotion}
            onChange={(e) => persistMotionPref(e.target.value as "system" | "on" | "off")}
            className="w-full rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] border border-white/15 text-white"
          >
            <option value="system">Use system setting</option>
            <option value="on">Always reduce motion</option>
            <option value="off">Never reduce motion</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Sessions
        </h2>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            if (!refreshToken) {
              toast.error("No active session.");
              return;
            }
            try {
              await logoutAll.mutateAsync(refreshToken);
              toast.success("All other sessions invalidated. Staying signed in here.");
            } catch {
              toast.error("Could not sign out other sessions.");
            }
          }}
          loading={logoutAll.isPending}
        >
          Sign out other devices
        </Button>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Revokes other refresh tokens. This session stays active.
        </p>
      </section>
    </div>
  );
}
