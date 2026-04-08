import { ButtonHTMLAttributes } from "react";
import { useTheme } from "../../ThemeContext";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  children,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      isDark
        ? "bg-white text-black hover:shadow-[0_6px_18px_-4px_rgba(255,255,255,0.15)] active:scale-[0.97] rounded-input transition-all duration-150"
        : "bg-white text-[#111] border border-[#e5e7eb] hover:bg-[#f5f5f5] hover:border-[#d1d5db] active:scale-[0.97] rounded-input transition-all duration-150",
    secondary:
      isDark
        ? "bg-transparent text-[#d4d4d8] border border-[#333] hover:border-[#555] hover:text-white active:scale-[0.97] rounded-input"
        : "bg-transparent text-[#374151] border border-[#d1d5db] hover:border-[#9ca3af] hover:text-[#111827] active:scale-[0.97] rounded-input",
    ghost:
      isDark
        ? "bg-transparent text-[#71717a] hover:text-[#f0f0f0] hover:bg-white/[0.06] active:scale-[0.97] rounded-input"
        : "bg-transparent text-[#6b7280] hover:text-[#111827] hover:bg-[#f5f5f5] active:scale-[0.97] rounded-input",
    danger:
      isDark
        ? "bg-transparent text-red-400 border border-red-900/50 hover:bg-red-950/40 hover:border-red-700/50 active:scale-[0.97] rounded-input"
        : "bg-transparent text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 active:scale-[0.97] rounded-input",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2 text-[13px]",
    lg: "px-5 py-2.5 text-[14px]",
  };

  return (
    <button
      disabled={disabled ?? loading}
      className={[base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className].join(" ")}
      style={props.style}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
