import { Plus } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  /** Icon node — rendered inside a small circle */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Label for the primary action button */
  actionLabel?: string;
  onAction?: () => void;
  /** Use when the action doesn't need a Plus prefix */
  actionIcon?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}: EmptyStateProps) {
  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-card px-8 py-16
                 flex flex-col items-center text-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      {icon && (
        <div
          className="w-11 h-11 rounded-full bg-[#f5f5f5] border border-[#e5e7eb]
                     flex items-center justify-center mb-4"
        >
          {icon}
        </div>
      )}

      <p className="text-sm font-medium text-[#111] mb-1">{title}</p>

      {description && (
        <p className="text-xs text-[#9ca3af] mb-5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionIcon ?? <Plus size={14} />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
