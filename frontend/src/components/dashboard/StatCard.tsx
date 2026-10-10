import { LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "secondary" | "accent" | "success";
}

const colorMap = {
  primary: {
    bg: "bg-blue-50",
    text: "text-[#2455a3]",
    border: "border-blue-200",
  },
  secondary: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  accent: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color = "primary",
}: StatCardProps) => {
  const colors = colorMap[color];

  return (
    <GlassCard className="p-4 border border-slate-300">
      <div className="flex items-center justify-between">
        <div
          className={`p-2 rounded ${colors.bg} ${colors.border} border`}
        >
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        {trend && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
              trendUp
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold mt-0.5 text-slate-900">
          {value}
        </p>
      </div>
    </GlassCard>
  );
};

export default StatCard;
