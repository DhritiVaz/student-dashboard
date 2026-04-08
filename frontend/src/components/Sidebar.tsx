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
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useTheme } from "../ThemeContext";

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
  width?: number;
  isResizing?: boolean;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1
    ? (parts[0][0] ?? "?").toUpperCase()
    : ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase() || "?";
}

export function Sidebar({
  onClose, collapsed = false, onToggleCollapse, layoutKey = "default",
  width: widthProp, isResizing = false,
}: SidebarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUserPopover, setShowUserPopover] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Derive effective collapsed from width prop or collapsed prop
  const effectiveCollapsed = widthProp !== undefined ? widthProp <= 80 : collapsed;
  const renderWidth = widthProp ?? (effectiveCollapsed ? 56 : 264);

  // Theme colors
  const bgColor = isDark ? "#1a1a1a" : "#f4f4f5";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textSecondary = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.5)";
  const iconInactive = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const iconActive = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.8)";
  const textInactive = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const textActive = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.8)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const iconSecondary = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)";
  const iconSecondaryHover = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)";
  const brandingColor = isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.8)";
  const userAvatarBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const userAvatarText = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const userNameText = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.7)";
  const logoutColor = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.4)";
  const logoutHover = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.7)";
  const popoverBg = isDark ? "#242424" : "#ffffff";
  const popoverBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";

  // Close popover on outside click
  useEffect(() => {
    if (!showUserPopover) return;
    function handleOutsideClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowUserPopover(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showUserPopover]);

  async function handleLogout() {
    setLoggingOut(true);
    try { if (refreshToken) await logoutApi(refreshToken); }
    finally { logout(); navigate("/login", { replace: true }); }
  }

  const ease = "cubic-bezier(0.32, 0.72, 0, 1)";
  const dur = 280;

  function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
    if (collapsed) return <div className="h-2" aria-hidden />;
    return (
      <div
        className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: textSecondary }}
      >
        {children}
      </div>
    );
  }

  function NavItem({
    label, href, icon: Icon, exact, isSettings, collapsed, onClose, reduced, layoutKey, isResizing,
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
    isResizing: boolean;
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
              (reduced || isResizing) ? (
                <span
                  className="absolute inset-0 rounded-md"
                  style={{ background: activeBg }}
                />
              ) : (
                <motion.span
                  layoutId={isSettings ? `nav-pill-settings-${layoutKey}` : `nav-pill-${layoutKey}-${href}`}
                  initial={false}
                  className="absolute inset-0 rounded-md"
                  style={{ background: activeBg }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )
            )}
            {/* Active left accent bar */}
            {isActive && (
              <span
                className="absolute left-0 rounded-full z-10"
                style={{ width: 3, top: 6, bottom: 6, background: "#E87040" }}
              />
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
                    color: isActive ? iconActive : iconInactive,
                    transition: "color 0.15s",
                  }}
                />
              </div>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 420,
                    color: isActive ? textActive : textInactive,
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

  return (
    <aside
      className="flex flex-col h-full select-none overflow-hidden"
      style={{
        width: renderWidth,
        minWidth: renderWidth,
        background: bgColor,
        borderRight: `1px solid ${borderColor}`,
        transition: (reduced || isResizing) ? "none" : `width ${dur}ms ${ease}`,
      }}
    >
      <div
        className="flex items-center flex-shrink-0"
        style={{ height: 48, paddingLeft: 12, paddingRight: 12, justifyContent: "flex-start", gap: 10, borderBottom: `1px solid ${borderColor}` }}
      >
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center justify-center flex-shrink-0 transition-colors duration-150 rounded-md"
            style={{ color: iconSecondary, width: 28, height: 28 }}
            onMouseEnter={e => (e.currentTarget.style.color = iconSecondaryHover)}
            onMouseLeave={e => (e.currentTarget.style.color = iconSecondary)}
          >
            {effectiveCollapsed ? <PanelLeft size={17} strokeWidth={1.6} /> : <PanelLeftClose size={17} strokeWidth={1.6} />}
          </button>
        ) : (
          <div
            className="flex items-center justify-center flex-shrink-0 rounded"
            style={{ width: 24, height: 24, background: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.8)", color: isDark ? "#111" : "#fff" }}
          >
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "-0.05em" }}>SD</span>
          </div>
        )}

        {!effectiveCollapsed && (
          <span style={{ fontSize: 14, fontWeight: 500, color: brandingColor, letterSpacing: "-0.02em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Student Dashboard
          </span>
        )}

        {onClose && !effectiveCollapsed && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 md:hidden transition-colors duration-150 p-1 rounded"
            style={{ color: iconSecondary }}
            onMouseEnter={e => (e.currentTarget.style.color = iconSecondaryHover)}
            onMouseLeave={e => (e.currentTarget.style.color = iconSecondary)}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: "8px 8px 6px" }}>
        <SectionLabel collapsed={effectiveCollapsed}>Workspace</SectionLabel>
        {workspaceNav.map(({ label, href, icon, exact }) => (
          <NavItem
            key={href}
            label={label}
            href={href}
            icon={icon}
            exact={exact}
            collapsed={effectiveCollapsed}
            onClose={onClose}
            reduced={reduced}
            layoutKey={layoutKey}
            isResizing={isResizing}
          />
        ))}
        <SectionLabel collapsed={effectiveCollapsed}>Planning</SectionLabel>
        {planningNav.map(({ label, href, icon }) => (
          <NavItem
            key={href}
            label={label}
            href={href}
            icon={icon}
            collapsed={effectiveCollapsed}
            onClose={onClose}
            reduced={reduced}
            layoutKey={layoutKey}
            isResizing={isResizing}
          />
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${borderColor}`, padding: "8px" }}>
        <NavItem
          label="Settings"
          href="/settings"
          icon={Settings}
          isSettings
          collapsed={effectiveCollapsed}
          onClose={onClose}
          reduced={reduced}
          layoutKey={layoutKey}
          isResizing={isResizing}
        />

        {/* User area */}
        {effectiveCollapsed ? (
          /* Collapsed: avatar with sign-out popover (portal to avoid overflow-hidden clip) */
          <div className="mt-1" style={{ paddingLeft: 7, paddingRight: 8 }}>
            <button
              ref={avatarBtnRef}
              type="button"
              onClick={() => {
                if (avatarBtnRef.current) {
                  const rect = avatarBtnRef.current.getBoundingClientRect();
                  setPopoverAnchor({ x: rect.right + 8, y: rect.top });
                }
                setShowUserPopover(p => !p);
              }}
              title={user?.name ?? "User"}
              className="flex items-center justify-center rounded-full transition-colors duration-150"
              style={{
                width: 28, height: 28,
                background: showUserPopover ? "#E87040" : userAvatarBg,
                color: showUserPopover ? "#fff" : userAvatarText,
                fontSize: 10, fontWeight: 600,
              }}
            >
              {getInitials(user?.name)}
            </button>

            {showUserPopover && popoverAnchor && createPortal(
              <div
                ref={popoverRef}
                className="rounded-lg overflow-hidden"
                style={{
                  position: "fixed",
                  left: popoverAnchor.x,
                  top: popoverAnchor.y,
                  background: popoverBg,
                  border: `1px solid ${popoverBorder}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  minWidth: 140,
                  zIndex: 9999,
                  transform: "translateY(-100%)",
                  marginTop: 28,
                }}
              >
                {user?.name && (
                  <div
                    className="px-3 py-2 text-xs truncate"
                    style={{ color: textInactive, borderBottom: `1px solid ${popoverBorder}` }}
                  >
                    {user.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setShowUserPopover(false); handleLogout(); }}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-40"
                  style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={13} strokeWidth={1.6} />
                  Sign out
                </button>
              </div>,
              document.body
            )}
          </div>
        ) : (
          /* Expanded: avatar + name + logout button */
          <div
            className="flex items-center rounded-md mt-1"
            style={{ minHeight: 40, paddingLeft: 10, paddingRight: 10, justifyContent: "flex-start", gap: 10 }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 24, height: 24, background: userAvatarBg, color: userAvatarText, fontSize: 10, fontWeight: 600 }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 450, color: userNameText, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                {user?.name ?? "User"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out"
              className="flex-shrink-0 flex items-center justify-center transition-colors duration-150 disabled:opacity-40 rounded-md p-1.5"
              style={{ color: logoutColor }}
              onMouseEnter={e => (e.currentTarget.style.color = logoutHover)}
              onMouseLeave={e => (e.currentTarget.style.color = logoutColor)}
            >
              <LogOut size={15} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
