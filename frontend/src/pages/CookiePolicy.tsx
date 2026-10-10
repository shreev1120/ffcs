import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";

export const CookiePolicy = () => {
  return (
    <DashboardLayout>
      <SEO
        title="Cookie Policy"
        description="Learn how VIT FFCS Agent utilizes essential session cookies and local storage to optimize timetable generation."
      />

      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-3 text-xs text-slate-500 hover:text-slate-800">
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <div className="bg-white border border-slate-300 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
            <div className="flex items-center gap-2 mb-1 text-[#2455a3] text-[11px] font-bold uppercase tracking-wider">
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie &amp; Storage Transparency</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Cookie Policy
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Applicable for VIT Academic Year 2025-26 • Zero Advertising Cookies
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2455a3]" />
              <span>1. Strict Privacy &amp; No-Tracking Guarantee</span>
            </h2>
            <p className="leading-relaxed">
              VIT FFCS Agent is built on student privacy principles. <strong>We do not use advertising cookies, third-party pixel trackers, or cross-site tracking cookies.</strong> All cookies and storage mechanisms are strictly necessary to deliver authenticated timetable generation and persist your batch preferences.
            </p>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>2. Detailed Cookies &amp; Storage Inventory</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="p-2.5">Identifier</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-[#2455a3]">connect.sid / token</td>
                    <td className="p-2.5">Essential / HTTP-Only Cookie</td>
                    <td className="p-2.5">Session / 7 Days</td>
                    <td className="p-2.5">Secures student authentication session against CSRF attacks.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-amber-700">ffcs_cookie_consent</td>
                    <td className="p-2.5">Preferences / LocalStorage</td>
                    <td className="p-2.5">1 Year</td>
                    <td className="p-2.5">Records your selection ("all" or "essential") on the cookie banner.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-emerald-700">ffcs_preferences</td>
                    <td className="p-2.5">Functional / LocalStorage</td>
                    <td className="p-2.5">Persistent</td>
                    <td className="p-2.5">Stores chosen morning or evening slot batch preference.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              3. How to Manage or Clear Cookies
            </h2>
            <p className="leading-relaxed mb-2">
              You can control or clear cookies at any time directly through your web browser settings (Chrome, Firefox, Safari, Edge):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Click the padlock icon next to the address bar in your browser to inspect and delete active site cookies.</li>
              <li>Clearing cookies will log you out of your current session, requiring you to sign back in with your VIT email.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CookiePolicy;
