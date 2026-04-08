import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../ThemeContext";

const easing = [0.22, 1, 0.36, 1] as const;

const featureTags = [
  "CGPA Calculator",
  "Attendance Tracker",
  "Smart Calendar",
  "Note Editor",
  "Task Manager",
  "Assignment Tracker",
  "VTOP Sync",
  "LMS Sync",
  "Semester Planning",
  "Course Manager",
  "Mindspace",
  "File Storage",
];

export function LandingHero() {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#080808" : "#fafaf9";
  const headingColor = isDark ? "#f5f5f4" : "#1c1917";
  const subtextColor = isDark ? "#a8a29e" : "#78716c";
  const accentColor = isDark ? "#d6d3d1" : "#44403c";
  const tagBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const tagBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const tagText = isDark ? "#a8a29e" : "#78716c";
  const primaryBtnBg = isDark ? "#f5f5f4" : "#1c1917";
  const primaryBtnColor = isDark ? "#1c1917" : "#fafaf9";
  const secondaryColor = isDark ? "#a8a29e" : "#78716c";
  const dotColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
      style={{ background: bg }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Radial fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #080808 100%)"
            : "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #fafaf9 100%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easing }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest mb-10 border"
          style={{ borderColor: tagBorder, background: tagBg, color: tagText }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isDark ? "#86efac" : "#16a34a" }}
          />
          Built for VIT students
        </motion.div>

        {/* Main heading — Playfair Display */}
        <motion.h1
          initial={reduced ? {} : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: easing }}
          style={{
            fontFamily: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
            color: headingColor,
            fontSize: "clamp(56px, 10vw, 108px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Student
          <br />
          <span style={{ fontStyle: "italic", color: accentColor }}>Dashboard</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easing }}
          className="text-base sm:text-lg max-w-[520px] mx-auto leading-relaxed mt-7 mb-10"
          style={{ color: subtextColor }}
        >
          Track grades, manage attendance, organize notes, and sync with VTOP &amp; LMS — everything you need in one place.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: easing }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <Link
            to="/register"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:opacity-90"
            style={{ color: primaryBtnColor, background: primaryBtnBg }}
          >
            Get started — it's free
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
          <Link
            to="/login"
            className="px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-150 hover:opacity-70"
            style={{ color: secondaryColor }}
          >
            Sign in
          </Link>
        </motion.div>

        {/* Feature tags marquee */}
        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
        >
          <div
            className="flex gap-2 w-max"
            style={{
              animation: reduced ? "none" : "marquee 28s linear infinite",
            }}
          >
            {[...featureTags, ...featureTags].map((tag, i) => (
              <span
                key={i}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border"
                style={{ background: tagBg, borderColor: tagBorder, color: tagText }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

    </section>
  );
}
