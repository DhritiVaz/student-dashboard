import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  FileText,
  CheckSquare,
  GraduationCap,
  BookOpen,
  RefreshCw,
  ClipboardList,
  Brain,
  FolderOpen,
} from "lucide-react";
import { useTheme } from "../../ThemeContext";

const features = [
  {
    icon: BarChart3,
    title: "CGPA Calculator",
    desc: "Calculate your CGPA in real time across all semesters. Add grades, set credit weights, and watch your cumulative GPA update instantly.",
    highlights: ["Per-semester GPA", "Weighted credit calculation", "Historical tracking"],
  },
  {
    icon: BookOpen,
    title: "Attendance Tracker",
    desc: "Know exactly how many classes you can afford to miss. Set your required attendance threshold and stay in the safe zone every semester.",
    highlights: ["Per-subject attendance", "Safe/risk indicators", "Auto-calculation"],
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    desc: "View all your deadlines, exams, and events in one clean calendar. Add events, set reminders, and never lose track of what's due.",
    highlights: ["Monthly & weekly views", "Color-coded events", "Deadline reminders"],
  },
  {
    icon: FileText,
    title: "Note Editor",
    desc: "Write and organize course notes with a full markdown editor. Keep everything linked to the right subject so nothing gets lost.",
    highlights: ["Markdown support", "Organized by course", "Quick search"],
  },
  {
    icon: CheckSquare,
    title: "Task Manager",
    desc: "Create tasks, assign priorities, and track what's done. Stay on top of your workload without juggling multiple apps.",
    highlights: ["Priority levels", "Due dates", "Progress tracking"],
  },
  {
    icon: ClipboardList,
    title: "Assignment Tracker",
    desc: "Track all your assignments across every course in one place. See what's due, what's submitted, and what needs attention.",
    highlights: ["Per-course assignments", "Submission status", "Deadline alerts"],
  },
  {
    icon: RefreshCw,
    title: "VTOP & LMS Sync",
    desc: "Sync your courses, grades, and attendance directly from VTOP and your university LMS with a single click. No manual entry needed.",
    highlights: ["One-click VTOP sync", "LMS integration", "Auto course import"],
  },
  {
    icon: GraduationCap,
    title: "Semester Planning",
    desc: "Organize your academic year by semester. Add courses with credits, faculty, and schedules — all in one structured view.",
    highlights: ["Multi-semester view", "Course details", "Credit management"],
  },
  {
    icon: Brain,
    title: "Mindspace",
    desc: "A personal space to think, plan, and reflect. Jot down ideas, set goals, and keep a study journal alongside your coursework.",
    highlights: ["Personal workspace", "Free-form notes", "Goal setting"],
  },
  {
    icon: FolderOpen,
    title: "File Storage",
    desc: "Keep your study materials, past papers, and resources organized by course and semester — always at your fingertips.",
    highlights: ["Course-linked files", "Easy upload", "Organized folders"],
  },
];

const easing = [0.22, 1, 0.36, 1] as const;

export function LandingFeatures() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#080808" : "#fafaf9";
  const sectionBg = isDark ? "#0e0e0e" : "#f5f5f4";
  const headingColor = isDark ? "#f5f5f4" : "#1c1917";
  const subtextColor = isDark ? "#a8a29e" : "#78716c";
  const cardBg = isDark ? "#111111" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const iconBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const iconBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const iconColor = isDark ? "#d6d3d1" : "#44403c";
  const titleColor = isDark ? "#f5f5f4" : "#1c1917";
  const descColor = isDark ? "#a8a29e" : "#78716c";
  const highlightColor = isDark ? "#86efac" : "#16a34a";
  const highlightBg = isDark ? "rgba(134,239,172,0.08)" : "rgba(22,163,74,0.06)";
  const numColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const badgeBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const badgeBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  return (
    <section id="features" style={{ background: bg }}>
      {/* Section header */}
      <div className="py-24 px-4" style={{ background: sectionBg }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-80px", once: true }}
          transition={{ duration: 0.6, ease: easing }}
          className="text-center max-w-2xl mx-auto"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest mb-6 border"
            style={{ borderColor: badgeBorder, background: badgeBg, color: subtextColor }}
          >
            Features
          </span>
          <h2
            className="mb-4"
            style={{
              fontFamily: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: headingColor,
            }}
          >
            Everything you need to
            <br />
            <span style={{ fontStyle: "italic" }}>excel academically</span>
          </h2>
          <p className="text-base" style={{ color: subtextColor }}>
            Ten purpose-built tools working together — no juggling apps, no missed deadlines.
          </p>
        </motion.div>
      </div>

      {/* Feature rows */}
      <div className="px-4 pb-24" style={{ background: bg }}>
        <div className="max-w-5xl mx-auto space-y-6">
          {features.map(({ icon: Icon, title, desc, highlights }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -48 : 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-60px", once: true }}
              transition={{ duration: 0.65, ease: easing }}
              className="group relative rounded-2xl border p-8 transition-all duration-300"
              style={{
                background: cardBg,
                borderColor: cardBorder,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              {/* Large background number */}
              <span
                className="absolute top-4 right-6 text-7xl font-black select-none pointer-events-none leading-none"
                style={{ color: numColor, fontFamily: "inherit" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ background: iconBg, borderColor: iconBorder }}
                >
                  <Icon size={22} style={{ color: iconColor }} strokeWidth={1.8} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: titleColor }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: descColor }}>
                    {desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-full text-[11px] font-medium"
                        style={{ background: highlightBg, color: highlightColor }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
