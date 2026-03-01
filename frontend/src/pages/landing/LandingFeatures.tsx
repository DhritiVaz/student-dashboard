import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  FileText,
  CheckSquare,
  GraduationCap,
  Zap,
} from "lucide-react";

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
  return (
    <section id="features" className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px", once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af] mb-4 border border-white/20 bg-white/5">
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Everything you need to excel
          </h2>
          <p className="text-[#9ca3af] text-sm max-w-xl mx-auto">
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
              className="p-8 rounded-card bg-[#141414] border border-white/10 transition-all duration-200 cursor-default hover:border-white/30"
            >
              <div className="w-12 h-12 rounded-input flex items-center justify-center mb-6 bg-white/5 border border-white/10">
                <Icon size={22} className="text-white" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
