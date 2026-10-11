import {
  Calendar,
  Upload,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useAuth } from "@/context/AuthContext";

const SAMPLE_EXCEL_COLUMNS = [
  {
    name: "Course Code",
    status: "Required",
    statusColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    example: "BCSE202L",
    note: "Unique VIT course code (e.g., BCSE202L, BMAT201L)",
  },
  {
    name: "Course Title",
    status: "Required",
    statusColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    example: "Data Structures & Algorithms",
    note: "Full course name as displayed in VTOP",
  },
  {
    name: "Slot",
    status: "Required",
    statusColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    example: "A1+TA1 / L31+L32",
    note: "Theory (A1/B1..) or Lab (L1/L31..) with '+'",
  },
  {
    name: "Faculty",
    status: "Recommended",
    statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    example: "Dr. Ramesh Kumar",
    note: "Course teacher / instructor name",
  },
  {
    name: "Venue",
    status: "Recommended",
    statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    example: "SJT-101 / TT-412",
    note: "Academic classroom or laboratory hall",
  },
  {
    name: "Credits",
    status: "Optional",
    statusColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    example: "3 / 3-0-2-0-4",
    note: "Course credit count or L-T-P-J-C",
  },
  {
    name: "Course Type",
    status: "Optional",
    statusColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    example: "Theory / Embedded Lab",
    note: "Instruction format type",
  },
];

const SAMPLE_DATA_ROWS = [
  {
    slNo: "1",
    code: "BCSE202L",
    title: "Data Structures and Algorithms",
    slot: "A1+TA1",
    faculty: "Dr. Ramesh Kumar",
    venue: "SJT-101",
    credits: "3",
    type: "Theory",
  },
  {
    slNo: "2",
    code: "BCSE202P",
    title: "Data Structures and Algorithms Lab",
    slot: "L31+L32",
    faculty: "Dr. Ramesh Kumar",
    venue: "SJT-G02",
    credits: "1",
    type: "Embedded Lab",
  },
  {
    slNo: "3",
    code: "BMAT201L",
    title: "Complex Variables & Linear Algebra",
    slot: "B1+TB1",
    faculty: "Dr. Priya Sharma",
    venue: "TT-412",
    credits: "4",
    type: "Theory",
  },
  {
    slNo: "4",
    code: "BCSE205L",
    title: "Computer Architecture & Organization",
    slot: "C1+TC1",
    faculty: "Prof. Suresh N",
    venue: "MB-205",
    credits: "3",
    type: "Theory",
  },
  {
    slNo: "5",
    code: "BENG101N",
    title: "Technical English Communication",
    slot: "D1+TD1",
    faculty: "Dr. Deepa M",
    venue: "CDMM-102",
    credits: "2",
    type: "Theory",
  },
];

const Index = () => {
  const { user } = useAuth();

  const handleDownloadCsv = () => {
    const csvContent =
      "Course Code,Course Title,Credits,Slot,Faculty,Venue,Course Type\n" +
      "BCSE202L,Data Structures and Algorithms,3,A1+TA1,Dr. Ramesh Kumar,SJT-101,Theory\n" +
      "BCSE202P,Data Structures and Algorithms Lab,1,L31+L32,Dr. Ramesh Kumar,SJT-G02,Embedded Lab\n" +
      "BMAT201L,Complex Variables & Linear Algebra,4,B1+TB1,Dr. Priya Sharma,TT-412,Theory\n" +
      "BCSE205L,Computer Architecture & Organization,3,C1+TC1,Prof. Suresh N,MB-205,Theory\n" +
      "BENG101N,Technical English Communication,2,D1+TD1,Dr. Deepa M,CDMM-102,Theory\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "VTOP_Course_Registration_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

              {/* Action Buttons */}
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

      {/* Excel Sheet Column Template & Format Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden transition-colors mb-6">
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#2455a3] dark:text-blue-400">
                Excel Sheet Structure
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">VTOP Format Guidelines</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Required Excel Sheet Columns &amp; Sample Template
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Ensure your VTOP export or custom spreadsheet contains the columns shown below. Our backtracking engine uses these headers to calculate conflict-free slot permutations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/VTOP_Course_Registration_Template.xlsx"
              download="VTOP_Course_Registration_Template.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded bg-[#2455a3] hover:bg-[#1b4b8a] text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadCsv}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold h-9 px-3 rounded flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .csv</span>
            </Button>
          </div>
        </div>

        {/* Required vs Optional Column Definition Badges */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Column Header Specifications:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SAMPLE_EXCEL_COLUMNS.map((col) => (
              <div
                key={col.name}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2.5 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{col.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${col.statusColor}`}
                  >
                    {col.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{col.note}</p>
                <p className="text-[10px] font-mono text-[#2455a3] dark:text-blue-300 mt-1 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">
                  e.g. {col.example}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Excel Spreadsheet Live Preview Table */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Spreadsheet Layout Preview:
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Matches VTOP "Course Registration" export layout
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700 text-center w-12">
                    Sl.No
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700">
                    Course Code <span className="text-rose-500 font-extrabold">*</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700">
                    Course Title <span className="text-rose-500 font-extrabold">*</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700">
                    Slot <span className="text-rose-500 font-extrabold">*</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700">
                    Faculty
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700">
                    Venue
                  </th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-200 dark:border-slate-700 text-center w-16">
                    Credits
                  </th>
                  <th className="py-2.5 px-3 font-bold">Course Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {SAMPLE_DATA_ROWS.map((row, idx) => (
                  <tr
                    key={row.code + idx}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-850/40"
                    } hover:bg-blue-50/50 dark:hover:bg-blue-950/20`}
                  >
                    <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 font-mono">
                      {row.slNo}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#2455a3] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800">
                      {row.code}
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium border-r border-slate-200 dark:border-slate-800">
                      {row.title}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                      {row.slot}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      {row.faculty}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      {row.venue}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      {row.credits}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Rules for Uploaders */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
              <p className="font-bold text-[#2455a3] dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>1. Combined Slot Format</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                Use a plus symbol to combine theory slots (e.g. <span className="font-mono font-bold text-slate-800 dark:text-slate-200">A1+TA1</span>) or lab slots (e.g. <span className="font-mono font-bold text-slate-800 dark:text-slate-200">L31+L32</span>).
              </p>
            </div>

            <div className="p-3 rounded bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
              <p className="font-bold text-[#2455a3] dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>2. Separate Theory &amp; Lab</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                For embedded subjects, list the theory component and the laboratory component on separate rows in your sheet.
              </p>
            </div>

            <div className="p-3 rounded bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
              <p className="font-bold text-[#2455a3] dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>3. Supported File Types</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                Accepts <span className="font-bold">.xlsx</span>, <span className="font-bold">.xls</span>, or <span className="font-bold">.csv</span> files downloaded directly from VTOP or created in Excel / Sheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
