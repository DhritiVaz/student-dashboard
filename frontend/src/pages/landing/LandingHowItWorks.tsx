import { motion } from "framer-motion";
import { UserPlus, Layout, ArrowUp } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const steps = [
  {
    num: "1",
    icon: UserPlus,
    title: "Sign up in seconds",
    desc: "Create your account and select your semesters.",
  },
  {
    num: "2",
    icon: Layout,
    title: "Add your courses",
    desc: "Sync from VTOP or add manually with credits and details.",
  },
  {
    num: "3",
    icon: ArrowUp,
    title: "Stay on top",
    desc: "Track grades, deadlines, notes, and attendance all in one place.",
  },
];

export function LandingHowItWorks() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f5f4f2";
  const headingColor = isDark ? "#ffffff" : "#111827";
  const numColor = isDark ? "#e5e7eb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const descColor = isDark ? "#9ca3af" : "#6b7280";
  const iconBoxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const iconBoxBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const iconColor = isDark ? "#e5e7eb" : "#374151";
  const dashBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";

  return (
    <section className="py-24 px-4" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-80px", once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: headingColor }}>
            Up and running in minutes
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i === 0 ? -40 : i === 1 ? 0 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-80px", once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative text-center md:text-left"
            >
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-12 left-[calc(50%+56px)] h-px border-t border-dashed"
                  style={{ width: "calc(100% - 112px)", borderColor: dashBorder }}
                />
              )}
              <span className="inline-block text-4xl font-bold mb-6" style={{ color: numColor }}>
                {step.num}
              </span>
              <div className="w-14 h-14 rounded-input flex items-center justify-center mb-4 mx-auto md:mx-0 border" style={{ background: iconBoxBg, borderColor: iconBoxBorder }}>
                <step.icon size={24} style={{ color: iconColor }} strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: titleColor }}>{step.title}</h3>
              <p className="text-sm" style={{ color: descColor }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
