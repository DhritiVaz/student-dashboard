import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchInput({ value, onChange, placeholder = "Search…", "aria-label": ariaLabel, className = "", ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#52525b" }} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-input pl-9 pr-3 py-2 text-sm outline-none transition-all duration-150"
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          color: "#f0f0f0",
          colorScheme: "dark",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
          e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(255,255,255,0.06)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "#333";
          e.currentTarget.style.boxShadow   = "none";
        }}
        {...props}
      />
    </div>
  );
}
