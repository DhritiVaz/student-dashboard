import { motion } from "framer-motion";
import { UserPlus, Layout, ArrowUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create your account",
    desc: "Register in seconds with email. No credit card required.",
  },
  {
    num: "02",
    icon: Layout,
    title: "Set up your semester",
    desc: "Add courses, assignments, and notes. Import from syllabus or start fresh.",
  },
  {
    num: "03",
    icon: ArrowUp,
    title: "Stay on top of everything",
    desc: "Track, plan, and never miss a beat. Your academic life, organized.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px", once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
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
                  className="hidden md:block absolute top-12 left-[calc(50%+56px)] w-[calc(100%-112px)] h-px border-t border-dashed border-white/20"
                  style={{ width: "calc(100% - 112px)" }}
                />
              )}
              <span className="inline-block text-4xl font-bold text-white mb-6">
                {step.num}
              </span>
              <div className="w-14 h-14 rounded-input flex items-center justify-center mb-4 mx-auto md:mx-0 bg-white/5 border border-white/10">
                <step.icon size={24} className="text-white" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-[#9ca3af] text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
