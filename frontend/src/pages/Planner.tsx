import { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Download,
  Printer,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Award,
  BookOpen,
  User,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CURRICULUM_COURSES, type CurriculumCourse } from "@/data/curriculumCourses";
import {
  checkSlotClash,
  getAllSessionsForCompoundSlot,
  parseSlotList,
  COMMON_THEORY_SLOTS,
  COMMON_LAB_SLOTS,
} from "@/lib/slotMapping";

export interface PlannedCourse {
  id: string;
  courseCode: string;
  courseTitle: string;
  category: "Foundation Core" | "Discipline-linked Engineering Sciences" | "Discipline Core" | "Discipline Elective" | "Other";
  categoryShort: "FC" | "DLES" | "DC" | "DE" | "Other";
  courseType: "Theory" | "Lab" | "Embedded" | "Soft Skill" | "Project" | "Basket";
  slot: string; // e.g. "A1+TA1" or "L31+L32"
  faculty: string;
  venue: string;
  credits: number;
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
type WeekDay = (typeof WEEK_DAYS)[number];

const MORNING_SLOT_CELLS: Record<WeekDay, { theory: string; lab: string }[]> = {
  Monday: [
    { theory: "A1", lab: "L1" },
    { theory: "F1", lab: "L2" },
    { theory: "D1", lab: "L3" },
    { theory: "TB1", lab: "L4" },
    { theory: "TG1", lab: "L5" },
    { theory: "", lab: "L6" },
  ],
  Tuesday: [
    { theory: "B1", lab: "L7" },
    { theory: "G1", lab: "L8" },
    { theory: "E1", lab: "L9" },
    { theory: "TC1", lab: "L10" },
    { theory: "TAA1", lab: "L11" },
    { theory: "", lab: "L12" },
  ],
  Wednesday: [
    { theory: "C1", lab: "L13" },
    { theory: "A1", lab: "L14" },
    { theory: "F1", lab: "L15" },
    { theory: "TD1", lab: "L16" },
    { theory: "Extramural", lab: "" },
    { theory: "", lab: "" },
  ],
  Thursday: [
    { theory: "D1", lab: "L19" },
    { theory: "B1", lab: "L20" },
    { theory: "G1", lab: "L21" },
    { theory: "TE1", lab: "L22" },
    { theory: "TCC1", lab: "L23" },
    { theory: "", lab: "L24" },
  ],
  Friday: [
    { theory: "E1", lab: "L25" },
    { theory: "C1", lab: "L26" },
    { theory: "TA1", lab: "L27" },
    { theory: "TF1", lab: "L28" },
    { theory: "TDD1", lab: "L29" },
    { theory: "", lab: "L30" },
  ],
};

const EVENING_SLOT_CELLS: Record<WeekDay, { theory: string; lab: string }[]> = {
  Monday: [
    { theory: "A2", lab: "L31" },
    { theory: "F2", lab: "L32" },
    { theory: "D2", lab: "L33" },
    { theory: "TB2", lab: "L34" },
    { theory: "TG2", lab: "L35" },
    { theory: "", lab: "L36" },
  ],
  Tuesday: [
    { theory: "B2", lab: "L37" },
    { theory: "G2", lab: "L38" },
    { theory: "E2", lab: "L39" },
    { theory: "TC2", lab: "L40" },
    { theory: "TAA2", lab: "L41" },
    { theory: "", lab: "L42" },
  ],
  Wednesday: [
    { theory: "C2", lab: "L43" },
    { theory: "A2", lab: "L44" },
    { theory: "F2", lab: "L45" },
    { theory: "TD2", lab: "L46" },
    { theory: "TBB2", lab: "L47" },
    { theory: "", lab: "L48" },
  ],
  Thursday: [
    { theory: "D2", lab: "L49" },
    { theory: "B2", lab: "L50" },
    { theory: "G2", lab: "L51" },
    { theory: "TE2", lab: "L52" },
    { theory: "TCC2", lab: "L53" },
    { theory: "", lab: "L54" },
  ],
  Friday: [
    { theory: "E2", lab: "L55" },
    { theory: "C2", lab: "L56" },
    { theory: "TA2", lab: "L57" },
    { theory: "TF2", lab: "L58" },
    { theory: "TDD2", lab: "L59" },
    { theory: "", lab: "L60" },
  ],
};

const THEORY_HOURS = [
  "08:00 AM - 08:50 AM",
  "08:55 AM - 09:45 AM",
  "09:50 AM - 10:40 AM",
  "10:45 AM - 11:35 AM",
  "11:40 AM - 12:30 PM",
  "-",
  "02:00 PM - 02:50 PM",
  "02:55 PM - 03:45 PM",
  "03:50 PM - 04:40 PM",
  "04:45 PM - 05:35 PM",
  "05:40 PM - 06:30 PM",
  "-",
];

const LAB_HOURS = [
  "08:00 AM - 08:50 AM",
  "08:50 AM - 09:40 AM",
  "09:50 AM - 10:40 AM",
  "10:40 AM - 11:30 AM",
  "11:40 AM - 12:30 PM",
  "12:30 PM - 01:20 PM",
  "02:00 PM - 02:50 PM",
  "02:50 PM - 03:40 PM",
  "03:50 PM - 04:40 PM",
  "04:40 PM - 05:30 PM",
  "05:40 PM - 06:30 PM",
  "06:30 PM - 07:20 PM",
];

const COURSE_COLOR_SCHEMES = [
  { bg: "bg-blue-100 dark:bg-blue-950/80 border-blue-400 text-blue-950 dark:text-blue-100", badge: "bg-blue-600 text-white" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-950 dark:text-emerald-100", badge: "bg-emerald-600 text-white" },
  { bg: "bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-950 dark:text-amber-100", badge: "bg-amber-600 text-white" },
  { bg: "bg-purple-100 dark:bg-purple-950/80 border-purple-400 text-purple-950 dark:text-purple-100", badge: "bg-purple-600 text-white" },
  { bg: "bg-rose-100 dark:bg-rose-950/80 border-rose-400 text-rose-950 dark:text-rose-100", badge: "bg-rose-600 text-white" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/80 border-indigo-400 text-indigo-950 dark:text-indigo-100", badge: "bg-indigo-600 text-white" },
  { bg: "bg-teal-100 dark:bg-teal-950/80 border-teal-400 text-teal-950 dark:text-teal-100", badge: "bg-teal-600 text-white" },
  { bg: "bg-orange-100 dark:bg-orange-950/80 border-orange-400 text-orange-950 dark:text-orange-100", badge: "bg-orange-600 text-white" },
];

function getCourseColor(courseCode: string) {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = (hash << 5) - hash + courseCode.charCodeAt(i);
    hash |= 0;
  }
  return COURSE_COLOR_SCHEMES[Math.abs(hash) % COURSE_COLOR_SCHEMES.length];
}

const LOCAL_STORAGE_KEY = "vtop_ffcs_manual_planner_courses_v1";

const Planner = () => {
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  // Planned courses state
  const [courses, setCourses] = useState<PlannedCourse[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedCurriculumCode, setSelectedCurriculumCode] = useState<string>("");
  const [customCode, setCustomCode] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<PlannedCourse["category"]>("Discipline Core");
  const [customType, setCustomType] = useState<PlannedCourse["courseType"]>("Theory");
  const [slot, setSlot] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [credits, setCredits] = useState<number>(3.0);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "FC" | "DLES" | "DC" | "DE">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clearAllOpen, setClearAllOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // ignore
    }
  }, [courses]);

  // Total credits calculation
  const totalCredits = useMemo(() => {
    return courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [courses]);

  // Breakdown by category
  const categoryCredits = useMemo(() => {
    const acc: Record<string, number> = { FC: 0, DLES: 0, DC: 0, DE: 0, Other: 0 };
    courses.forEach((c) => {
      const cat = c.categoryShort || "Other";
      acc[cat] = (acc[cat] || 0) + (Number(c.credits) || 0);
    });
    return acc;
  }, [courses]);

  // Slot to course mapping lookup
  const slotToCourseMap = useMemo(() => {
    const map = new Map<string, PlannedCourse>();
    courses.forEach((c) => {
      const pieces = parseSlotList(c.slot);
      pieces.forEach((p) => {
        map.set(p.toUpperCase(), c);
      });
    });
    return map;
  }, [courses]);

  // Filtered curriculum list for modal selection
  const filteredCurriculum = useMemo(() => {
    return CURRICULUM_COURSES.filter((c) => {
      const matchesCat = categoryFilter === "ALL" || c.categoryShort === categoryFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [categoryFilter, searchQuery]);

  // Check clash for modal input
  const clashWith = useMemo(() => {
    if (!slot.trim()) return null;
    const pieces = parseSlotList(slot);
    for (const p of pieces) {
      for (const existing of courses) {
        if (editingCourseId && existing.id === editingCourseId) continue;
        if (checkSlotClash(p, existing.slot)) {
          return existing;
        }
      }
    }
    return null;
  }, [slot, courses, editingCourseId]);

  // Open modal from clicking a slot cell
  const handleCellClick = (slotLabel: string, isLab: boolean) => {
    const existing = slotToCourseMap.get(slotLabel.toUpperCase());
    if (existing) {
      handleEditCourse(existing);
      return;
    }

    setEditingCourseId(null);
    // Suggest default paired slot
    let defaultSlot = slotLabel.toUpperCase();
    if (!isLab) {
      const matchPair = COMMON_THEORY_SLOTS.find((s) => s.startsWith(defaultSlot + "+") || s === defaultSlot);
      if (matchPair) defaultSlot = matchPair;
    } else {
      const num = parseInt(defaultSlot.replace("L", ""), 10);
      if (!isNaN(num)) {
        const partner = num % 2 === 1 ? num + 1 : num - 1;
        defaultSlot = num % 2 === 1 ? `L${num}+L${partner}` : `L${partner}+L${num}`;
      }
    }

    setSlot(defaultSlot);
    setSelectedCurriculumCode("");
    setCustomCode("");
    setCustomTitle("");
    setFaculty("");
    setVenue("");
    setCredits(isLab ? 1.0 : 3.0);
    setCustomType(isLab ? "Lab" : "Theory");
    setIsModalOpen(true);
  };

  // Open modal for manual "Add Course"
  const handleAddNewCourse = () => {
    setEditingCourseId(null);
    setSelectedCurriculumCode("");
    setCustomCode("");
    setCustomTitle("");
    setSlot("A1+TA1");
    setFaculty("");
    setVenue("");
    setCredits(3.0);
    setCustomType("Theory");
    setIsModalOpen(true);
  };

  // Edit existing course
  const handleEditCourse = (course: PlannedCourse) => {
    setEditingCourseId(course.id);
    const inCurriculum = CURRICULUM_COURSES.find((c) => c.code === course.courseCode);
    if (inCurriculum) {
      setSelectedCurriculumCode(inCurriculum.code);
    } else {
      setSelectedCurriculumCode("CUSTOM");
      setCustomCode(course.courseCode);
      setCustomTitle(course.courseTitle);
      setCustomCategory(course.category);
    }
    setSlot(course.slot);
    setFaculty(course.faculty);
    setVenue(course.venue);
    setCredits(course.credits);
    setCustomType(course.courseType);
    setIsModalOpen(true);
  };

  // Handle Curriculum dropdown change
  const handleCurriculumSelect = (code: string) => {
    setSelectedCurriculumCode(code);
    if (code === "CUSTOM") {
      setCustomCode("");
      setCustomTitle("");
      setCredits(3.0);
      return;
    }
    const found = CURRICULUM_COURSES.find((c) => c.code === code);
    if (found) {
      setCustomCode(found.code);
      setCustomTitle(found.title);
      setCustomCategory(found.category);
      setCustomType(found.courseType);
      setCredits(found.credits);

      // Auto-suggest slot type if empty or mismatched
      if (found.courseType === "Lab" && !slot.toUpperCase().startsWith("L")) {
        setSlot("L31+L32");
      } else if (found.courseType === "Theory" && slot.toUpperCase().startsWith("L")) {
        setSlot("A1+TA1");
      }
    }
  };

  // Save Course
  const handleSaveCourse = () => {
    if (!slot.trim()) {
      toast({ title: "Slot Required", description: "Please specify or select a slot for this course.", variant: "destructive" });
      return;
    }

    let code = customCode.trim().toUpperCase();
    let title = customTitle.trim();
    let cat = customCategory;
    let catShort: PlannedCourse["categoryShort"] = "DC";
    let type = customType;

    if (selectedCurriculumCode && selectedCurriculumCode !== "CUSTOM") {
      const cur = CURRICULUM_COURSES.find((c) => c.code === selectedCurriculumCode);
      if (cur) {
        code = cur.code;
        title = cur.title;
        cat = cur.category;
        catShort = cur.categoryShort;
        type = cur.courseType;
      }
    } else {
      if (!code) {
        toast({ title: "Course Code Required", description: "Please enter a valid course code.", variant: "destructive" });
        return;
      }
      if (cat === "Foundation Core") catShort = "FC";
      else if (cat === "Discipline-linked Engineering Sciences") catShort = "DLES";
      else if (cat === "Discipline Core") catShort = "DC";
      else if (cat === "Discipline Elective") catShort = "DE";
      else catShort = "Other";
    }

    if (clashWith) {
      toast({
        title: "Slot Clash Detected",
        description: `This slot overlaps with ${clashWith.courseCode} (${clashWith.slot}). Please resolve the clash first.`,
        variant: "destructive",
      });
      return;
    }

    const newCourse: PlannedCourse = {
      id: editingCourseId || `planned-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      courseCode: code,
      courseTitle: title || code,
      category: cat,
      categoryShort: catShort,
      courseType: type,
      slot: slot.trim().toUpperCase(),
      faculty: faculty.trim() || "Faculty",
      venue: venue.trim() || "TBD",
      credits: Number(credits) || 3.0,
    };

    if (editingCourseId) {
      setCourses((prev) => prev.map((c) => (c.id === editingCourseId ? newCourse : c)));
      toast({ title: "Course Updated", description: `${newCourse.courseCode} updated in your timetable plan.` });
    } else {
      setCourses((prev) => [...prev, newCourse]);
      toast({ title: "Course Added", description: `${newCourse.courseCode} (${newCourse.slot}) added to timetable.` });
    }

    setIsModalOpen(false);
  };

  // Remove Course
  const handleDeleteCourse = (id: string) => {
    const toDelete = courses.find((c) => c.id === id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: "Course Removed",
      description: `${toDelete?.courseCode || "Course"} cleared from timetable.`,
    });
  };

  // Clear Slot from modal
  const handleClearCurrentSlot = () => {
    if (editingCourseId) {
      handleDeleteCourse(editingCourseId);
      setIsModalOpen(false);
    } else {
      setIsModalOpen(false);
    }
  };

  // Download timetable as PNG
  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: "#0f172a",
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `VIT_FFCS_Planned_Schedule_${Date.now()}.png`;
      link.href = dataUrl;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1500);
      toast({ title: "Image Downloaded", description: "Timetable grid saved as high-res PNG." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate screenshot.", variant: "destructive" });
    }
  };

  // Helper to render an individual slot cell in the grid
  const renderCell = (day: WeekDay, theorySlot: string, labSlot: string) => {
    const occupiedTheory = theorySlot ? slotToCourseMap.get(theorySlot.toUpperCase()) : null;
    const occupiedLab = labSlot ? slotToCourseMap.get(labSlot.toUpperCase()) : null;
    const occupied = occupiedTheory || occupiedLab;

    if (theorySlot === "Extramural") {
      return (
        <td key={`cell-${day}-extramural`} className="border border-slate-300 dark:border-slate-800 p-1.5 text-center bg-slate-100/60 dark:bg-slate-900/40 text-[10px] font-bold text-slate-400">
          Extramural
        </td>
      );
    }

    if (!theorySlot && !labSlot) {
      return (
        <td key={`cell-${day}-empty`} className="border border-slate-300 dark:border-slate-800 p-1.5 text-center bg-slate-50 dark:bg-slate-950/20 text-[10px] text-slate-300 dark:text-slate-700">
          -
        </td>
      );
    }

    if (occupied) {
      const theme = getCourseColor(occupied.courseCode);
      const isLab = occupied === occupiedLab;
      return (
        <td
          key={`cell-${day}-${theorySlot}-${labSlot}`}
          onClick={() => handleEditCourse(occupied)}
          title={`Click to edit ${occupied.courseCode} (${occupied.slot})`}
          className={`border border-slate-300 dark:border-slate-800 p-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${theme.bg}`}
        >
          <div className="flex flex-col justify-between h-full min-h-[58px]">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[9px] font-black px-1 py-0.5 rounded ${theme.badge}`}>
                {isLab ? labSlot : theorySlot}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[50px]">
                {occupied.venue || "-"}
              </span>
            </div>
            <div className="font-bold text-[11px] leading-tight mt-1 truncate" title={occupied.courseCode}>
              {occupied.courseCode}
            </div>
            <div className="text-[9px] text-slate-600 dark:text-slate-300 truncate" title={occupied.faculty}>
              {occupied.faculty}
            </div>
          </div>
        </td>
      );
    }

    // Unoccupied Slot
    return (
      <td
        key={`cell-${day}-${theorySlot}-${labSlot}`}
        onClick={() => handleCellClick(theorySlot || labSlot, !theorySlot)}
        title={`Click to assign course to ${[theorySlot, labSlot].filter(Boolean).join(" / ")}`}
        className="border border-slate-300 dark:border-slate-800 p-1.5 cursor-pointer transition-colors bg-white dark:bg-slate-900 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 text-center group"
      >
        <div className="flex flex-col items-center justify-center min-h-[58px] gap-0.5">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#2455a3] dark:group-hover:text-blue-400">
            {[theorySlot, labSlot].filter(Boolean).join(" / ")}
          </span>
          <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            + Click to add
          </span>
        </div>
      </td>
    );
  };

  return (
    <DashboardLayout>
      <SEO
        title="Interactive FFCS Slot Planner"
        description="Click slots to design and plan your conflict-free VIT FFCS timetable with official curriculum courses."
      />

      {/* Header Banner */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#2455a3] dark:text-blue-400 uppercase tracking-wider">
                Interactive Grid Planner
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">VTOP Slot Matrix Solver</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              FFCS Timetable Slot Planner
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs leading-relaxed max-w-2xl">
              Click any slot directly on the timetable grid to select courses from your curriculum (Foundation Core, Discipline Core, Discipline Electives, DLES), assign faculty and track credits in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleAddNewCourse}
              className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-9 rounded flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadImage}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs h-9 rounded flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </Button>

            <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-9 rounded flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Grid</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Entire Timetable Plan?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                    This will clear all {courses.length} enrolled subjects from your planner grid. You can start planning from scratch.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setCourses([]);
                      toast({ title: "Grid Reset", description: "All courses have been cleared." });
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Yes, Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Live Credit Stats Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#2455a3] dark:text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Credits</div>
              <div className="font-extrabold text-sm text-[#2455a3] dark:text-blue-300">
                {totalCredits.toFixed(1)} / 27.0
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Courses</div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {courses.length} Subjects
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-blue-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Foundation (FC)</div>
            <div className="font-bold text-xs text-blue-700 dark:text-blue-300 mt-0.5">{categoryCredits.FC} Cr</div>
          </div>

          <div className="p-2.5 rounded bg-purple-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Discipline (DC)</div>
            <div className="font-bold text-xs text-purple-700 dark:text-purple-300 mt-0.5">{categoryCredits.DC} Cr</div>
          </div>

          <div className="p-2.5 rounded bg-amber-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Elective (DE)</div>
            <div className="font-bold text-xs text-amber-700 dark:text-amber-300 mt-0.5">{categoryCredits.DE} Cr</div>
          </div>

          <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">DLES Engg</div>
            <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{categoryCredits.DLES} Cr</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Slot Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-4 mb-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Official VIT Weekly Slot Matrix
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            💡 Click on any slot box below to assign or clear subjects
          </span>
        </div>

        <div ref={tableRef} className="overflow-x-auto select-none">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-800 text-xs min-w-[1080px]">
            {/* Header 1: Theory Hours */}
            <thead>
              <tr className="bg-[#2455a3] text-white">
                <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-16 uppercase text-[11px]">
                  THEORY HOURS
                </th>
                {THEORY_HOURS.slice(0, 5).map((th, i) => (
                  <th key={`th-${i}`} className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-semibold text-[10px]">
                    {th}
                  </th>
                ))}
                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-semibold text-[10px]">
                  -
                </th>
                <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-12 bg-[#d4ac0d] text-slate-950" rowSpan={2}>
                  L<br />U<br />N<br />C<br />H
                </th>
                {THEORY_HOURS.slice(6, 11).map((th, i) => (
                  <th key={`th-eve-${i}`} className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-semibold text-[10px]">
                    {th}
                  </th>
                ))}
                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-semibold text-[10px]">
                  -
                </th>
              </tr>

              {/* Header 2: Lab Hours */}
              <tr className="bg-[#1b4b8a] text-white">
                <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-16 uppercase text-[11px]">
                  LAB HOURS
                </th>
                {LAB_HOURS.slice(0, 6).map((lh, i) => (
                  <th key={`lh-${i}`} className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-medium text-[10px]">
                    {lh}
                  </th>
                ))}
                {LAB_HOURS.slice(6, 12).map((lh, i) => (
                  <th key={`lh-eve-${i}`} className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-medium text-[10px]">
                    {lh}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Days Rows */}
            <tbody>
              {WEEK_DAYS.map((day) => {
                const morningSlots = MORNING_SLOT_CELLS[day];
                const eveningSlots = EVENING_SLOT_CELLS[day];
                return (
                  <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="border border-slate-300 dark:border-slate-800 p-2 text-center font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                      {day.slice(0, 3).toUpperCase()}
                    </td>
                    {morningSlots.map((s) => renderCell(day, s.theory, s.lab))}
                    <td className="border border-slate-300 dark:border-slate-800 p-1 text-center bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-bold text-[10px]">
                      •
                    </td>
                    {eveningSlots.map((s) => renderCell(day, s.theory, s.lab))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Summary Table (Requested below grid) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>Enrolled Curriculum Courses ({courses.length} Subjects)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Review all selected subjects, faculty assignments, slot allocations, and cumulative credits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700">
              Total Credits: <span className="text-[#2455a3] dark:text-blue-400 text-sm font-extrabold">{totalCredits.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              No courses added yet. Click on any slot in the timetable grid above or click &ldquo;Add Course&rdquo; to plan your courses.
            </p>
            <Button
              onClick={handleAddNewCourse}
              variant="outline"
              className="mt-3 text-xs h-8 rounded border-slate-300 dark:border-slate-700"
            >
              + Add First Course
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">Course Code</th>
                  <th className="p-2.5">Course Title</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Slot</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5">Venue</th>
                  <th className="p-2.5 text-center">Credits</th>
                  <th className="p-2.5 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {courses.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-[#2455a3] dark:text-blue-400">
                      {c.courseCode}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {c.courseTitle}
                    </td>
                    <td className="p-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        c.categoryShort === "FC"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                          : c.categoryShort === "DLES"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : c.categoryShort === "DC"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}>
                        {c.categoryShort}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {c.courseType}
                    </td>
                    <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {c.slot}
                    </td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">
                      {c.faculty}
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">
                      {c.venue}
                    </td>
                    <td className="p-2.5 text-center font-extrabold text-[#2455a3] dark:text-blue-400">
                      {Number(c.credits).toFixed(1)}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditCourse(c)}
                          title="Edit Course"
                          className="p-1 rounded text-slate-500 hover:text-[#2455a3] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id)}
                          title="Delete Course"
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <td colSpan={8} className="p-3 text-right uppercase text-[11px] tracking-wider">
                    Total Enrolled Credits:
                  </td>
                  <td className="p-3 text-center text-sm font-black text-[#2455a3] dark:text-blue-300">
                    {totalCredits.toFixed(1)} Cr
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Course Assignment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{editingCourseId ? "Edit Course in Slot" : "Assign Course to Slot"}</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#2455a3] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {slot || "Slot"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Pick a subject from your M.Tech curriculum (FC, DC, DE, DLES) and enter faculty & slot details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Step 1: Curriculum Course Selection */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Select Curriculum Subject <span className="text-rose-500">*</span>
              </label>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { key: "ALL", label: "All Curriculum (100)" },
                  { key: "FC", label: "Foundation Core (28)" },
                  { key: "DC", label: "Discipline Core (29)" },
                  { key: "DE", label: "Discipline Elective (38)" },
                  { key: "DLES", label: "DLES Engg (5)" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      categoryFilter === key
                        ? "bg-[#2455a3] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search Bar for Curriculum */}
              <input
                type="text"
                placeholder="Search by course code or title (e.g. ISWE102L, Data Structures)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 px-2.5 mb-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
              />

              {/* Curriculum Dropdown */}
              <select
                value={selectedCurriculumCode}
                onChange={(e) => handleCurriculumSelect(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
              >
                <option value="">-- Choose a course from curriculum ({filteredCurriculum.length} available) --</option>
                {filteredCurriculum.map((c) => (
                  <option key={c.code} value={c.code}>
                    [{c.categoryShort}] {c.code} - {c.title} ({c.credits} Cr, {c.courseType})
                  </option>
                ))}
                <option value="CUSTOM">-- Custom / Other Course --</option>
              </select>
            </div>

            {/* Custom Course Name / Code Inputs if Custom Selected */}
            {selectedCurriculumCode === "CUSTOM" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BCSE202L"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Slot & Faculty Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Slot <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. A1+TA1, B1+TB1, L31+L32"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs uppercase font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                {/* Slot quick pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick:</span>
                  {(customType === "Lab" ? COMMON_LAB_SLOTS.slice(0, 5) : COMMON_THEORY_SLOTS.slice(0, 6)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 font-mono"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Venue & Credits Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Venue / Classroom
                </label>
                <input
                  type="text"
                  placeholder="e.g. SJT-201, TT-412"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Credits <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={credits}
                  onChange={(e) => setCredits(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>
            </div>

            {/* Clash Warning */}
            {clashWith && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold">Slot Clash Detected!</p>
                  <p className="text-[11px] mt-0.5">
                    Slot <span className="font-mono font-bold">{slot}</span> overlaps with existing course{" "}
                    <span className="font-bold">{clashWith.courseCode} ({clashWith.slot})</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              {editingCourseId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCurrentSlot}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 text-xs h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear Slot
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveCourse}
                disabled={Boolean(clashWith)}
                className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-8 px-4"
              >
                {editingCourseId ? "Save Changes" : "Assign to Grid"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Planner;
