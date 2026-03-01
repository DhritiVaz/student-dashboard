import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            "rounded-lg border px-3 py-2 text-sm outline-none transition",
            "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
            error
              ? "border-red-400 bg-red-50 focus:ring-red-400"
              : "border-gray-300 bg-white",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
