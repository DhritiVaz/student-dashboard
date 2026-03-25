import { useRef, useEffect, useCallback, useMemo } from "react";

interface CustomTimeSelectProps {
  value: string; // "HH:mm" 24h
  onChange: (time: string) => void;
  date?: Date;
}

function parse24h(hhmm: string) {
  if (!hhmm?.includes(":")) return { hour: 9, minute: 0 };
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10) || 0);
  return { hour: Math.min(23, Math.max(0, h)), minute: Math.min(59, Math.max(0, m)) };
}

const ITEM_H = 32;

function ScrollColumn({
  items,
  selected,
  onSelect,
  label,
}: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = items.findIndex(i => i.value === selected);
    if (idx < 0) return;
    const target = idx * ITEM_H - (el.clientHeight / 2) + ITEM_H / 2;
    el.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [selected, items]);

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.2)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <div
        ref={listRef}
        style={{
          height: ITEM_H * 5,
          width: "100%",
          overflowY: "auto",
          scrollSnapType: "y mandatory",
        }}
        aria-label={label}
      >
        {items.map(item => (
          <div
            key={item.value}
            onClick={() => onSelect(item.value)}
            style={{
              height: ITEM_H,
              scrollSnapAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: item.value === selected ? 600 : 400,
              color: item.value === selected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
              background: item.value === selected ? "rgba(255,255,255,0.07)" : "transparent",
              transition: "background 0.1s, color 0.1s",
              userSelect: "none",
            }}
            onMouseEnter={e => {
              if (item.value !== selected)
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={e => {
              if (item.value !== selected)
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomTimeSelect({ value, onChange }: CustomTimeSelectProps) {
  const { hour, minute } = useMemo(() => parse24h(value || "09:00"), [value]);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: String(i).padStart(2, "0"),
    })),
    []
  );

  const minutes = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      value: i,
      label: String(i).padStart(2, "0"),
    })),
    []
  );

  const setHour = useCallback(
    (h: number) => onChange(`${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`),
    [minute, onChange]
  );
  const setMinute = useCallback(
    (m: number) => onChange(`${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
    [hour, onChange]
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 6px",
        borderRadius: 8,
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.08)",
        width: "100%",
      }}
    >
      <ScrollColumn items={hours}   selected={hour}   onSelect={setHour}   label="hr"  />
      <div style={{
        width: 1,
        background: "rgba(255,255,255,0.06)",
        flexShrink: 0,
        alignSelf: "stretch",
        margin: "4px 0",
      }} />
      <ScrollColumn items={minutes} selected={minute} onSelect={setMinute} label="min" />
    </div>
  );
}