import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickActionProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: boolean;
}

const QuickAction = ({
  to,
  icon: Icon,
  title,
  description,
  gradient = false,
}: QuickActionProps) => {
  return (
    <Link
      to={to}
      className={`group glass-card p-5 flex items-center gap-4 ring-1 ring-foreground/5 hover:ring-primary/30 transition-all reveal ${
        gradient
          ? "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
          : ""
      }`}
    >
      <div
        className={`p-3 rounded-xl ${
          gradient
            ? "bg-gradient-to-br from-primary to-accent"
            : "bg-primary/20 border border-primary/30"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${gradient ? "text-white" : "text-primary"}`}
        />
      </div>
      <div className="flex-1">
        <h4 className="font-display font-bold text-sm">{title}</h4>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </Link>
  );
};

export default QuickAction;
