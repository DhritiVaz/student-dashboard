import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const easing = [0.22, 1, 0.36, 1] as const;

export function LandingCTABanner() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#080808" : "#fafaf9";
  const innerBg = isDark ? "#111111" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const headingColor = isDark ? "#f5f5f4" : "#1c1917";
  const subtextColor = isDark ? "#a8a29e" : "#78716c";
  const primaryBtnBg = isDark ? "#f5f5f4" : "#1c1917";
  const primaryBtnColor = isDark ? "#1c1917" : "#fafaf9";
  const secondaryColor = isDark ? "#a8a29e" : "#78716c";

  return (
    <section className="py-24 px-4" style={{ background: bg }}>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-80px", once: true }}
        transition={{ duration: 0.7, ease: easing }}
        className="max-w-3xl mx-auto rounded-3xl border p-12 text-center"
        style={{ background: innerBg, borderColor }}
      >
        <h2
          className="mb-4"
          style={{
            fontFamily: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: headingColor,
          }}
        >
          Ready to take control of
          <br />
          <span style={{ fontStyle: "italic" }}>your academics?</span>
        </h2>

        <p className="text-base mb-10 max-w-md mx-auto" style={{ color: subtextColor }}>
          Join students who use Student Dashboard to stay on top of grades, attendance, and deadlines — every semester.
        </p>

        <Link
          to="/register"
          className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-200 hover:opacity-90 mb-6"
          style={{ color: primaryBtnColor, background: primaryBtnBg }}
        >
          Get started — it's free
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>

        <p className="text-xs" style={{ color: secondaryColor }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: secondaryColor }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
