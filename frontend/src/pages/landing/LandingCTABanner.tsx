import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function LandingCTABanner() {
  return (
    <section className="py-24 px-4 bg-[#141414]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-100px", once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Ready to take control of your academics?
        </h2>
        <p className="text-white/80 text-lg mb-8">
          Start organizing your academic life today.
        </p>
        <Link
          to="/register"
          className="inline-block px-10 py-4 rounded-input font-semibold transition-all duration-150"
          style={{ color: '#0a0a0a', background: 'white' }}
        >
          Get Started Free →
        </Link>
        <p className="text-white/60 text-sm mt-6">
          No credit card required · Free forever
        </p>
      </motion.div>
    </section>
  );
}
