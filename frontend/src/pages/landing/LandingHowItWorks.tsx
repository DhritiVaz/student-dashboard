import { motion } from "framer-motion";
import { UserPlus, RefreshCw, TrendingUp } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create your account",
    desc: "Sign up in seconds. Choose your semester, set up your profile, and you're ready to go.",
  },
  {
    num: "02",
    icon: RefreshCw,
    title: "Sync or add your courses",
    desc: "Connect your VTOP account to auto-import courses, grades, and attendance — or add them manually.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Track everything in one place",
    desc: "Monitor your CGPA, attendance, tasks, deadlines, and notes all from a single beautiful dashboard.",
  },
];

const easing = [0.22, 1, 0.36, 1] as const;

export function LandingHowItWorks() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#0e0e0e" : "#f5f5f4";
  const headingColor = isDark ? "#f5f5f4" : "#1c1917";
  const subtextColor = isDark ? "#a8a29e" : "#78716c";
  const cardBg = isDark ? "#161616" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const iconBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const iconBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const iconColor = isDark ? "#d6d3d1" : "#44403c";
  const titleColor = isDark ? "#f5f5f4" : "#1c1917";
  const descColor = isDark ? "#a8a29e" : "#78716c";
  const numColor = isDark ? "#3d3d3d" : "#d6d3d1";
  const connectorColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const badgeBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const badgeBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  return (
    <section id="how-it-works" className="py-24 px-4" style={{ background: bg }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-80px", once: true }}
          transition={{ duration: 0.6, ease: easing }}
          className="text-center mb-20"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest mb-6 border"
            style={{ borderColor: badgeBorder, background: badgeBg, color: subtextColor }}
          >
            How it works
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: headingColor,
            }}
          >
            Up and running in{" "}
            <span style={{ fontStyle: "italic" }}>minutes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-[3.5rem] left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] h-px"
            style={{ background: connectorColor }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-60px", once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: easing }}
              className="relative p-7 rounded-2xl border"
              style={{ background: cardBg, borderColor: cardBorder }}
            >
              {/* Step number */}
              <span
                className="block text-5xl font-black mb-4 leading-none"
                style={{ color: numColor, fontFamily: "inherit" }}
              >
                {step.num}
              </span>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border mb-5"
                style={{ background: iconBg, borderColor: iconBorder }}
              >
                <step.icon size={20} style={{ color: iconColor }} strokeWidth={1.8} />
              </div>

              <h3 className="text-base font-semibold mb-2" style={{ color: titleColor }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: descColor }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
