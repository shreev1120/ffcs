import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  GraduationCap,
  CalendarCheck2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { ParsedCourse } from "@/lib/clientExcelParser";
import { generateClientTimetables } from "@/lib/clientTimetableGenerator";

interface FacultyItem {
  name: string;
  courses: ParsedCourse[];
  subjectCodes: string[];
  slots: string[];
  venues: string[];
  hasTheory: boolean;
  hasLab: boolean;
}

interface SubjectCoverage {
  courseCode: string;
  courseName: string;
  totalOfferings: number;
  availableFaculties: string[];
  selectedCount: number;
}

const FacultySelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();

  // Load parsed courses from navigation state or sessionStorage
  const [courses, setCourses] = useState<ParsedCourse[]>(() => {
    if (location.state?.parsedCourses && Array.isArray(location.state.parsedCourses)) {
      try {
        sessionStorage.setItem("vtop_ffcs_uploaded_courses", JSON.stringify(location.state.parsedCourses));
        if (location.state.fileName) {
          sessionStorage.setItem("vtop_ffcs_uploaded_filename", location.state.fileName);
        }
      } catch (e) {
        console.warn("Could not cache to sessionStorage:", e);
      }
      return location.state.parsedCourses;
    }

    try {
      const cached = sessionStorage.getItem("vtop_ffcs_uploaded_courses");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Could not retrieve cached courses:", e);
    }
    return [];
  });

  const [fileName] = useState<string>(() => {
    return location.state?.fileName || sessionStorage.getItem("vtop_ffcs_uploaded_filename") || "Uploaded Excel Sheet";
  });

  // User filter & selection states
  const [selectedFaculties, setSelectedFaculties] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<"all" | "selected" | "unselected">("all");
  const [batchPreference, setBatchPreference] = useState<"Morning" | "Evening" | "Both">(() => {
    return (user?.preferences?.batchPreference as "Morning" | "Evening" | "Both") || "Evening";
  });
  const [maxTimetables, setMaxTimetables] = useState<number>(() => {
    return user?.preferences?.maxTimetables || 50;
  });
  const [rankingCriteria, setRankingCriteria] = useState<"balanced" | "max_free_days" | "earliest_finish" | "no_morning">(
    "balanced"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract unique faculties and their taught courses
  const facultyList = useMemo<FacultyItem[]>(() => {
    if (!courses || courses.length === 0) return [];

    const map = new Map<string, ParsedCourse[]>();
    courses.forEach((c) => {
      const fac = (c.faculty || "TBA").trim();
      if (!fac || fac.toUpperCase() === "TBA" || fac.toUpperCase() === "TBD") return;
      if (!map.has(fac)) {
        map.set(fac, []);
      }
      map.get(fac)!.push(c);
    });

    const list: FacultyItem[] = [];
    map.forEach((courseList, name) => {
      const subjectCodes = Array.from(new Set(courseList.map((c) => c.courseCode)));
      const slots = Array.from(new Set(courseList.map((c) => c.slot).filter(Boolean)));
      const venues = Array.from(new Set(courseList.map((c) => c.venue).filter(Boolean)));
      const hasTheory = courseList.some((c) => !c.isLab && !c.courseType?.toLowerCase().includes("lab"));
      const hasLab = courseList.some((c) => c.isLab || c.courseType?.toLowerCase().includes("lab"));

      list.push({
        name,
        courses: courseList,
        subjectCodes,
        slots,
        venues,
        hasTheory,
        hasLab,
      });
    });

    // Sort alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [courses]);

  // Extract unique subjects and track coverage
  const subjectCoverage = useMemo<SubjectCoverage[]>(() => {
    if (!courses || courses.length === 0) return [];

    const subjectMap = new Map<string, { name: string; faculties: Set<string>; count: number }>();
    courses.forEach((c) => {
      const code = c.courseCode;
      if (!subjectMap.has(code)) {
        subjectMap.set(code, {
          name: c.courseName || c.title || code,
          faculties: new Set(),
          count: 0,
        });
      }
      const entry = subjectMap.get(code)!;
      entry.count += 1;
      const fac = (c.faculty || "").trim();
      if (fac && fac.toUpperCase() !== "TBA" && fac.toUpperCase() !== "TBD") {
        entry.faculties.add(fac);
      }
    });

    const coverage: SubjectCoverage[] = [];
    subjectMap.forEach((entry, courseCode) => {
      const available = Array.from(entry.faculties);
      const selectedCount = available.filter((f) => selectedFaculties.has(f)).length;
      coverage.push({
        courseCode,
        courseName: entry.name,
        totalOfferings: entry.count,
        availableFaculties: available,
        selectedCount,
      });
    });

    return coverage;
  }, [courses, selectedFaculties]);

  // Calculate covered subjects
  const coveredSubjectCount = useMemo(() => {
    return subjectCoverage.filter((s) => s.selectedCount > 0).length;
  }, [subjectCoverage]);

  // Filter faculties based on search, subject, and view tab
  const filteredFaculties = useMemo(() => {
    return facultyList.filter((fac) => {
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = fac.name.toLowerCase().includes(q);
        const matchesSubject = fac.subjectCodes.some((code) => code.toLowerCase().includes(q));
        const matchesSlot = fac.slots.some((s) => s.toLowerCase().includes(q));
        const matchesCourseName = fac.courses.some((c) => (c.courseName || "").toLowerCase().includes(q));
        if (!matchesName && !matchesSubject && !matchesSlot && !matchesCourseName) {
          return false;
        }
      }

      // Subject filter
      if (subjectFilter !== "all") {
        if (!fac.subjectCodes.includes(subjectFilter)) {
          return false;
        }
      }

      // View tab filter
      if (viewFilter === "selected" && !selectedFaculties.has(fac.name)) {
        return false;
      }
      if (viewFilter === "unselected" && selectedFaculties.has(fac.name)) {
        return false;
      }

      return true;
    });
  }, [facultyList, searchTerm, subjectFilter, viewFilter, selectedFaculties]);

  // Toggle single faculty
  const toggleFaculty = (name: string) => {
    setSelectedFaculties((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Quick Action: Select All in current view or overall
  const handleSelectAll = () => {
    setSelectedFaculties(new Set(facultyList.map((f) => f.name)));
    toast({
      title: "All Faculties Selected",
      description: `Selected all ${facultyList.length} faculty members.`,
    });
  };

  // Quick Action: Clear All
  const handleClearAll = () => {
    setSelectedFaculties(new Set());
    toast({
      title: "Selection Cleared",
      description: "Cleared all faculty selections.",
    });
  };

  // Quick Action: Select 1st faculty for every subject
  const handleSelectOnePerSubject = () => {
    const next = new Set<string>();
    subjectCoverage.forEach((sub) => {
      if (sub.availableFaculties.length > 0) {
        next.add(sub.availableFaculties[0]);
      }
    });
    setSelectedFaculties(next);
    toast({
      title: "Preset Applied",
      description: `Selected 1 primary faculty for each of the ${subjectCoverage.length} subjects.`,
    });
  };

  // Main Generation Handler
  const handleGenerate = async () => {
    if (!courses || courses.length === 0) {
      setErrorMessage("No course data available. Please re-upload your Excel sheet.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const facultyFilterArray = Array.from(selectedFaculties);

    try {
      let genData: any = null;

      // In guest mode, execute client-side generator directly
      if (isGuest) {
        genData = generateClientTimetables(courses, {
          batchPreference,
          rankingCriteria,
          maxTimetables,
          minCredits: 18,
          maxCredits: 27,
          selectedFaculties: facultyFilterArray,
        });
      } else {
        // Attempt backend generation API with selectedFaculties
        try {
          const genResponse = await fetch(`${API_BASE_URL}/timetable/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              courses,
              preferences: {
                batchPreference,
                rankingCriteria,
                maxTimetables,
                minCredits: 18,
                maxCredits: 27,
                selectedFaculties: facultyFilterArray,
              },
            }),
          });

          if (genResponse.ok) {
            genData = await genResponse.json();
          }
        } catch (apiErr) {
          console.info("Backend unreachable, falling back to high-speed client generator:", apiErr);
        }

        // Resilient browser fallback
        if (!genData) {
          genData = generateClientTimetables(courses, {
            batchPreference,
            rankingCriteria,
            maxTimetables,
            minCredits: 18,
            maxCredits: 27,
            selectedFaculties: facultyFilterArray,
          });
        }
      }

      if (!genData || !genData.timetablesCount) {
        throw new Error(
          `Could not generate valid ${batchPreference} timetables with the selected faculty combination. Try selecting additional faculties or check slot compatibility.`
        );
      }

      toast({
        title: "Timetables Generated Successfully!",
        description: `Constructed ${genData.timetablesCount} conflict-free ${batchPreference} schedules based on your faculty selection.`,
      });

      // Cache results in localStorage
      try {
        localStorage.setItem("vtop_ffcs_latest_timetable", JSON.stringify(genData));
        localStorage.setItem("vtop_ffcs_selected_batch", batchPreference);
        localStorage.setItem("vtop_ffcs_selected_faculties", JSON.stringify(facultyFilterArray));
      } catch (err) {
        console.warn("Could not cache timetable to localStorage:", err);
      }

      navigate("/results", {
        state: {
          timetableData: genData,
          selectedBatch: batchPreference,
          selectedFaculties: facultyFilterArray,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate timetables";
      setErrorMessage(msg);
      toast({
        title: "Generation Notice",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // If no courses were provided, show guidance card
  if (!courses || courses.length === 0) {
    return (
      <DashboardLayout>
        <SEO
          title="Select Faculty Members"
          description="Choose preferred faculty members from your VTOP Excel upload to generate customized timetables."
        />
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-10 text-center max-w-xl mx-auto my-12">
          <FileSpreadsheet className="w-12 h-12 text-[#2455a3] dark:text-blue-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No Course Registration Sheet Loaded
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs mb-6 leading-relaxed">
            Please upload your VTOP course registration Excel file first. Our system will extract the faculty list so you can choose your favorite teachers.
          </p>
          <Button
            asChild
            className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-10 px-5 rounded"
          >
            <Link to="/upload" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Excel Upload</span>
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO
        title="Select Preferred Faculty"
        description="Filter course offerings by your chosen faculty members to generate customized VIT FFCS timetables."
      />

      {/* Institutional Step Header */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden transition-colors">
        <div className="vtop-header-gradient px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#1b4b8a]">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white mr-2 border border-white/25">
              Step 2 of 3 • Faculty Optimization
            </span>
            <span className="text-xs text-white/90 font-medium">
              Source: <span className="font-mono underline">{fileName}</span>
            </span>
          </div>
          <Link
            to="/upload"
            className="text-xs text-white/90 hover:text-white flex items-center gap-1.5 underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Upload Different Sheet</span>
          </Link>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Select Preferred Faculty Members
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2 text-xs sm:text-sm leading-relaxed">
                Choose one or more of your preferred faculties for each subject from your sheet. The algorithm will search your selections across all subjects and slots to assemble conflict-free timetables featuring your top teachers.
              </p>

              {/* Quick Summary Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-[#2455a3] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{facultyList.length} Unique Faculties Found</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>{subjectCoverage.length} Subjects in Sheet</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold border ${
                    selectedFaculties.size > 0
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedFaculties.size} Selected ({coveredSubjectCount}/{subjectCoverage.length} Subjects Covered)
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6 min-w-[240px] space-y-2">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Quick Selection Tools:
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectOnePerSubject}
                className="w-full justify-start text-xs font-semibold h-8 border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 text-[#2455a3] dark:text-blue-400" />
                <span>Pick 1st Faculty per Subject</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full justify-start text-xs font-semibold h-8 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <span>Select All Faculties ({facultyList.length})</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="w-full justify-start text-xs font-semibold h-8 border-slate-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2 text-rose-500" />
                <span>Clear Selection</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Coverage Live Tracker Strip */}
      <div className="mb-6 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Subject Faculty Coverage ({coveredSubjectCount} of {subjectCoverage.length} Configured)
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {coveredSubjectCount === subjectCoverage.length
              ? "All subjects have preferred faculty selected! Zero random teachers."
              : "Subjects with 0 selected faculty will consider all available teachers for that subject."}
          </p>
        </div>

        {/* Horizontal Chips for each Subject */}
        <div className="flex flex-wrap gap-2">
          {subjectCoverage.map((sub) => {
            const isSelected = sub.selectedCount > 0;
            const isActiveFilter = subjectFilter === sub.courseCode;

            return (
              <button
                key={sub.courseCode}
                type="button"
                onClick={() => setSubjectFilter(isActiveFilter ? "all" : sub.courseCode)}
                className={`text-left text-xs px-2.5 py-1.5 rounded border transition-all flex items-center gap-2 ${
                  isActiveFilter
                    ? "ring-2 ring-[#2455a3] dark:ring-blue-400 border-[#2455a3] bg-blue-50 dark:bg-blue-950/40"
                    : isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
                title={`Click to filter list by ${sub.courseCode}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold">{sub.courseCode}</span>
                  {isSelected ? (
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                      {sub.selectedCount}/{sub.availableFaculties.length}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
                      All
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search faculty name, course code (e.g. ISWE206L), or slot (e.g. A2+TA2)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewFilter("all")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All ({facultyList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter("selected")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewFilter === "selected"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Selected ({selectedFaculties.size})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter("unselected")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewFilter === "unselected"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Unselected ({facultyList.length - selectedFaculties.size})
            </button>
          </div>

          {/* Subject Dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Subjects ({subjectCoverage.length})</option>
            {subjectCoverage.map((sub) => (
              <option key={sub.courseCode} value={sub.courseCode}>
                {sub.courseCode} ({sub.availableFaculties.length} facs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert Banner if Any */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-3 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-bold">Generation Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-8">
        {filteredFaculties.map((fac) => {
          const isSelected = selectedFaculties.has(fac.name);

          return (
            <div
              key={fac.name}
              onClick={() => toggleFaculty(fac.name)}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-400/50"
                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-card"
              }`}
            >
              <div>
                {/* Header: Checkbox + Name */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h3
                        className={`text-xs font-bold leading-tight ${
                          isSelected
                            ? "text-emerald-900 dark:text-emerald-200"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {fac.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Teaches {fac.subjectCodes.length} {fac.subjectCodes.length === 1 ? "Subject" : "Subjects"} (
                        {fac.courses.length} {fac.courses.length === 1 ? "Offering" : "Offerings"})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                      isSelected
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isSelected ? "Selected" : "Available"}
                  </span>
                </div>

                {/* Offerings badges */}
                <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-150 dark:border-slate-800 text-[11px]">
                  {fac.courses.map((c, idx) => {
                    const isLab = c.isLab || c.courseType?.toLowerCase().includes("lab");

                    return (
                      <div
                        key={c.courseCode + c.slot + idx}
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-[#2455a3] dark:text-blue-300 shrink-0">
                            {c.courseCode}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {c.courseName || c.title || ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isLab
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {c.slot}
                          </span>
                          {c.venue && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {c.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFaculties.length === 0 && (
        <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-card mb-8">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Faculty Found Matching Your Filter
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Try adjusting your search query or reset the filter tabs.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSubjectFilter("all");
              setViewFilter("all");
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Bottom Sticky Generation Dock */}
      <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 rounded-xl shadow-2xl p-4 sm:p-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Timing & Strategy Selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Preferred Shift
              </label>
              <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBatchPreference("Evening")}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    batchPreference === "Evening"
                      ? "bg-[#2455a3] text-white shadow-sm font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Evening (2:00 - 7:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setBatchPreference("Morning")}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    batchPreference === "Morning"
                      ? "bg-[#2455a3] text-white shadow-sm font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Morning (8:00 AM - 1:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setBatchPreference("Both")}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    batchPreference === "Both"
                      ? "bg-[#2455a3] text-white shadow-sm font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Both Batches
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Max Combinations
              </label>
              <select
                value={maxTimetables}
                onChange={(e) => setMaxTimetables(Number(e.target.value))}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value={10}>10 Schedules</option>
                <option value={25}>25 Schedules</option>
                <option value={50}>50 Schedules</option>
                <option value={100}>100 Schedules</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Optimization Priority
              </label>
              <select
                value={rankingCriteria}
                onChange={(e) => setRankingCriteria(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="balanced">Balanced Distribution (Default)</option>
                <option value="max_free_days">Maximize Free Days</option>
                <option value="earliest_finish">Earliest Daily Finish Time</option>
                <option value="no_morning">Avoid 8:00 AM Slots</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              variant="outline"
              size="default"
              className="text-xs font-semibold h-11 px-4 border-slate-300 dark:border-slate-700 rounded"
            >
              <Link to="/upload" className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Upload Sheet</span>
              </Link>
            </Button>

            <Button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 rounded shadow-lg flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving Clash-Free Permutations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Generate Timetables
                    {selectedFaculties.size > 0 ? ` (${selectedFaculties.size} Selected)` : " (All Faculties)"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultySelection;
