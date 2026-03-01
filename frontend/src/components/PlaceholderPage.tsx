import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div
        className="bg-white border border-[#e5e7eb] rounded-card px-8 py-14 flex flex-col items-center text-center"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="w-12 h-12 rounded-full bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center mb-5">
          <Icon size={20} className="text-[#9ca3af]" strokeWidth={1.6} />
        </div>
        <h2 className="text-lg font-semibold text-[#111] mb-2">{title}</h2>
        <p className="text-sm text-[#9ca3af] max-w-xs">{description}</p>
      </div>
    </div>
  );
}
