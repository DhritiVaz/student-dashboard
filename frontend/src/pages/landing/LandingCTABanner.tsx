import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../../ThemeContext";

export function LandingCTABanner() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#141414" : "#ffffff";
  const headingColor = isDark ? "#ffffff" : "#111827";
  const subtextColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
  const primaryBtnBg = isDark ? "#ffffff" : "#111827";
  const primaryBtnColor = isDark ? "#0a0a0a" : "#ffffff";
  const subLinkColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const subLinkHoverColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
  const subDotColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";

  return (
    <section className="py-24 px-4" style={{ background: bg }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-100px", once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: headingColor }}>
          Ready to take control of your academics?
        </h2>
        <p className="text-lg mb-8" style={{ color: subtextColor }}>
          Same tools as above--pick up where the hero left off.
        </p>
        <Link
          to="/register"
          className="inline-block px-10 py-4 rounded-input font-semibold transition-all duration-150"
          style={{ color: primaryBtnColor, background: primaryBtnBg }}
        >
          Get started
        </Link>
        <p className="text-sm mt-6" style={{ color: subLinkColor }}>
          <Link to="/login" className="underline underline-offset-2" style={{ color: subLinkColor }} onMouseEnter={e => (e.currentTarget.style.color = subLinkHoverColor)} onMouseLeave={e => (e.currentTarget.style.color = subLinkColor)}>Already use the app? Sign in</Link>
          <span style={{ color: subDotColor }} className="mx-2">.</span>
          No credit card . Free
        </p>
      </motion.div>
    </section>
  );
}
