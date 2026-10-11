import { Link } from "react-router-dom";
import { CheckCircle2, Calendar, ArrowRight, ShieldCheck, LayoutDashboard, FileSpreadsheet } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";

export const ThankYou = () => {
  return (
    <DashboardLayout>
      <SEO
        title="Schedule Generated Successfully"
        description="Your VIT academic timetable has been optimized and generated without any slot clashes."
      />

      <div className="max-w-3xl mx-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden border-t-4 border-t-[#2455a3] mb-6 transition-colors">
          <div className="p-8 text-center border-b border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-3 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              Optimization Complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
              Your Timetable Is Ready!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto text-xs leading-relaxed">
              All courses have been analyzed through our backtracking algorithm. Permutations have zero slot clashes between theory and lab hours.
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>Generation Summary</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xl font-bold text-[#2455a3] dark:text-blue-400">100%</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Clash-Free</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Strict slot separation</p>
              </div>
              <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">Saved</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">In Session</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Access anytime</p>
              </div>
              <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Optimized</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Batch Timing</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Matched preferences</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                asChild
                size="default"
                className="w-full sm:flex-1 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-10 rounded shadow-sm"
              >
                <Link to="/results" className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>View Full Schedule Grid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs h-10 rounded"
              >
                <Link to="/upload">Generate Another</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="default"
                className="w-full sm:w-auto text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-10 rounded"
              >
                <Link to="/dashboard" className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Advisory Card */}
        <div className="p-4 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#2455a3] dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">VTOP Course Registration Advisory</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Keep your chosen combination slot codes handy (e.g. A1, B1, L1+L2). During actual FFCS registration on VTOP, entering these slot combinations directly ensures lightning-fast selection.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ThankYou;
