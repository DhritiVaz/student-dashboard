import { Link } from "react-router-dom";
import { useTheme } from "../../ThemeContext";

const productLinks = [
  { to: "#features", label: "Features" },
  { to: "#how-it-works", label: "How it works" },
  { to: "#", label: "Pricing" },
];

export function LandingFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const linkHoverColor = isDark ? "#e5e7eb" : "#374151";
  const subtextColor = isDark ? "#6b7280" : "rgba(0,0,0,0.3)";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const linkColor = isDark ? "#9ca3af" : "#6b7280";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";

  function NavLink({ to, children, className = "" }: { to: string; children: React.ReactNode; className?: string }) {
    return (
      <Link
        to={to}
        className={`transition-colors duration-200 ${className}`}
        style={{ color: linkColor }}
        onMouseEnter={e => (e.currentTarget.style.color = linkHoverColor)}
        onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
      >
        {children}
      </Link>
    );
  }

  return (
    <footer className="border-t py-16 px-4" style={{ background: bg, borderColor }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="block font-semibold mb-4" style={{ color: titleColor }}>
              Student Dashboard
            </Link>
            <p className="text-sm max-w-[200px]" style={{ color: mutedColor }}>
              Your academic life, beautifully organized.
            </p>
            <p className="text-sm mt-6" style={{ color: subtextColor }}>© 2026 Student Dashboard</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: titleColor }}>Product</h4>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <NavLink to={l.to}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: titleColor }}>Account</h4>
            <p className="text-sm leading-relaxed" style={{ color: mutedColor }}>
              <Link to="/login" style={{ color: linkColor }} className="hover:text-inherit" onMouseEnter={e => (e.currentTarget.style.color = linkHoverColor)} onMouseLeave={e => (e.currentTarget.style.color = linkColor)}>Sign in</Link>
              <span style={{ color: subtextColor }} className="mx-2">.</span>
              <Link to="/register" style={{ color: linkColor }} className="hover:text-inherit" onMouseEnter={e => (e.currentTarget.style.color = linkHoverColor)} onMouseLeave={e => (e.currentTarget.style.color = linkColor)}>Get started</Link>
              <span style={{ color: subtextColor }} className="mx-2">.</span>
              <Link to="/dashboard" style={{ color: linkColor }} className="hover:text-inherit" onMouseEnter={e => (e.currentTarget.style.color = linkHoverColor)} onMouseLeave={e => (e.currentTarget.style.color = linkColor)}>App</Link>
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: titleColor }}>Legal</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="#">Privacy</NavLink>
              </li>
              <li>
                <NavLink to="#">Terms</NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-center text-sm" style={{ color: subtextColor, borderTop: `1px solid ${borderColor}` }}>
          Made with love for students everywhere
        </div>
      </div>
    </footer>
  );
}
