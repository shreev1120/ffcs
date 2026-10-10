import {
  Calendar,
  Clock,
  BookOpen,
  Upload,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Megaphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuickAction from "@/components/dashboard/QuickAction";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  generatedSchedules: number;
  hoursSaved: number;
  activeCourses: number;
  optimizationScore: number;
}

interface ActivityLog {
  title: string;
  desc: string;
  time: string;
  type: string;
}

const Index = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    generatedSchedules: 0,
    hoursSaved: 0,
    activeCourses: 0,
    optimizationScore: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          apiRequest<DashboardStats>("/dashboard/stats"),
          apiRequest<ActivityLog[]>("/dashboard/activity"),
        ]);
        setStats(statsData);
        setActivities(activityData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <SEO
        title="Dashboard Overview"
        description="View your VIT FFCS timetable status, recent optimizations, and quick actions to generate conflict-free schedules."
      />

      {/* VTOP Top Institutional Notice & Welcome Banner (CTA Above The Fold) */}
      <div className="mb-6 bg-white border border-slate-300 rounded shadow-card overflow-hidden">
        {/* Navy Header Strip */}
        <div className="vtop-header-gradient px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#1b4b8a]">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white mr-2 border border-white/25">
              VTOP Academic Timetable System
            </span>
            <span className="text-xs text-white/90 font-medium">
              Academic Year 2025-26 • Vellore Campus
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Registration Portal Active</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Welcome back, {user?.name || user?.vitEmail?.split("@")[0] || "Student"}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Registration No: {user?.registrationNumber || user?.vitEmail || "VIT Student"}
              </p>

              <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                Generate conflict-free academic schedules from your VTOP course registration export. Our backtracking engine guarantees zero slot overlap across all theory and laboratory courses.
              </p>

              {/* High-Contrast Clear CTA Above The Fold */}
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
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-10 px-4 rounded"
                >
                  <Link to="/results" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2455a3]" />
                    <span>View Saved Schedules</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Institutional Summary Status (No generic 3 cards in a row) */}
            <div className="lg:border-l lg:border-slate-200 lg:pl-6 min-w-[240px] space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Clash Verification Status
                </p>
                <p className="text-lg font-bold text-[#2455a3] mt-0.5">100% Conflict-Free</p>
                <p className="text-[11px] text-slate-600">Theory &amp; Lab strictly separated</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Supported Input Format
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">VTOP .xlsx / .csv</p>
                <p className="text-[11px] text-slate-600">Direct student portal export</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operation Cards (2 Actions Grid) */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Course Registration Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            to="/upload"
            icon={FileSpreadsheet}
            title="Import VTOP Course Allocation Sheet"
            description="Upload your downloaded Excel file and select batch timing preferences"
          />
          <QuickAction
            to="/results"
            icon={LayoutDashboard}
            title="Inspect Saved Timetables"
            description="Review generated slot grids, faculty details, and export combinations"
          />
        </div>
      </div>

      {/* Main Grid: Activity Hub + Authentic VTOP Spotlight Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Optimization Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded shadow-card p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2455a3]" />
              <span>Recent Timetable Optimization Activity</span>
            </h3>
            <span className="text-xs text-slate-500">Academic Session 2025-26</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-10 bg-slate-100 rounded border border-slate-200 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded border border-slate-200 animate-pulse" />
              </div>
            ) : activities.length > 0 ? (
              activities.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="p-2 rounded bg-blue-100 text-[#2455a3]">
                    {item.type === "calendar" ? (
                      <Calendar className="w-4 h-4" />
                    ) : item.type === "settings" ? (
                      <Settings className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded">
                <p className="text-xs text-slate-600">No timetable generated yet in this session.</p>
                <Link
                  to="/upload"
                  className="inline-block mt-2 text-xs font-bold text-[#2455a3] hover:underline"
                >
                  Upload your course Excel sheet to begin →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Authentic VTOP Spotlight Panel (Scraped directly from VTOP) */}
        <div className="bg-white border border-slate-300 rounded shadow-card overflow-hidden">
          <div className="bg-[#900c3f] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#700a30]">
            <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              <span>VTOP Spotlight</span>
            </span>
            <span className="text-[11px] text-white/80">Academic Notices</span>
          </div>

          <div className="p-4 space-y-3.5 text-xs">
            <div className="border-b border-slate-200 pb-2.5">
              <p className="font-bold text-slate-800 leading-snug">
                FALL 2025-26 - FFCS COURSE ALLOCATION &amp; TIMETABLE OPTIMIZATION
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload your course registration export to generate zero-clash theory and laboratory combinations.
              </p>
            </div>

            <div className="border-b border-slate-200 pb-2.5">
              <p className="font-bold text-slate-800 leading-snug">
                SLOT CLASH SEPARATION PROTOCOL
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Morning theory slots (A1..E1) strictly alternate with afternoon lab slots (L31..L60) to prevent attendance overlaps.
              </p>
            </div>

            <div className="border-b border-slate-200 pb-2.5">
              <p className="font-bold text-slate-800 leading-snug">
                BATCH TIMING PREFERENCES (MORNING / EVENING)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Configure preferred slot shifts in Global Preferences for optimized daily travel schedules.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-bold text-[#1b4b8a] text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Advisory: Conflict Detection Rule</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Ensure each course has theory and practical components registered under matching course codes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
