import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { useTheme } from "../../ThemeContext";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchInput({ value, onChange, placeholder = "Search…", "aria-label": ariaLabel, className = "", ...props }: SearchInputProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#52525b" : "#9ca3af" }} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-input pl-9 pr-3 py-2 text-sm outline-none transition-all duration-150"
        style={{
          background: isDark ? "#1e1e1e" : "#ffffff",
          border: `1px solid ${isDark ? "#333" : "rgba(0,0,0,0.15)"}`,
          color: isDark ? "#f0f0f0" : "#111",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)";
          e.currentTarget.style.boxShadow   = isDark ? "0 0 0 3px rgba(255,255,255,0.06)" : "0 0 0 3px rgba(0,0,0,0.06)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = isDark ? "#333" : "rgba(0,0,0,0.15)";
          e.currentTarget.style.boxShadow   = "none";
        }}
        {...props}
      />
    </div>
  );
}
