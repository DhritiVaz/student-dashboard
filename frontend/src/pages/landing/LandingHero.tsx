import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../ThemeContext";

const easing = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f5f4f2";
  const headingColor = isDark ? "#ffffff" : "#111827";
  const subtextColor = isDark ? "#9ca3af" : "#6b7280";
  const badgeBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  const badgeBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const badgeText = isDark ? "#9ca3af" : "#6b7280";
  const primaryBtnBg = isDark ? "#ffffff" : "#111827";
  const primaryBtnColor = isDark ? "#0a0a0a" : "#ffffff";
  const secondaryBtnColor = isDark ? "#9ca3af" : "#6b7280";
  const secondaryBtnHover = isDark ? "hover:text-white hover:bg-white/5" : "hover:text-gray-900 hover:bg-black/5";

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 overflow-hidden"
      style={{ background: bg }}
    >
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easing }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-8 border"
          style={{ borderColor: badgeBorder, background: badgeBg, color: badgeText }}
        >
          Built for serious students
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: easing }}
          className="text-[40px] sm:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.1] mb-6"
          style={{ color: headingColor }}
        >
          Your Academic Life,
          <br />
          Beautifully Organized.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easing }}
          className="text-lg max-w-[560px] mx-auto leading-relaxed mb-10"
          style={{ color: subtextColor }}
        >
          Track grades, manage assignments, organize notes, and never miss a deadline -- all in one place built for students.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: easing }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Link
            to="/register"
            className="px-8 py-4 rounded-input font-semibold transition-all duration-150"
            style={{ color: primaryBtnColor, background: primaryBtnBg }}
          >
            Get started
          </Link>
          <a
            href="#features"
            className={`flex items-center gap-2 px-6 py-4 rounded-input transition-all duration-150 ${secondaryBtnHover}`}
            style={{ color: secondaryBtnColor }}
          >
            <Play size={16} fill="currentColor" />
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}
