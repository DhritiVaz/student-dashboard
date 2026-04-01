import { Link } from "react-router-dom";

const productLinks = [
  { to: "#features", label: "Features" },
  { to: "#how-it-works", label: "How it works" },
  { to: "#", label: "Pricing" },
];

const accountLine = (
  <p className="text-sm text-[#9ca3af] leading-relaxed">
    <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
    <span className="text-[#4b5563] mx-2">·</span>
    <Link to="/register" className="hover:text-white transition-colors">Get started</Link>
    <span className="text-[#4b5563] mx-2">·</span>
    <Link to="/dashboard" className="hover:text-white transition-colors">App</Link>
  </p>
);

const legalLinks = [
  { to: "#", label: "Privacy" },
  { to: "#", label: "Terms" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-16 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="block font-semibold text-white mb-4">
              Student Dashboard
            </Link>
            <p className="text-sm text-[#9ca3af] max-w-[200px]">
              Your academic life, beautifully organized.
            </p>
            <p className="text-sm text-[#6b7280] mt-6">© 2026 Student Dashboard</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#9ca3af] hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            {accountLine}
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#9ca3af] hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-[#6b7280] text-sm">
            Made with ♥ for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
