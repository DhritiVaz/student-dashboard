import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, GraduationCap,
  ClipboardList, FileText, CheckSquare, Calendar,
  Settings, X, LogOut, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { logoutApi } from "../lib/authApi";
import { useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const mainNav = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, exact: true },
  { label: "Semesters",   href: "/semesters",   icon: GraduationCap },
  { label: "Courses",     href: "/courses",     icon: BookOpen },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Notes",       href: "/notes",       icon: FileText },
  { label: "Tasks",       href: "/tasks",       icon: CheckSquare },
  { label: "Calendar",    href: "/calendar",    icon: Calendar },
];

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Unique ID for layout animation - avoids duplicate layoutId when desktop + mobile both mount */
  layoutKey?: string;
}

function getInitials(name?: string | null) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1
    ? (parts[0][0] ?? "?").toUpperCase()
    : ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase() || "?";
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapse, layoutKey = "default" }: SidebarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const reduced = useReducedMotion();

  async function handleLogout() {
    setLoggingOut(true);
    try { if (refreshToken) await logoutApi(refreshToken); }
    finally { logout(); navigate("/login", { replace: true }); }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center text-[13px] font-medium group relative",
      collapsed ? "justify-center w-10 h-10 shrink-0 rounded-lg" : "gap-3 px-3 py-2 min-h-[36px] rounded-lg",
      reduced ? "transition-colors duration-150" : "transition-colors duration-200 ease-out",
      isActive ? "text-white" : "text-white/45 hover:text-white/80",
    ].join(" ");

  const ActivePill = () =>
    reduced ? (
      <span
        className="absolute inset-0 rounded-lg"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
    ) : (
      <motion.span
        layoutId={`sidebar-indicator-${layoutKey}`}
        className="absolute inset-0 rounded-lg"
        style={{ background: "rgba(255,255,255,0.08)" }}
        transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      />
    );

  const width = collapsed ? 64 : 240;
  const animDuration = 320;
  const animEase = "cubic-bezier(0.32, 0.72, 0, 1)";

  return (
    <aside
      className="flex flex-col h-full select-none overflow-hidden border-r border-black"
      style={{
        width,
        background: "#000",
        minWidth: width,
        paddingLeft: collapsed ? 0 : 0,
        transition: reduced ? "none" : `width ${animDuration}ms ${animEase}, padding ${animDuration}ms ${animEase}`,
      }}
    >
      {/* ── Brand (collapse toggle when desktop; close when mobile) ── */}
      <div
        className={`flex items-center flex-shrink-0 pt-5 pb-4 ${
          collapsed ? "justify-center px-0" : "justify-between px-4"
        }`}
      >
        <div className={`flex items-center overflow-hidden ${collapsed ? "w-10 shrink-0 justify-center" : "gap-2.5"}`}>
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`rounded-lg transition-colors duration-150 hover:bg-white/10 flex-shrink-0 flex items-center justify-center ${
                collapsed ? "w-10 h-10" : "p-2"
              }`}
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {collapsed ? <PanelLeft size={20} strokeWidth={1.8} /> : <PanelLeftClose size={20} strokeWidth={1.8} />}
            </button>
          ) : (
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.9)" }}
            >
              <span className="text-[10px] font-black tracking-tighter text-[#000]">SD</span>
            </div>
          )}
          {reduced ? (
            !collapsed && (
              <span className="text-[14px] font-semibold text-white tracking-tight leading-none">
                Student Dashboard
              </span>
            )
          ) : (
            <span
              className={`text-[14px] font-semibold text-white tracking-tight leading-none whitespace-nowrap overflow-hidden ${
                collapsed ? "opacity-0 max-w-0 min-w-0" : "opacity-100 max-w-[180px]"
              }`}
              style={{
                transition: reduced ? "none" : `max-width ${animDuration}ms ${animEase}, opacity ${animDuration}ms ${animEase}`,
              }}
            >
              Student Dashboard
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-lg transition-colors md:hidden flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div
        className="mb-1 shrink-0"
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          marginLeft: collapsed ? 12 : 16,
          marginRight: collapsed ? 12 : 16,
          transition: reduced ? "none" : `margin ${animDuration}ms ${animEase}`,
        }}
      />

      {/* ── Main nav ──────────────────────────────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto py-2 ${
          collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5 px-2"
        }`}
      >
        {mainNav.map(({ label, href, icon: Icon, exact }) => (
          <NavLink
            key={href}
            to={href}
            end={exact}
            onClick={onClose}
            className={navLinkClass}
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && <ActivePill />}
                <span className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                  <Icon
                    size={16}
                    className="transition-colors duration-150"
                    style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </span>
                {reduced ? (
                  !collapsed && <span className="relative">{label}</span>
                ) : (
                  <span
                    className={`relative whitespace-nowrap overflow-hidden ${
                      collapsed ? "max-w-0 opacity-0 min-w-0" : "max-w-[140px] opacity-100"
                    }`}
                    style={{
                      transition: reduced ? "none" : `max-width ${animDuration}ms ${animEase}, opacity ${animDuration}ms ${animEase}`,
                    }}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Settings ──────────────────────────────────────────────── */}
      <div className={`pb-2 ${!collapsed ? "px-2" : ""}`}>
        <div
          className="mb-2 shrink-0"
          style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginLeft: collapsed ? 12 : 8,
            marginRight: collapsed ? 12 : 8,
            transition: reduced ? "none" : `margin ${animDuration}ms ${animEase}`,
          }}
        />
        <div className={collapsed ? "flex justify-center" : ""}>
        <NavLink
          to="/settings"
          onClick={onClose}
          className={navLinkClass}
          title={collapsed ? "Settings" : undefined}
        >
          {({ isActive }) => (
            <>
              {isActive && <ActivePill />}
              <span className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                <Settings
                  size={16}
                  className="transition-colors duration-150"
                  style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>
              {reduced ? (
                !collapsed && <span className="relative">Settings</span>
              ) : (
                <span
                  className={`relative whitespace-nowrap overflow-hidden ${
                    collapsed ? "max-w-0 opacity-0 min-w-0" : "max-w-[140px] opacity-100"
                  }`}
                  style={{
                    transition: reduced ? "none" : `max-width ${animDuration}ms ${animEase}, opacity ${animDuration}ms ${animEase}`,
                  }}
                >
                  Settings
                </span>
              )}
            </>
          )}
        </NavLink>
        </div>
      </div>

      {/* ── User section (collapsed: avatar only; expanded: avatar + name + logout) ── */}
      <div
        className={`flex-shrink-0 py-4 ${collapsed ? "flex justify-center" : "px-4"}`}
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className={`flex items-center overflow-hidden ${
            collapsed ? "w-10 h-10 justify-center shrink-0" : "gap-2.5"
          }`}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            {getInitials(user?.name)}
          </div>

          {reduced ? (
            !collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-[11px] truncate leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 disabled:opacity-40 flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  <LogOut size={16} strokeWidth={1.8} />
                </button>
              </>
            )
          ) : (
            <>
            <div
              className={`flex-1 min-w-0 overflow-hidden ${
                collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
              }`}
              style={{
                transition: reduced ? "none" : `max-width ${animDuration}ms ${animEase}, opacity ${animDuration}ms ${animEase}`,
              }}
            >
                <p className="text-[13px] font-medium truncate leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {user?.name ?? "User"}
                </p>
                <p className="text-[11px] truncate leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {user?.email}
                </p>
              </div>
              {!collapsed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 disabled:opacity-40 flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  <LogOut size={16} strokeWidth={1.8} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
