import { Link } from "react-router-dom";
import { FileText, ArrowLeft, AlertCircle, ShieldAlert, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";

export const Terms = () => {
  return (
    <DashboardLayout>
      <SEO
        title="Terms of Service"
        description="Review terms of use, student guidance, and platform disclaimers for VIT FFCS Agent."
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
              <FileText className="w-3.5 h-3.5" />
              <span>Institutional Terms &amp; Platform Agreement</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Applicable for Fall and Winter Academic Cycles • Vellore Campus
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Permitted Use &amp; Student Scope</span>
            </h2>
            <p className="leading-relaxed">
              VIT FFCS Agent is an open academic planning aid designed to assist VIT students in calculating non-clashing course slot arrangements before and during official FFCS course registration on VTOP. The service is provided free for educational and personal scheduling purposes.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>2. Independent Software Disclaimer</span>
            </h2>
            <p className="leading-relaxed">
              VIT FFCS Agent is an independent student project and is <strong>not officially affiliated with, endorsed by, or operated by Vellore Institute of Technology (VIT) administration or VTOP</strong>. Course availability, real-time seat allotments, and final registrations remain exclusively governed by VIT's official VTOP portal.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>3. User Responsibilities</span>
            </h2>
            <p className="leading-relaxed mb-2">
              When utilizing this platform, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Upload only your legitimate course registration lists or mock files without malicious payloads.</li>
              <li>Verify the final slot codes on VTOP before confirming registration during the live allocation window.</li>
              <li>Maintain the security and confidentiality of your account credentials.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              4. Contact Information
            </h2>
            <p className="mb-2">
              Questions regarding these Terms may be directed to our student development desk:
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              VIT FFCS Agent Project Team • Vellore Institute of Technology, Katpadi Road, Vellore 632014, Tamil Nadu, India.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Terms;
