import { lazy, Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingNavbar } from "./landing/LandingNavbar";
import { LandingHero } from "./landing/LandingHero";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingLoadingScreen } from "./landing/LandingLoadingScreen";

const LandingFeatures = lazy(() =>
  import("./landing/LandingFeatures").then((m) => ({ default: m.LandingFeatures }))
);
const LandingHowItWorks = lazy(() =>
  import("./landing/LandingHowItWorks").then((m) => ({ default: m.LandingHowItWorks }))
);
const LandingCTABanner = lazy(() =>
  import("./landing/LandingCTABanner").then((m) => ({
    default: m.LandingCTABanner,
  }))
);

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LandingLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="landing-page min-h-screen bg-[#0a0a0a]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LandingNavbar />
            <LandingHero />
            <Suspense fallback={null}>
              <LandingFeatures />
              <div id="how-it-works">
                <LandingHowItWorks />
              </div>
              <LandingCTABanner />
            </Suspense>
            <LandingFooter />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
