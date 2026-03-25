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
  layoutKey?: string;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1
    ? (parts[0][0] ?? "?").toUpperCase()
    : ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase() || "?";
}

// ── NavItem is outside Sidebar so framer-motion layoutId works correctly ──
function NavItem({
  label, href, icon: Icon, exact, isSettings, collapsed, onClose, reduced, layoutKey,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  isSettings?: boolean;
  collapsed: boolean;
  onClose?: () => void;
  reduced: boolean;
  layoutKey: string;
}) {
  return (
    <NavLink
      to={href}
      end={exact}
      onClick={onClose}
      title={collapsed ? label : undefined}
      className="relative flex items-center mb-[1px]"
      style={{ height: 34 }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            reduced ? (
              <span
                className="absolute inset-0"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderLeft: "2px solid rgba(255,255,255,0.7)",
                }}
              />
            ) : (
              <motion.span
                layoutId={isSettings ? `nav-pill-settings-${layoutKey}` : `nav-pill-${layoutKey}`}
                className="absolute inset-0"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderLeft: "2px solid rgba(255,255,255,0.7)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )
          )}
          <span
            className="relative flex items-center w-full h-full"
            style={{
              paddingLeft: collapsed ? 14 : 12,
              paddingRight: collapsed ? 14 : 12,
              gap: 9,
            }}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 2 : 1.6}
              style={{
                color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                transition: "color 0.15s",
                flexShrink: 0,
              }}
            />
            {!collapsed && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                  transition: "color 0.15s",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({
  onClose, collapsed = false, onToggleCollapse, layoutKey = "default",
}: SidebarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const reduced = useReducedMotion();

  async function handleLogout() {
    setLoggingOut(true);
    try { if (refreshToken) await logoutApi(refreshToken); }
    finally { logout(); navigate("/login", { replace: true }); }
  }

  const width = collapsed ? 52 : 220;
  const ease = "cubic-bezier(0.32, 0.72, 0, 1)";
  const dur = 280;

  return (
    <aside
      className="flex flex-col h-full select-none overflow-hidden"
      style={{
        width,
        minWidth: width,
        background: "#090909",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        transition: reduced ? "none" : `width ${dur}ms ${ease}`,
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 44,
          padding: "0 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.2)", width: 22, height: 22 }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
          >
            {collapsed
              ? <PanelLeft size={15} strokeWidth={1.6} />
              : <PanelLeftClose size={15} strokeWidth={1.6} />
            }
          </button>
        ) : (
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 20, height: 20,
              background: "rgba(255,255,255,0.9)",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 900, color: "#000", letterSpacing: "-0.05em" }}>SD</span>
          </div>
        )}

        {!collapsed && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "-0.02em",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Student Dashboard
          </span>
        )}

        {onClose && !collapsed && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 md:hidden transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "6px 0" }}>
        {mainNav.map(({ label, href, icon, exact }) => (
          <NavItem
            key={href}
            label={label}
            href={href}
            icon={icon}
            exact={exact}
            collapsed={collapsed}
            onClose={onClose}
            reduced={reduced}
            layoutKey={layoutKey}
          />
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "6px 0" }}>
        <NavItem
          label="Settings"
          href="/settings"
          icon={Settings}
          isSettings
          collapsed={collapsed}
          onClose={onClose}
          reduced={reduced}
          layoutKey={layoutKey}
        />

        {/* User row */}
        <div
          className="flex items-center"
          style={{
            height: 34,
            padding: collapsed ? "0 14px" : "0 12px",
            gap: 9,
            marginTop: 2,
          }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 22, height: 22,
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.45)",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {getInitials(user?.name)}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {user?.name ?? "User"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Sign out"
                className="flex-shrink-0 flex items-center justify-center transition-colors duration-150 disabled:opacity-40"
                style={{ color: "rgba(255,255,255,0.18)", width: 22, height: 22 }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
              >
                <LogOut size={13} strokeWidth={1.6} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}