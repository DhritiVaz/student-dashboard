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
          Same tools as above—pick up where the hero left off.
        </p>
        <Link
          to="/register"
          className="inline-block px-10 py-4 rounded-input font-semibold transition-all duration-150"
          style={{ color: '#0a0a0a', background: 'white' }}
        >
          Get started
        </Link>
        <p className="text-white/45 text-sm mt-6">
          <Link to="/login" className="underline underline-offset-2 hover:text-white/70">Already use the app? Sign in</Link>
          <span className="text-white/25 mx-2">·</span>
          No credit card · Free
        </p>
      </motion.div>
    </section>
  );
}
