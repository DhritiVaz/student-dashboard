import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "#0e0e0e", color: "#e5e5e5" }}
    >
      <FileQuestion
        size={48}
        className="mb-6"
        style={{ color: "#52525b" }}
        aria-hidden
      />
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-sm text-[#a3a3a3] mb-8 max-w-sm text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
    </div>
  );
}
