import { useState } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, type Toast, type ToastType } from "../stores/toastStore";

/* ─── Per-type visual config ───────────────────────────────────────────── */
const CONFIG: Record<
  ToastType,
  { bg: string; border: string; iconColor: string; textColor: string; icon: React.ReactNode }
> = {
  success: {
    bg: "#0c1f14",
    border: "rgba(16,185,129,0.25)",
    iconColor: "#10b981",
    textColor: "#a7f3d0",
    icon: <CheckCircle2 size={15} strokeWidth={2} />,
  },
  error: {
    bg: "#1f0c0c",
    border: "rgba(239,68,68,0.25)",
    iconColor: "#ef4444",
    textColor: "#fca5a5",
    icon: <AlertCircle size={15} strokeWidth={2} />,
  },
  warning: {
    bg: "#1f160a",
    border: "rgba(245,158,11,0.25)",
    iconColor: "#f59e0b",
    textColor: "#fde68a",
    icon: <AlertTriangle size={15} strokeWidth={2} />,
  },
  info: {
    bg: "#0a1420",
    border: "rgba(59,130,246,0.25)",
    iconColor: "#3b82f6",
    textColor: "#bfdbfe",
    icon: <Info size={15} strokeWidth={2} />,
  },
};

/* ─── Single toast item ─────────────────────────────────────────────────── */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: () => void;
}) {
  const [exiting, setExiting] = useState(false);
  const cfg = CONFIG[toast.type];

  function dismiss() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onRemove, 280);
  }

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
        minWidth: 260,
        maxWidth: 360,
        pointerEvents: "all",
      }}
    >
      {/* Icon */}
      <span style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }}>
        {cfg.icon}
      </span>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          lineHeight: "1.45",
          color: cfg.textColor,
        }}
      >
        {toast.message}
      </span>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          color: "rgba(255,255,255,0.22)",
          flexShrink: 0,
          marginTop: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          transition: "color 150ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ─── Container ─────────────────────────────────────────────────────────── */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
