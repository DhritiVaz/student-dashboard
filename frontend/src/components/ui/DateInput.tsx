import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps {
  label: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "22px 16px 8px",
  fontSize: "0.875rem",
  lineHeight: "1.25rem",
  color: "#fff",
  background: "#1a1a1a",
  borderRadius: "10px",
  outline: "none",
  cursor: "pointer",
};

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onClick?: () => void;
  focused?: boolean;
  error?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  function CustomInput({ value, onClick, disabled, focused, error, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        readOnly
        value={value ?? ""}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...baseInputStyle,
          border: `1.5px solid ${error ? "#f87171" : focused ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}`,
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.12)"
            : focused
              ? "0 0 0 3px rgba(255,255,255,0.1)"
              : "none",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        {...props}
      />
    );
  }
);

export function DateInput({ label, value, onChange, disabled, error }: DateInputProps) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value) : null;
  const hasValue = !!value && value.length >= 10;
  const floated = hasValue || open;

  const handleChange = (d: Date | null) => {
    if (!d) {
      onChange("");
      return;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  };

  return (
    <div className="relative">
      <DatePicker
        selected={date}
        onChange={handleChange}
        onCalendarOpen={() => setOpen(true)}
        onCalendarClose={() => setOpen(false)}
        dateFormat="MM/dd/yyyy"
        disabled={disabled}
        isClearable
        clearButtonTitle="Clear"
        todayButton="Today"
        showMonthDropdown
        showYearDropdown
        dropdownMode="scroll"
        minDate={new Date(2000, 0, 1)}
        maxDate={new Date(2100, 11, 31)}
        customInput={
          <CustomInput
            focused={open}
            error={!!error}
          />
        }
        className="datetime-picker-dark"
        popperClassName="datetime-picker-dark-popper"
      />
      <label
        htmlFor="date-input"
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
                color: error ? "#f87171" : open ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
              }
            : {
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "14px",
                fontWeight: 400,
                color: "rgba(255,255,255,0.4)",
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
