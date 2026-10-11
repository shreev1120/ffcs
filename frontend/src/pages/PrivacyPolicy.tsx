import { Link } from "react-router-dom";
import { ShieldCheck, FileSpreadsheet, Trash2, ArrowLeft, Mail, Database, Layers } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";

export const PrivacyPolicy = () => {
  return (
    <DashboardLayout>
      <SEO
        title="Privacy Policy & What Data We Collect"
        description="Learn how VIT FFCS Agent collects, stores, protects, and deletes student academic data with complete transparency."
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Student Privacy Commitment</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Privacy Policy &amp; Data Transparency
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Last Updated: Fall Semester • Effective Date: January 1, 2026
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          {/* Data Inventory Matrix */}
          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2455a3]" />
              <span>1. Exactly What User Data We Collect</span>
            </h2>
            <p className="leading-relaxed mb-3">
              In accordance with student privacy standards, we collect only the minimal data required to calculate conflict-free slot schedules:
            </p>

            <div className="overflow-x-auto mb-2">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="p-2.5">Data Category</th>
                    <th className="p-2.5">Specific Fields</th>
                    <th className="p-2.5">Source / Collection Method</th>
                    <th className="p-2.5">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Authentication</td>
                    <td className="p-2.5">Institutional Email (@vitstudent.ac.in), salted password hash</td>
                    <td className="p-2.5">Provided on signup</td>
                    <td className="p-2.5">Until account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Student Identity</td>
                    <td className="p-2.5">Student Name, Registration Number (e.g. 21BCE1234)</td>
                    <td className="p-2.5">User profile input / Excel metadata</td>
                    <td className="p-2.5">Until account deletion</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Course Data</td>
                    <td className="p-2.5">Course codes, slot IDs (A1, B1, L1..L60), faculty names</td>
                    <td className="p-2.5">Uploaded VTOP registration Excel sheet</td>
                    <td className="p-2.5">Until overwritten or cleared</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Preferences</td>
                    <td className="p-2.5">Morning / Evening batch preference, ranking score weights</td>
                    <td className="p-2.5">Preference toggle selection</td>
                    <td className="p-2.5">Stored in user profile</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Security Logs</td>
                    <td className="p-2.5">IP address, user agent, login timestamps (rate limiting)</td>
                    <td className="p-2.5">Server access logs for brute-force defense</td>
                    <td className="p-2.5">Rolling 30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Third Party Embeds */}
          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>2. Third-Party Services &amp; Embeds Policy</span>
            </h2>
            <p className="leading-relaxed mb-2">
              We maintain a zero-external-advertising and zero-unnecessary-embeds policy:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>No Third-Party Advertising:</strong> We never integrate Google Ads, Facebook Pixel, TikTok pixel, or marketing trackers.</li>
              <li><strong>No Data Brokers:</strong> Student course selections, registration numbers, and schedules are never shared with or sold to outside parties.</li>
              <li><strong>Secure Sandbox Links:</strong> Any external links (such as to VIT VTOP) are strictly outbound with rel="noopener noreferrer" attributes to isolate browser context.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2455a3]" />
              <span>3. How Your Course Data is Handled</span>
            </h2>
            <p className="leading-relaxed">
              When you upload an Excel sheet, the file is parsed to extract slot tokens and course titles. It is run through our backtracking algorithm to test millions of permutations in memory. The calculated schedule combinations are linked to your authenticated user account so you can review them whenever you log in.
            </p>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>4. Data Retention &amp; Permanent Deletion</span>
            </h2>
            <p className="leading-relaxed">
              You retain full ownership and control over your academic data. You can delete uploaded files, clear your generated timetable cache, or request full account removal at any time through your Student Account settings or by contacting our desk.
            </p>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-card p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#2455a3]" />
              <span>5. Contact the Student Development Desk</span>
            </h2>
            <p className="leading-relaxed mb-2">
              If you have any questions regarding data handling or privacy practices, reach out to our team:
            </p>
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-900">VIT FFCS Agent Engineering Desk</p>
              <p className="text-slate-600 mt-0.5">Vellore Institute of Technology, Katpadi Road, Vellore - 632014, Tamil Nadu, India</p>
              <p className="text-[#2455a3] font-mono mt-1">Email: ffcs.support@vitstudent.ac.in</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PrivacyPolicy;
