import {
  Calendar,
  Upload,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/common/ThemeToggle";

const Index = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <SEO
        title="Dashboard Overview"
        description="View your VIT FFCS timetable status and generate conflict-free schedules."
      />

      {/* VTOP Top Institutional Notice & Welcome Banner (CTA Above The Fold) */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden transition-colors">
        {/* Navy Header Strip */}
        <div className="vtop-header-gradient px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#1b4b8a]">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white mr-2 border border-white/25">
              VTOP Academic Timetable System
            </span>
            <span className="text-xs text-white/90 font-medium">
              Academic Session • Vellore Campus
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Registration Portal Active</span>
            </div>
            {/* Quick theme pill toggle on header strip */}
            <ThemeToggle variant="pill" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Welcome back, {user?.name || user?.vitEmail?.split("@")[0] || "Student"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                Registration No: {user?.registrationNumber || user?.vitEmail || "VIT Student"}
              </p>

              <p className="text-slate-600 dark:text-slate-300 mt-3 text-sm leading-relaxed">
                Generate conflict-free academic schedules from your VTOP course registration export. Our backtracking engine guarantees zero slot overlap across all theory and laboratory courses.
              </p>

              {/* High-Contrast Action Buttons with Light/Dark Mode Switch Button */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Button
                  asChild
                  size="default"
                  className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-10 px-5 rounded shadow-sm"
                >
                  <Link to="/upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload VTOP Excel &amp; Optimize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs h-10 px-4 rounded"
                >
                  <Link to="/results" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
                    <span>View Saved Schedules</span>
                  </Link>
                </Button>

                {/* Home page button for switching between light and dark mode */}
                <ThemeToggle variant="button" />
              </div>
            </div>

            {/* Institutional Summary Status */}
            <div className="lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6 min-w-[240px] space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Clash Verification Status
                </p>
                <p className="text-lg font-bold text-[#2455a3] dark:text-blue-400 mt-0.5">100% Conflict-Free</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">Theory &amp; Lab strictly separated</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Supported Input Format
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">VTOP .xlsx / .csv</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">Direct student portal export</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
