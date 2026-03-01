import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

interface Option {
  value: string;
  label: string;
}

function getTextFromNode(node: ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextFromNode).join("");
  if (typeof node === "object" && node !== null && "props" in node) {
    return getTextFromNode((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

function parseOptions(children: ReactNode): Option[] {
  const options: Option[] = [];
  const items = Array.isArray(children) ? children.flat() : [children];
  for (const child of items) {
    if (child && typeof child === "object" && "type" in child && (child as { type?: string }).type === "option") {
      const props = (child as { props?: { value?: string; children?: ReactNode } }).props;
      const value = props?.value ?? "";
      const label = getTextFromNode(props?.children) || value;
      options.push({ value, label });
    }
  }
  return options;
}

export function Select({ label, value = "", onChange, disabled, className = "", children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = parseOptions(children);
  const selected = options.find(o => o.value === value) ?? options[0];
  const displayLabel = selected?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const handleSelect = (opt: Option) => {
    if (onChange) {
      const synthetic = { target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>;
      onChange(synthetic);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#71717a" }}>
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="relative w-full flex items-center justify-between gap-2 rounded-input px-3 py-2 pr-8 text-sm text-left outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          color: "#f0f0f0",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.06)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "#333";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ color: "#52525b" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-input overflow-hidden py-1"
          style={{
            background: "#1e1e1e",
            border: "1px solid #333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                color: opt.value === value ? "#f0f0f0" : "#a1a1aa",
                background: opt.value === value ? "rgba(255,255,255,0.08)" : "transparent",
              }}
              onMouseEnter={e => {
                if (opt.value !== value) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#f0f0f0";
                }
              }}
              onMouseLeave={e => {
                if (opt.value !== value) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#a1a1aa";
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
