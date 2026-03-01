import { useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CustomTimeSelectProps {
  value: string; // "HH:mm" (24h)
  onChange: (time: string) => void;
  date?: Date;
}

function parse24h(hhmm: string): { hour12: number; minute: number; pm: boolean } {
  if (!hhmm || !hhmm.includes(":")) {
    return { hour12: 12, minute: 0, pm: false };
  }
  const [hStr, mStr] = hhmm.split(":");
  const h24 = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
  const min = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  let hour12: number;
  let pm: boolean;
  if (h24 === 0) {
    hour12 = 12;
    pm = false;
  } else if (h24 === 12) {
    hour12 = 12;
    pm = true;
  } else if (h24 < 12) {
    hour12 = h24;
    pm = false;
  } else {
    hour12 = h24 - 12;
    pm = true;
  }
  return { hour12, minute: min, pm };
}

function to24h(hour12: number, minute: number, pm: boolean): string {
  let h24: number;
  if (hour12 === 12) {
    h24 = pm ? 12 : 0;
  } else {
    h24 = pm ? hour12 + 12 : hour12;
  }
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimeStepper({
  onUp,
  onDown,
  label,
  displayValue,
}: {
  onUp: () => void;
  onDown: () => void;
  label: string;
  displayValue: string;
}) {
  return (
    <div className="custom-time-stepper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={onUp}
        className="custom-time-stepper__btn custom-time-stepper__btn--up"
        aria-label={`Increase ${label}`}
      >
        <ChevronUp size={14} strokeWidth={2.5} />
      </button>
      <span className="custom-time-stepper__value">{displayValue}</span>
      <button
        type="button"
        onClick={onDown}
        className="custom-time-stepper__btn custom-time-stepper__btn--down"
        aria-label={`Decrease ${label}`}
      >
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function CustomTimeSelect({ value, onChange }: CustomTimeSelectProps) {
  const { hour12, minute, pm } = useMemo(() => parse24h(value || "12:00"), [value]);

  const incHour = useCallback(() => {
    const next = hour12 === 12 ? 1 : hour12 + 1;
    onChange(to24h(next, minute, pm));
  }, [hour12, minute, pm, onChange]);
  const decHour = useCallback(() => {
    const next = hour12 === 1 ? 12 : hour12 - 1;
    onChange(to24h(next, minute, pm));
  }, [hour12, minute, pm, onChange]);

  const incMinute = useCallback(() => {
    const next = minute === 59 ? 0 : minute + 1;
    onChange(to24h(hour12, next, pm));
  }, [hour12, minute, pm, onChange]);
  const decMinute = useCallback(() => {
    const next = minute === 0 ? 59 : minute - 1;
    onChange(to24h(hour12, next, pm));
  }, [hour12, minute, pm, onChange]);

  const incPeriod = useCallback(() => onChange(to24h(hour12, minute, true)), [hour12, minute, onChange]);
  const decPeriod = useCallback(() => onChange(to24h(hour12, minute, false)), [hour12, minute, onChange]);

  return (
    <div className="custom-time-select" data-testid="custom-time-select">
      <TimeStepper
        displayValue={String(hour12)}
        label="Hour"
        onUp={incHour}
        onDown={decHour}
      />
      <TimeStepper
        displayValue={String(minute).padStart(2, "0")}
        label="Minute"
        onUp={incMinute}
        onDown={decMinute}
      />
      <TimeStepper
        displayValue={pm ? "PM" : "AM"}
        label="AM/PM"
        onUp={incPeriod}
        onDown={decPeriod}
      />
    </div>
  );
}
