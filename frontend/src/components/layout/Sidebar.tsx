import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  User,
  GraduationCap,
  FileSpreadsheet,
  ShieldCheck,
  FileText,
  CalendarCheck2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LogoIcon } from "@/components/common/AppLogo";

const academicItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard Home",
    href: "/dashboard",
  },
  {
    icon: CalendarCheck2,
    label: "FFCS Slot Planner",
    href: "/planner",
    badge: "Interactive",
  },
  {
    icon: FileSpreadsheet,
    label: "Timetable Generator",
    href: "/upload",
  },
  {
    icon: Users,
    label: "Faculty Selection",
    href: "/select-faculty",
    badge: "Filter",
  },
  {
    icon: Calendar,
    label: "My Schedules",
    href: "/results",
  },
];

const studentServices = [
  {
    icon: User,
    label: "Student Profile",
    href: "/student-account",
  },
  {
    icon: Settings,
    label: "Slot Preferences",
    href: "/global-preferences",
  },
];

const complianceItems = [
  {
    icon: ShieldCheck,
    label: "Privacy Policy",
    href: "/privacy-policy",
  },
  {
    icon: FileText,
    label: "Terms of Service",
    href: "/terms",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, isGuest, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 fixed left-0 top-[57px] bottom-0 z-30 overflow-y-auto transition-colors">
      {/* Student Quick Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs shrink-0",
            isGuest ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[#2455a3] dark:bg-blue-600"
          )}>
            {isGuest ? "G" : (user?.name ? user.name.charAt(0).toUpperCase() : "S")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {isGuest ? "Guest Student" : (user?.name || user?.vitEmail?.split("@")[0] || "Student")}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {isGuest ? "Instant Access" : (user?.registrationNumber || user?.vitEmail || "VITian")}
            </p>
          </div>
          {isGuest && (
            <Link
              to="/login"
              className="text-[10px] font-bold text-[#2455a3] dark:text-blue-400 hover:underline shrink-0"
              title="Sign in to save profile and preferences"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Academics Section */}
        <div>
          <p className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Academics &amp; Timetable
          </p>
          <div className="space-y-0.5">
            {academicItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#2455a3] dark:bg-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Student Services Section - Hidden for Guest Users */}
        {!isGuest ? (
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Student Services
            </p>
            <div className="space-y-0.5">
              {studentServices.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-[#2455a3] dark:bg-blue-600 text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 mx-1 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Instant Access Active</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Timetable Generator &amp; Slot Planner are fully accessible without login.
            </p>
            <Link
              to="/login"
              className="mt-2 text-[11px] font-bold text-[#2455a3] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Sign In for Profile &amp; Preferences →
            </Link>
          </div>
        )}

        {/* Compliance Section */}
        <div>
          <p className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Institutional Notices
          </p>
          <div className="space-y-0.5">
            {complianceItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#2455a3] dark:bg-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* VTOP System Crest */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center gap-2.5">
        <LogoIcon className="w-6 h-6 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#1b4b8a] dark:text-blue-400 leading-tight">VTOP FFCS Engine</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Clash-Free Optimizer</p>
        </div>
      </div>

      {/* Logout button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
