import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CustomTimeSelect } from "./CustomTimeSelect";
import { useTheme } from "../../ThemeContext";

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onClick?: () => void;
  focused?: boolean;
  error?: boolean;
  dark?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  function CustomInput({ dark, value, onClick, disabled, focused, error, ...props }, ref) {
    const textColor = dark ? "#fff" : "#111";
    const bg = dark ? "#1a1a1a" : "#ffffff";
    const border = error
      ? "#f87171"
      : focused
        ? dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"
        : dark ? "rgba(255,255,255,0.15)" : "#d1d5db";
    const shadow = error
      ? "0 0 0 3px rgba(239,68,68,0.12)"
      : focused
        ? dark ? "0 0 0 3px rgba(255,255,255,0.1)" : "0 0 0 3px rgba(0,0,0,0.08)"
        : dark ? "none" : "0 1px 2px rgba(0,0,0,0.05)";

    return (
      <input
        ref={ref}
        type="text"
        readOnly
        value={value ?? ""}
        onClick={onClick}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "22px 16px 8px",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          color: textColor,
          caretColor: textColor,
          background: bg,
          borderRadius: "10px",
          border: `1.5px solid ${border}`,
          boxShadow: shadow,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        {...props}
      />
    );
  }
);

export function DateTimeInput({ label, value, onChange, disabled, error }: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const date = value ? new Date(value) : null;
  const hasValue = !!value && value.length >= 16;
  const floated = hasValue || open;

  const labelColor = error
    ? "#f87171"
    : open
      ? isDark ? "rgba(255,255,255,0.7)" : "#111"
      : isDark ? "rgba(255,255,255,0.4)" : "#71717a";

  const handleChange = (d: Date | null) => {
    if (!d) { onChange(""); return; }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    onChange(`${y}-${m}-${day}T${h}:${min}`);
  };

  return (
    <div className="relative">
      <DatePicker
        selected={date}
        onChange={handleChange}
        onCalendarOpen={() => setOpen(true)}
        onCalendarClose={() => setOpen(false)}
        showTimeInput
        timeInputLabel="Time"
        dateFormat="MM/dd/yyyy h:mm aa"
        customTimeInput={<CustomTimeSelect value="" onChange={() => {}} />}
        disabled={disabled}
        isClearable
        clearButtonTitle="Clear"
        showMonthDropdown
        showYearDropdown
        dropdownMode="scroll"
        minDate={new Date(2000, 0, 1)}
        maxDate={new Date(2100, 11, 31)}
        customInput={
          <CustomInput dark={isDark} focused={open} error={!!error} />
        }
        className="datetime-picker-dark"
        popperClassName="datetime-picker-dark-popper"
        popperPlacement="bottom-start"
      />
      <label
        htmlFor="datetime-input"
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
                color: labelColor,
              }
            : {
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "14px",
                fontWeight: 400,
                color: isDark ? "rgba(255,255,255,0.4)" : "#71717a",
              }),
        }}
      >
        {label}
      </label>

      {error && (
        <p className="error-slide mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
