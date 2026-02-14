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
    bg: "bg-primary/20",
    text: "text-primary",
    border: "border-primary/30",
  },
  secondary: {
    bg: "bg-secondary/20",
    text: "text-secondary",
    border: "border-secondary/30",
  },
  accent: {
    bg: "bg-accent/20",
    text: "text-accent",
    border: "border-accent/30",
  },
  success: {
    bg: "bg-success/20",
    text: "text-success",
    border: "border-success/30",
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
    <GlassCard className="reveal">
      <div className="flex items-start justify-between">
        <div
          className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}
        >
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              trendUp
                ? "bg-success/20 text-success"
                : "bg-secondary/20 text-secondary"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-text-muted text-xs font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="font-display text-3xl font-black mt-1 text-gradient">
          {value}
        </p>
      </div>
    </GlassCard>
  );
};

export default StatCard;
