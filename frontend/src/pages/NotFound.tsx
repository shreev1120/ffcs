import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CalendarX, Home, Upload, CalendarDays, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import AppLogo from "@/components/common/AppLogo";
import ThemeToggle from "@/components/common/ThemeToggle";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Non-existent route accessed:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SEO
        title="404 - Slot Not Found"
        description="The timetable coordinate or resource you were looking for doesn't exist on VIT FFCS Portal."
      />

      {/* VTOP Top Navbar */}
      <nav className="vtop-header-gradient text-white py-2 px-6 shadow-sm border-b border-[#1b4b8a]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <AppLogo size="sm" textVariant="white" linkTo="/" showBadge={false} />
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/80 font-medium">HTTP 404 System Status</span>
            <ThemeToggle variant="icon" />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-8 border-t-4 border-t-[#dc2626] transition-colors">
          {/* 404 Header */}
          <div className="w-16 h-16 mx-auto rounded bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
            <CalendarX className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-widest px-2.5 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60">
            HTTP 404 • Resource Not Found
          </span>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3 mb-2">
            Page Not In Timetable Registry
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md mx-auto mb-6 leading-relaxed">
            The URL or slot coordinate requested (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono">{location.pathname}</code>) does not exist or has expired.
          </p>

          {/* Quick Navigation Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <Link
              to="/dashboard"
              className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-[#2455a3] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded bg-blue-100 dark:bg-blue-950/60 text-[#2455a3] dark:text-blue-400">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Dashboard Home</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Return to main overview</p>
              </div>
            </Link>

            <Link
              to="/upload"
              className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-[#2455a3] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Slot Generator</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload course sheet</p>
              </div>
            </Link>

            <Link
              to="/results"
              className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-[#2455a3] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">My Schedules</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">View saved timetables</p>
              </div>
            </Link>

            <Link
              to="/privacy-policy"
              className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-[#2455a3] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Help &amp; Policies</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Read student guidelines</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="w-full sm:w-auto bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-9 rounded"
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs h-9 rounded"
            >
              <Link to="/upload">Upload Courses</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* VTOP Footer */}
      <footer className="vtop-footer-gradient text-white py-2 text-center text-[11px] text-white/90 border-t border-[#1b4b8a]">
        Copyright © 2026 Software Development Cell, VIT, Vellore-632 014.
      </footer>
    </div>
  );
};

export default NotFound;
