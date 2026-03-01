import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const easing = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden bg-[#0a0a0a]"
    >
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easing }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af] mb-8 border border-white/20 bg-white/5"
        >
          ✦ Built for serious students
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: easing }}
          className="text-[40px] sm:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.1] text-white mb-6"
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
          className="text-lg text-[#9ca3af] max-w-[560px] mx-auto leading-relaxed mb-10"
        >
          Track grades, manage assignments, organize notes, and never miss a deadline — all in one place built for students.
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
            style={{ color: '#0a0a0a', background: 'white' }}
          >
            Start for Free →
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-6 py-4 rounded-input text-[#9ca3af] hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <Play size={16} fill="currentColor" />
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}
