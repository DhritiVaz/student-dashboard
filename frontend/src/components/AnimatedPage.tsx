import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AnimatedPageProps {
  children: ReactNode;
  /** When false, don't fill height—allows flex parent to center content (e.g. auth pages) */
  fillHeight?: boolean;
}

/**
 * Wraps page content and fades in on mount (route change).
 * Re-key this component on route change to trigger the animation.
 */
export function AnimatedPage({ children, fillHeight = true }: AnimatedPageProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={fillHeight ? "h-full" : undefined}
    >
      {children}
    </motion.div>
  );
}
