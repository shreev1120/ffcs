import { Link } from "react-router-dom";
import { BadgeCheck, ArrowLeft, HeartHandshake, Info } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";

export const RefundPolicy = () => {
  return (
    <DashboardLayout>
      <SEO
        title="Refund Policy & Free Service Terms"
        description="Learn about our zero-fee educational policy, free service terms, and support resolution for VIT students."
      />

      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-3 text-xs text-slate-500 hover:text-slate-800">
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3] transition-colors">
            <div className="flex items-center gap-2 mb-1 text-[#2455a3] dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Financial Terms &amp; Fair Access</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Refund &amp; Free Service Policy
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Effective Date: January 1, 2026 • 100% Free Student Utility • Zero Financial Charges
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 border-l-4 border-l-emerald-600 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  1. Zero Monetary Charges (100% Free Software)
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  VIT FFCS Agent is an open academic software initiative built by and for students at Vellore Institute of Technology. <strong>We do not charge any registration fees, subscription costs, microtransactions, or processing fees of any kind.</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>2. Why Refunds Are Not Applicable</span>
            </h2>
            <p className="leading-relaxed mb-2">
              Because no payments, credit card transactions, or bank transfers are ever collected or processed by this platform, financial refunds do not apply:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>No payment gateway, credit card processor, or digital wallet is integrated.</li>
              <li>Every feature, including course extraction and backtracking schedule generation, is provided free of charge.</li>
              <li>If any third party attempts to charge you money for this platform, please report it immediately as a scam.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              3. Service Quality &amp; Defect Resolution
            </h2>
            <p className="leading-relaxed mb-2">
              While monetary refunds do not exist, we are deeply committed to algorithmic precision:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>If an Excel parsing edge-case occurs, share your sanitized sheet format with our engineering desk.</li>
              <li>Our student developers actively release fixes within 24 to 48 hours during peak course registration cycles.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RefundPolicy;
