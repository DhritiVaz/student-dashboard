import { InputHTMLAttributes, useState, useId } from "react";

interface FloatingInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  dark?: boolean;
}

export function FloatingInput({
  label,
  value,
  onChange,
  onKeyDown,
  error,
  hint,
  dark = true,
  type = "text",
  disabled,
  id,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const isDateLike = type === "date" || type === "datetime-local";
  const floated = isDateLike || focused || value.length > 0;
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="relative">
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={
          error ? errorId : hint ? hintId : undefined
        }
        style={{
          width: "100%",
          padding: isDateLike ? "22px 16px 8px" : "16px 16px 6px",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          color: dark ? "#fff" : "#111",
          background: dark ? (disabled ? "#1a1a1a" : "#1a1a1a") : disabled ? "#f4f4f5" : "#ffffff",
          border: `1.5px solid ${
            error ? "#f87171" : focused ? (dark ? "rgba(255,255,255,0.5)" : "#111") : dark ? "rgba(255,255,255,0.15)" : "#d1d5db"
          }`,
          borderRadius: "10px",
          outline: "none",
          transition: "border-color 200ms ease, box-shadow 200ms ease",
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.12)"
            : focused
            ? dark ? "0 0 0 3px rgba(255,255,255,0.1)" : "0 0 0 3px rgba(0,0,0,0.1)"
            : dark ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
          cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.5 : 1,
          colorScheme: dark ? "dark" : "light",
        }}
        {...props}
      />

      <label
        htmlFor={inputId}
        style={{
          position: "absolute",
          left: "16px",
          pointerEvents: "none",
          userSelect: "none",
          transformOrigin: "left center",
          transition: "top 200ms ease, font-size 200ms ease, color 200ms ease, font-weight 200ms ease",
          ...(floated
            ? {
                top: "5px",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.03em",
                color: error ? "#f87171" : focused ? (dark ? "rgba(255,255,255,0.7)" : "#111") : dark ? "rgba(255,255,255,0.4)" : "#71717a",
              }
            : {
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "14px",
                fontWeight: 400,
                color: dark ? "rgba(255,255,255,0.4)" : "#71717a",
              }),
        }}
      >
        {label}
      </label>

      {error ? (
        <p id={errorId} className="error-slide mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs" style={{ color: dark ? "rgba(255,255,255,0.4)" : "#52525b" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
