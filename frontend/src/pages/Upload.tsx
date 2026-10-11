import { useState } from "react";
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
  ShieldAlert,
  Clock,
  Check,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { useAuth, type UserPreferences } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [batchPreference, setBatchPreference] = useState<"Morning" | "Evening">("Morning");
  const [dataConsent, setDataConsent] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, updatePreferences } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv", "json"].includes(ext || "")) {
        setErrorMessage("Unsupported file type. Please upload a .xlsx, .xls, or .csv file.");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv", "json"].includes(ext || "")) {
        setErrorMessage("Unsupported file type. Please upload a .xlsx, .xls, or .csv file.");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (overrideBatch?: unknown) => {
    if (honeypot.trim().length > 0) {
      setErrorMessage("Invalid bot submission.");
      return;
    }
    if (!file) {
      setErrorMessage("Please select or drop an Excel (.xlsx) file first.");
      return;
    }
    if (!dataConsent) {
      setErrorMessage("Please confirm course data processing consent before generating.");
      return;
    }

    const effectiveBatchPreference: "Morning" | "Evening" =
      typeof overrideBatch === "string" && (overrideBatch === "Morning" || overrideBatch === "Evening")
        ? overrideBatch
        : (batchPreference === "Evening" ? "Evening" : "Morning");

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("excelFile", file);
    if (user?.id) {
      formData.append("userId", user.id);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/timetable/upload-excel`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process course registration Excel file.");
      }

      const rawCourses = data.courses || [];
      const courses = rawCourses.map((c: any) => {
        const isLabCourse =
          c.isLab === true ||
          c.courseType?.toLowerCase().includes("lab") ||
          c.type?.toLowerCase().includes("lab") ||
          (c.slot && c.slot.trim().toUpperCase().startsWith("L"));
        return {
          code: c.courseCode || c.code,
          courseCode: c.courseCode || c.code,
          title: c.courseName || c.title || c.courseTitle || c.name || c.courseCode || c.code,
          courseName: c.courseName || c.title || c.courseTitle || c.name || c.courseCode || c.code,
          credits: c.credits ? Number(c.credits) : 3,
          type: isLabCourse ? "Lab" : (c.courseType || c.type || "Theory"),
          courseType: isLabCourse ? "Lab" : (c.courseType || c.type || "Theory"),
          isLab: isLabCourse,
          slot: c.slot || "",
          theorySlots: isLabCourse
            ? []
            : Array.isArray(c.theorySlots)
            ? c.theorySlots
            : (c.slot ? [c.slot] : []),
          labSlots: isLabCourse
            ? (Array.isArray(c.labSlots) && c.labSlots.length > 0 ? c.labSlots : (c.slot ? [c.slot] : []))
            : (Array.isArray(c.labSlots) ? c.labSlots : []),
          faculty: c.faculty || "Faculty",
          venue: c.venue || "TBD",
        };
      });

      const genResponse = await fetch(`${API_BASE_URL}/timetable/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          semesterConfigId: data.semesterConfigId,
          courses,
          preferences: {
            batchPreference: effectiveBatchPreference,
            rankingCriteria: user?.preferences?.rankingCriteria || "balanced",
            maxTimetables: user?.preferences?.maxTimetables || 20,
            minCredits: 18,
            maxCredits: 27,
            preferredTheorySlots: user?.preferences?.preferredTheorySlots || [],
            avoidEarlyMorning: user?.preferences?.avoidEarlyMorning || false,
            freeDayPreferred: user?.preferences?.freeDayPreferred || null,
          },
        }),
      });

      const genData = await genResponse.json();

      if (!genResponse.ok) {
        throw new Error(genData.error || "Failed to generate conflict-free timetables.");
      }

      toast({
        title: "Timetables Generated",
        description: `Found ${genData.timetablesCount} valid ${effectiveBatchPreference} schedules with zero clashes.`,
      });

      try {
        localStorage.setItem("vtop_ffcs_latest_timetable", JSON.stringify(genData));
        localStorage.setItem("vtop_ffcs_selected_batch", effectiveBatchPreference);
      } catch (err) {
        console.warn("Could not cache timetable to localStorage:", err);
      }

      navigate("/results", { state: { timetableData: genData, selectedBatch: effectiveBatchPreference } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(message);
      toast({
        title: "Generation Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreferenceSelection = async (selected: "Morning" | "Evening") => {
    setBatchPreference(selected);
    setShowPreferenceModal(false);
    try {
      await updatePreferences({ batchPreference: selected });
    } catch {
      // Non-blocking preference sync
    }
    handleUpload(selected);
  };

  return (
    <DashboardLayout>
      <SEO
        title="Timetable Generator"
        description="Upload your VTOP course Excel file to generate 100% conflict-free academic schedules for VIT."
      />

      <Dialog open={showPreferenceModal} onOpenChange={setShowPreferenceModal}>
        <DialogContent className="bg-white border-slate-300 text-slate-800 rounded">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Select Slot Timing Preference</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs">
              Choose your primary batch preference. The algorithm prioritizes theory and lab combinations accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <Button
              variant="outline"
              className="h-14 flex flex-col items-center justify-center border-slate-300 hover:border-[#2455a3] hover:bg-blue-50 text-slate-800 rounded"
              onClick={() => handlePreferenceSelection("Morning")}
            >
              <span className="font-bold text-xs text-[#2455a3]">Morning Batch</span>
              <span className="text-[11px] text-slate-500">Theory 8:00 AM to 1:00 PM</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex flex-col items-center justify-center border-slate-300 hover:border-[#2455a3] hover:bg-blue-50 text-slate-800 rounded"
              onClick={() => handlePreferenceSelection("Evening")}
            >
              <span className="font-bold text-xs text-[#2455a3]">Evening Batch</span>
              <span className="text-[11px] text-slate-500">Theory 2:00 PM to 7:00 PM</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-xs" onClick={() => setShowPreferenceModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institutional Page Title */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#2455a3] dark:text-blue-400 uppercase tracking-wider">
            Academic Timetable Generator
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">VTOP Course Registration Import</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Upload Course Registration Excel (.xlsx)
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-xs leading-relaxed max-w-2xl">
          Export your course registration sheet from VTOP and upload it below. Our backtracking solver evaluates slot permutations to generate 100% clash-free schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-3 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="font-bold mb-0.5">Upload Error</p>
                <p className="leading-relaxed">{errorMessage}</p>
                <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">
                  Tip: Ensure your file contains course code, title, and slot columns exported from VTOP.
                </p>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isUploading && (
            <div
              role="status"
              className="p-4 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 text-xs"
            >
              <div className="w-5 h-5 border-2 border-[#2455a3] dark:border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <p className="font-bold text-[#1b4b8a] dark:text-blue-300">Optimizing Course Combinations...</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Solving theory and laboratory slot constraints with zero clashes.
                </p>
              </div>
            </div>
          )}

          {/* Dedicated VTOP Batch Shift Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Target Academic Shift (Batch)
                </h3>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-[#2455a3] dark:text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                VIT Slot Standard
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-xs mb-3">
              Select your academic shift. According to VIT FFCS regulations, shifts are strictly separated with zero mixed slots:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Morning Batch Card */}
              <button
                type="button"
                onClick={() => setBatchPreference("Morning")}
                className={`p-3.5 rounded border transition-all text-left flex flex-col justify-between ${
                  batchPreference === "Morning"
                    ? "border-[#2455a3] bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-[#2455a3]/30 dark:ring-blue-500/30"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        batchPreference === "Morning" ? "border-[#2455a3] bg-[#2455a3] text-white" : "border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}>
                        {batchPreference === "Morning" && <Check className="w-2.5 h-2.5" />}
                      </span>
                      Morning Shift
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#2455a3] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      A1 / B1 / C1 ...
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-6">
                    <div><span className="font-semibold text-slate-800 dark:text-slate-200">Theory:</span> 08:00 AM – 01:00 PM (*1 series)</div>
                    <div><span className="font-semibold text-slate-800 dark:text-slate-200">Labs:</span> 02:00 PM – 07:30 PM (L31 to L60)</div>
                  </div>
                </div>
                <div className="mt-2 pl-6 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {batchPreference === "Morning" ? "✓ Active selection for this upload" : "Click to select morning shift"}
                </div>
              </button>

              {/* Evening Batch Card */}
              <button
                type="button"
                onClick={() => setBatchPreference("Evening")}
                className={`p-3.5 rounded border transition-all text-left flex flex-col justify-between ${
                  batchPreference === "Evening"
                    ? "border-[#2455a3] bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-[#2455a3]/30 dark:ring-blue-500/30"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        batchPreference === "Evening" ? "border-[#2455a3] bg-[#2455a3] text-white" : "border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}>
                        {batchPreference === "Evening" && <Check className="w-2.5 h-2.5" />}
                      </span>
                      Evening Shift
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      A2 / B2 / C2 ...
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-6">
                    <div><span className="font-semibold text-slate-800 dark:text-slate-200">Labs:</span> 08:00 AM – 01:20 PM (L1 to L30)</div>
                    <div><span className="font-semibold text-slate-800 dark:text-slate-200">Theory:</span> 02:00 PM – 07:00 PM (*2 series)</div>
                  </div>
                </div>
                <div className="mt-2 pl-6 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {batchPreference === "Evening" ? "✓ Active selection for this upload" : "Click to select evening shift"}
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded p-8 text-center transition-colors ${
                isDragging
                  ? "border-[#2455a3] bg-blue-50/50 dark:bg-blue-950/40"
                  : file
                  ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30"
                  : errorMessage
                  ? "border-red-400 bg-red-50/30 dark:bg-red-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-[#2455a3] bg-slate-50/50 dark:bg-slate-800/40"
              }`}
            >
              <input
                id="excel-file-input"
                type="file"
                aria-label="Upload Course Excel file"
                aria-invalid={!!errorMessage}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv,.json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploading}
              />

              {file ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{file.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Ready for schedule generation
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded bg-blue-100 dark:bg-blue-950/70 flex items-center justify-center text-[#2455a3] dark:text-blue-400">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Drop your VTOP Course Registration Excel file here
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      or click to browse from device • Supports .xlsx, .xls, .csv
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            {file && (
              <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2.5 text-left">
                <input
                  id="upload-data-consent"
                  type="checkbox"
                  checked={dataConsent}
                  onChange={(e) => setDataConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-[#2455a3] focus:ring-[#2455a3] h-3.5 w-3.5 shrink-0 bg-white dark:bg-slate-700"
                />
                <label htmlFor="upload-data-consent" className="cursor-pointer select-none text-slate-700 dark:text-slate-300 leading-tight">
                  I confirm that this is my course registration data and consent to timetable processing under the{" "}
                  <Link to="/privacy-policy" className="text-[#2455a3] dark:text-blue-400 underline font-semibold">Privacy Policy</Link> and{" "}
                  <Link to="/terms" className="text-[#2455a3] dark:text-blue-400 underline font-semibold">Terms</Link>.
                </label>
              </div>
            )}

            {/* Hidden honeypot field for spam prevention */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="upload_hp"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-5">
              <Button
                size="default"
                disabled={!file || isUploading}
                onClick={() => handleUpload()}
                className="w-full sm:flex-1 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-10 rounded shadow-sm gap-2"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>{isUploading ? "Generating Schedules..." : "Generate Conflict-Free Timetables"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              {file && !isUploading && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setFile(null);
                    setErrorMessage(null);
                  }}
                  className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs h-10 rounded"
                >
                  Clear File
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions & Guidelines */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <FileText className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>VTOP Export Instructions</span>
            </h3>
            <ol className="space-y-3 text-xs">
              {[
                { title: "Export Course Allocation", desc: "Log in to VTOP and export your registered courses as Excel." },
                { title: "Upload Excel File", desc: "Drag and drop the sheet into the upload zone above." },
                { title: "Select Batch Shift", desc: "Choose preferred Morning or Evening theory slot distribution." },
                { title: "Review Valid Schedules", desc: "Inspect clash-free timetable combinations and choose your preferred one." },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-[#2455a3] dark:text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{step.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-3.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Files are parsed directly in session memory. Personal registration details are never shared or transferred to third parties.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
