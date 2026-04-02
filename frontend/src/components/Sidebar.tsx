import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, GraduationCap,
  ClipboardList, FileText, CheckSquare, Calendar,
  Settings, X, LogOut, PanelLeftClose, PanelLeft,
  BarChart2, Sigma, FolderOpen, BookMarked, Brain,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { logoutApi } from "../lib/authApi";
import { useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const workspaceNav = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, exact: true },
  { label: "Attendance", href: "/attendance", icon: BarChart2 },
  { label: "CGPA",       href: "/cgpa",       icon: Sigma },
  { label: "LMS",        href: "/lms",        icon: BookMarked },
  { label: "Mindspace",  href: "/mindspace",  icon: Brain },
  { label: "Semesters",  href: "/semesters",  icon: GraduationCap },
  { label: "Courses",    href: "/courses",    icon: BookOpen },
];

const planningNav = [
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Notes",       href: "/notes",       icon: FileText },
  { label: "Files",       href: "/files",       icon: FolderOpen },
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
      className="relative flex items-center mb-px rounded-md"
      style={{ minHeight: 36 }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            reduced ? (
              <span
                className="absolute inset-0 rounded-md"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            ) : (
              <motion.span
                layoutId={isSettings ? `nav-pill-settings-${layoutKey}` : `nav-pill-${layoutKey}-${href}`}
                className="absolute inset-0 rounded-md"
                style={{ background: "rgba(255,255,255,0.08)" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )
          )}
          <span
            className="relative flex items-center w-full h-full rounded-md"
            style={{ paddingLeft: 10, paddingRight: 12, justifyContent: "flex-start", gap: 10 }}
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22 }}>
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.65}
                style={{
                  color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.4)",
                  transition: "color 0.15s",
                }}
              />
            </div>
            {!collapsed && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 420,
                  color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.5)",
                  transition: "color 0.15s",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.25,
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

function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-2" aria-hidden />;
  return (
    <div
      className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: "rgba(255,255,255,0.28)" }}
    >
      {children}
    </div>
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

  const width = collapsed ? 56 : 264;
  const ease = "cubic-bezier(0.32, 0.72, 0, 1)";
  const dur = 280;

  return (
    <aside
      className="flex flex-col h-full select-none overflow-hidden"
      style={{
        width,
        minWidth: width,
        background: "#1a1a1a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: reduced ? "none" : `width ${dur}ms ${ease}`,
      }}
    >
      <div
        className="flex items-center flex-shrink-0"
        style={{ height: 48, paddingLeft: 12, paddingRight: 12, justifyContent: "flex-start", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center justify-center flex-shrink-0 transition-colors duration-150 rounded-md"
            style={{ color: "rgba(255,255,255,0.35)", width: 28, height: 28 }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            {collapsed ? <PanelLeft size={17} strokeWidth={1.6} /> : <PanelLeftClose size={17} strokeWidth={1.6} />}
          </button>
        ) : (
          <div
            className="flex items-center justify-center flex-shrink-0 rounded"
            style={{ width: 24, height: 24, background: "rgba(255,255,255,0.92)" }}
          >
            <span style={{ fontSize: 9, fontWeight: 900, color: "#111", letterSpacing: "-0.05em" }}>SD</span>
          </div>
        )}

        {!collapsed && (
          <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.72)", letterSpacing: "-0.02em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Student Dashboard
          </span>
        )}

        {onClose && !collapsed && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 md:hidden transition-colors duration-150 p-1 rounded"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: "8px 8px 6px" }}>
        <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
        {workspaceNav.map(({ label, href, icon, exact }) => (
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
        <SectionLabel collapsed={collapsed}>Planning</SectionLabel>
        {planningNav.map(({ label, href, icon }) => (
          <NavItem
            key={href}
            label={label}
            href={href}
            icon={icon}
            collapsed={collapsed}
            onClose={onClose}
            reduced={reduced}
            layoutKey={layoutKey}
          />
        ))}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px" }}>
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
        <div
          className="flex items-center rounded-md mt-1"
          style={{ minHeight: 40, paddingLeft: 10, paddingRight: 10, justifyContent: "flex-start", gap: 10 }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 24, height: 24, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600 }}
          >
            {getInitials(user?.name)}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 13, fontWeight: 450, color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                  {user?.name ?? "User"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Sign out"
                className="flex-shrink-0 flex items-center justify-center transition-colors duration-150 disabled:opacity-40 rounded-md p-1.5"
                style={{ color: "rgba(255,255,255,0.28)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
              >
                <LogOut size={15} strokeWidth={1.6} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
