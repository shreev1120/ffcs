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
}: QuickActionProps) => {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-300 hover:border-[#2455a3] hover:bg-slate-50/80 p-4 flex items-center gap-3.5 transition-colors rounded shadow-card"
    >
      <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-[#2455a3] shrink-0">
        <Icon className="w-5 h-5 text-[#2455a3]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-slate-900">{title}</h4>
        <p className="text-slate-600 text-xs mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </Link>
  );
};

export default QuickAction;
