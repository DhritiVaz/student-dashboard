import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  FileText,
  CheckSquare,
  GraduationCap,
  Zap,
} from "lucide-react";
import { useTheme } from "../../ThemeContext";

const features = [
  {
    icon: BarChart3,
    title: "GPA Tracker",
    desc: "See your weighted GPA update in real time as you add grades.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    desc: "View all deadlines, exams, and events in one clean calendar.",
  },
  {
    icon: FileText,
    title: "Note Editor",
    desc: "Write and organize notes with full markdown support.",
  },
  {
    icon: CheckSquare,
    title: "Task Manager",
    desc: "Create tasks, set priorities, and track what's done.",
  },
  {
    icon: GraduationCap,
    title: "Semester Planner",
    desc: "Organize courses by semester with full course details.",
  },
  {
    icon: Zap,
    title: "Quick Actions",
    desc: "Add assignments, notes, and tasks in seconds from anywhere.",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function LandingFeatures() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f5f4f2";
  const headingColor = isDark ? "#ffffff" : "#111827";
  const subtextColor = isDark ? "#9ca3af" : "#6b7280";
  const badgeBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const badgeBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const badgeText = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "#141414" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  const cardBorderHover = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)";
  const iconBoxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const iconBoxBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const iconColor = isDark ? "#e5e7eb" : "#374151";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const descColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <section id="features" className="py-24 px-4" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px", once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-4 border" style={{ borderColor: badgeBorder, background: badgeBg, color: badgeText }}>
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: headingColor }}>
            Everything you need to excel
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: subtextColor }}>
            Purpose-built tools for serious students who want to stay on top.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ margin: "-100px", once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={item}
              className="p-8 rounded-card border transition-all duration-200 cursor-default"
              style={{ background: cardBg, borderColor: cardBorder }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = cardBorderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = cardBorder)}
            >
              <div className="w-12 h-12 rounded-input flex items-center justify-center mb-6 border" style={{ background: iconBoxBg, borderColor: iconBoxBorder }}>
                <Icon size={22} style={{ color: iconColor }} strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: titleColor }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: descColor }}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
