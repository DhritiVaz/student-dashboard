import { ReactNode, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
          if (first) first.focus();
          else panelRef.current?.focus();
        });
      });
      return () => cancelAnimationFrame(t);
    } else {
      previousActiveRef.current?.focus?.();
      previousActiveRef.current = null;
    }
  }, [open]);

  const duration = reduced ? 0 : 0.2;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={false}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          className="relative rounded-card w-full"
          style={{
            maxWidth,
            background: "#1a1a1a",
            border: "1px solid #2e2e2e",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
          initial={
            reduced
              ? {}
              : { opacity: 0, scale: 0.95 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? {} : { opacity: 0, scale: 0.95 }}
          transition={{
            duration,
            ease: "easeOut",
          }}
        >
          {/* Header */}
          {title && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #252525" }}
            >
              <h3
                id={titleId}
                className="text-sm font-semibold"
                style={{ color: "#f0f0f0" }}
              >
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg transition-colors duration-150"
                style={{ color: "#52525b" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#a1a1aa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#52525b")
                }
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
