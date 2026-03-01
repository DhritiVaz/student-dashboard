export function LandingLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        <div className="landing-loading-spinner w-8 h-8 rounded-full border-2 border-white/20 border-t-white" />
      </div>
      <p className="mt-6 text-sm text-[#6b7280] font-medium">Student Dashboard</p>
    </div>
  );
}
