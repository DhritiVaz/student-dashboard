import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

interface AnimatedListProps {
  children: ReactNode;
  /** Stagger delay in ms between each item */
  staggerDelay?: number;
  /** Only animate on initial load (not when children count changes) */
  animateOnlyOnce?: boolean;
}

/**
 * Wraps list items and animates them with staggered fade + slide up.
 * Use animateOnlyOnce=true so filter changes don't re-animate.
 */
export function AnimatedList({
  children,
  staggerDelay = 50,
  animateOnlyOnce = true,
}: AnimatedListProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "animating" | "done">(
    animateOnlyOnce ? "idle" : "animating"
  );

  useEffect(() => {
    if (animateOnlyOnce && phase === "idle") {
      setPhase("animating");
    }
  }, [animateOnlyOnce, phase]);

  if (reduced || phase === "done" || (phase === "idle" && animateOnlyOnce)) {
    return <>{children}</>;
  }

  const childArray = Array.isArray(children) ? children : [children];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      onAnimationComplete={() => animateOnlyOnce && setPhase("done")}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay / 1000,
            staggerDirection: 1,
          },
        },
        hidden: {},
      }}
      className="contents"
    >
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="contents"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
