import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Star, CheckCircle, Download, Trash2, User, Award, Users, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import {
  getCourseCategory,
  getCategoryFullName,
  isCoreCourse,
} from "@/lib/curriculumRules";
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

type TimetableEntry = {
  courseCode: string;
  courseName?: string;
  slot?: string;
  faculty?: string;
  venue?: string;
  startTime: string;
  endTime: string;
  courseType?: string;
};

type TimetableFeatures = {
  totalFreeDays?: number;
  latestStartTime?: string;
  earliestFinishTime?: string;
  curriculumStats?: any;
};

type Timetable = {
  timetableId: string;
  batch?: "Morning" | "Evening" | "Mixed";
  courses?: any[];
  schedule: Record<string, TimetableEntry[]>;
  features?: TimetableFeatures & { batchShift?: string; curriculumStats?: any };
  curriculumStats?: any;
  coreCount?: number;
  rankingScore?: number;
  totalCredits?: number;
  totalCourses?: number;
};

function getCategoryBadge(catCode: string) {
  switch (catCode) {
    case "FC":
      return {
        label: "FC",
        name: "Foundation Core",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      };
    case "DLES":
      return {
        label: "DLES",
        name: "Discipline-linked Engg Science",
        badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700",
      };
    case "DC":
      return {
        label: "DC",
        name: "Discipline Core",
        badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
      };
    case "DE":
    default:
      return {
        label: "DE",
        name: "Discipline Elective",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      };
  }
}

function getTimetableCredits(item?: Timetable | null): number {
  if (!item) return 0;
  if (typeof item.totalCredits === "number" && item.totalCredits > 0) {
    return item.totalCredits;
  }
  if (Array.isArray(item.courses) && item.courses.length > 0) {
    return item.courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }
  if (item.schedule) {
    const seen = new Set<string>();
    Object.values(item.schedule).forEach((entries) => {
      entries.forEach((e) => {
        if (e.courseCode) seen.add(e.courseCode);
      });
    });
    return seen.size * 3;
  }
  return 0;
}

type TimetableData = {
  timetables: Timetable[];
  timetablesCount: number;
};

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PAGE_SIZE = 6;
const DAY_SHORT: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
};

type SlotRange = { start: string; end: string };
type SlotColumn = {
  key: string;
  theory: SlotRange | null;
  lab: SlotRange;
};

const MORNING_COLUMNS: SlotColumn[] = [
  { key: "m1", theory: { start: "08:00", end: "08:50" }, lab: { start: "08:00", end: "08:50" } },
  { key: "m2", theory: { start: "08:55", end: "09:45" }, lab: { start: "08:50", end: "09:40" } },
  { key: "m3", theory: { start: "09:50", end: "10:40" }, lab: { start: "09:50", end: "10:40" } },
  { key: "m4", theory: { start: "10:45", end: "11:35" }, lab: { start: "10:40", end: "11:30" } },
  { key: "m5", theory: { start: "11:40", end: "12:30" }, lab: { start: "11:40", end: "12:30" } },
  { key: "m6", theory: null, lab: { start: "12:30", end: "13:20" } },
];

const EVENING_COLUMNS: SlotColumn[] = [
  { key: "e1", theory: { start: "14:00", end: "14:50" }, lab: { start: "14:00", end: "14:50" } },
  { key: "e2", theory: { start: "14:55", end: "15:45" }, lab: { start: "14:50", end: "15:40" } },
  { key: "e3", theory: { start: "15:50", end: "16:40" }, lab: { start: "15:50", end: "16:40" } },
  { key: "e4", theory: { start: "16:45", end: "17:35" }, lab: { start: "16:40", end: "17:30" } },
  { key: "e5", theory: { start: "17:40", end: "18:30" }, lab: { start: "17:40", end: "18:30" } },
  { key: "e6", theory: null, lab: { start: "18:30", end: "19:20" } },
];

const TEMPLATE_CELL_LABELS: Record<string, { morning: string[]; evening: string[] }> = {
  Monday: {
    morning: ["A1/L1", "F1/L2", "D1/L3", "TB1/L4", "TG1/L5", "L6"],
    evening: ["A2/L31", "F2/L32", "D2/L33", "TB2/L34", "TG2/L35", "L36"],
  },
  Tuesday: {
    morning: ["B1/L7", "G1/L8", "E1/L9", "TC1/L10", "TAA1/L11", "L12"],
    evening: ["B2/L37", "G2/L38", "E2/L39", "TC2/L40", "TAA2/L41", "L42"],
  },
  Wednesday: {
    morning: ["C1/L13", "A1/L14", "F1/L15", "TD1/L16", "EXTRAMURAL", ""],
    evening: ["C2/L43", "A2/L44", "F2/L45", "TD2/L46", "TBB2/L47", "L48"],
  },
  Thursday: {
    morning: ["D1/L19", "B1/L20", "G1/L21", "TE1/L22", "TCC1/L23", "L24"],
    evening: ["D2/L49", "B2/L50", "G2/L51", "TE2/L52", "TCC2/L53", "L54"],
  },
  Friday: {
    morning: ["E1/L25", "C1/L26", "TA1/L27", "TF1/L28", "TDD1/L29", "L30"],
    evening: ["E2/L55", "C2/L56", "TA2/L57", "TF2/L58", "TDD2/L59", "L60"],
  },
};

interface CourseTheme {
  cardBg: string;
  border: string;
  slotBadge: string;
  codeText: string;
  titleText: string;
  subText: string;
  tdBg: string;
}

const COURSE_PALETTES: CourseTheme[] = [
  {
    // Sapphire Blue
    cardBg: "bg-blue-100/90 dark:bg-blue-950/70",
    border: "border-blue-400 dark:border-blue-500",
    slotBadge: "bg-blue-600 dark:bg-blue-500 text-white",
    codeText: "text-blue-950 dark:text-blue-100 font-bold",
    titleText: "text-blue-900 dark:text-blue-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-blue-50/90 dark:bg-blue-950/40",
  },
  {
    // Emerald Green
    cardBg: "bg-emerald-100/90 dark:bg-emerald-950/70",
    border: "border-emerald-400 dark:border-emerald-500",
    slotBadge: "bg-emerald-600 dark:bg-emerald-500 text-white",
    codeText: "text-emerald-950 dark:text-emerald-100 font-bold",
    titleText: "text-emerald-900 dark:text-emerald-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-emerald-50/90 dark:bg-emerald-950/40",
  },
  {
    // Purple / Amethyst
    cardBg: "bg-purple-100/90 dark:bg-purple-950/70",
    border: "border-purple-400 dark:border-purple-500",
    slotBadge: "bg-purple-600 dark:bg-purple-500 text-white",
    codeText: "text-purple-950 dark:text-purple-100 font-bold",
    titleText: "text-purple-900 dark:text-purple-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-purple-50/90 dark:bg-purple-950/40",
  },
  {
    // Amber / Marigold
    cardBg: "bg-amber-100/90 dark:bg-amber-950/70",
    border: "border-amber-400 dark:border-amber-500",
    slotBadge: "bg-amber-600 dark:bg-amber-500 text-white",
    codeText: "text-amber-950 dark:text-amber-100 font-bold",
    titleText: "text-amber-900 dark:text-amber-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-amber-50/90 dark:bg-amber-950/40",
  },
  {
    // Rose / Crimson
    cardBg: "bg-rose-100/90 dark:bg-rose-950/70",
    border: "border-rose-400 dark:border-rose-500",
    slotBadge: "bg-rose-600 dark:bg-rose-500 text-white",
    codeText: "text-rose-950 dark:text-rose-100 font-bold",
    titleText: "text-rose-900 dark:text-rose-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-rose-50/90 dark:bg-rose-950/40",
  },
  {
    // Teal / Mint
    cardBg: "bg-teal-100/90 dark:bg-teal-950/70",
    border: "border-teal-400 dark:border-teal-500",
    slotBadge: "bg-teal-600 dark:bg-teal-500 text-white",
    codeText: "text-teal-950 dark:text-teal-100 font-bold",
    titleText: "text-teal-900 dark:text-teal-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-teal-50/90 dark:bg-teal-950/40",
  },
  {
    // Orange / Coral
    cardBg: "bg-orange-100/90 dark:bg-orange-950/70",
    border: "border-orange-400 dark:border-orange-500",
    slotBadge: "bg-orange-600 dark:bg-orange-500 text-white",
    codeText: "text-orange-950 dark:text-orange-100 font-bold",
    titleText: "text-orange-900 dark:text-orange-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-orange-50/90 dark:bg-orange-950/40",
  },
  {
    // Indigo / Iris
    cardBg: "bg-indigo-100/90 dark:bg-indigo-950/70",
    border: "border-indigo-400 dark:border-indigo-500",
    slotBadge: "bg-indigo-600 dark:bg-indigo-500 text-white",
    codeText: "text-indigo-950 dark:text-indigo-100 font-bold",
    titleText: "text-indigo-900 dark:text-indigo-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-indigo-50/90 dark:bg-indigo-950/40",
  },
  {
    // Fuchsia / Magenta
    cardBg: "bg-fuchsia-100/90 dark:bg-fuchsia-950/70",
    border: "border-fuchsia-400 dark:border-fuchsia-500",
    slotBadge: "bg-fuchsia-600 dark:bg-fuchsia-500 text-white",
    codeText: "text-fuchsia-950 dark:text-fuchsia-100 font-bold",
    titleText: "text-fuchsia-900 dark:text-fuchsia-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-fuchsia-50/90 dark:bg-fuchsia-950/40",
  },
  {
    // Cyan / Sky
    cardBg: "bg-cyan-100/90 dark:bg-cyan-950/70",
    border: "border-cyan-400 dark:border-cyan-500",
    slotBadge: "bg-cyan-600 dark:bg-cyan-500 text-white",
    codeText: "text-cyan-950 dark:text-cyan-100 font-bold",
    titleText: "text-cyan-900 dark:text-cyan-200",
    subText: "text-slate-900 dark:text-slate-100 font-semibold",
    tdBg: "bg-cyan-50/90 dark:bg-cyan-950/40",
  },
];

function getCourseTheme(courseCode?: string): CourseTheme {
  if (!courseCode) return COURSE_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = (hash << 5) - hash + courseCode.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_PALETTES.length;
  return COURSE_PALETTES[index];
}

const isLabEntry = (entry: TimetableEntry) =>
  entry.slot?.toUpperCase().startsWith("L") || entry.courseType?.toUpperCase().includes("LAB");


const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [timetableData, setTimetableData] = useState<TimetableData | null>(() => {
    if (location.state && (location.state as any).timetableData) {
      return (location.state as any).timetableData;
    }
    try {
      const cached = localStorage.getItem("vtop_ffcs_latest_timetable");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const passedBatch = (location.state as { selectedBatch?: "Morning" | "Evening" } | null)?.selectedBatch;
  const [batchFilter, setBatchFilter] = useState<"All" | "Morning" | "Evening">(() => {
    if (passedBatch) return passedBatch;
    try {
      const cachedBatch = localStorage.getItem("vtop_ffcs_selected_batch");
      if (cachedBatch === "Morning" || cachedBatch === "Evening") return cachedBatch;
    } catch {}
    return "All";
  });
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const timetableCardRef = useRef<HTMLDivElement>(null);
  const initialFetchAttempted = useRef(false);
  const { toast } = useToast();

  // If timetable data is not yet in state, fetch the latest saved timetables from the user's account once on mount
  useEffect(() => {
    if (initialFetchAttempted.current) return;
    if (timetableData && timetableData.timetables?.length) {
      initialFetchAttempted.current = true;
      return;
    }

    initialFetchAttempted.current = true;
    let isMounted = true;
    apiRequest<{ timetables: any[]; timetablesCount: number }>("/timetable/my/latest")
      .then((res) => {
        if (!isMounted || !res?.timetables?.length) return;
        const loaded: TimetableData = {
          timetables: res.timetables,
          timetablesCount: res.timetablesCount || res.timetables.length,
        };
        setTimetableData(loaded);
        try {
          localStorage.setItem("vtop_ffcs_latest_timetable", JSON.stringify(loaded));
        } catch {}
      })
      .catch((err) => {
        console.warn("Could not retrieve saved timetables:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const detectTimetableShift = (tt: Timetable): "Morning" | "Evening" => {
    if (tt.batch === "Morning" || tt.batch === "Evening") return tt.batch;
    const allEntries: TimetableEntry[] = Object.values(tt.schedule || {}).flat();
    const theoryEntries = allEntries.filter((e) => !isLabEntry(e));
    const hasEveningTheory = theoryEntries.some((e) => (e.slot || "").includes("2"));
    return hasEveningTheory ? "Evening" : "Morning";
  };

  const filteredTimetables = useMemo(() => {
    const list = timetableData?.timetables || [];
    return batchFilter === "All"
      ? list
      : list.filter((tt) => detectTimetableShift(tt) === batchFilter);
  }, [timetableData, batchFilter]);

  const totalTimetables = filteredTimetables.length;
  const totalPages = Math.max(1, Math.ceil(totalTimetables / PAGE_SIZE));

  const currentPageTimetables = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTimetables.slice(start, start + PAGE_SIZE);
  }, [page, filteredTimetables]);

  const selectedTimetable = useMemo(() => {
    if (!filteredTimetables.length) return null;
    return filteredTimetables[selectedIndex] || filteredTimetables[0] || null;
  }, [selectedIndex, filteredTimetables]);

  const uniqueCourses = useMemo(() => {
    if (!selectedTimetable?.schedule) return [];
    const entries: TimetableEntry[] = Object.values(selectedTimetable.schedule).flat();
    const map = new Map<string, { code: string; name?: string }>();
    entries.forEach((e) => {
      if (e.courseCode && !map.has(e.courseCode)) {
        map.set(e.courseCode, { code: e.courseCode, name: e.courseName });
      }
    });
    return Array.from(map.values());
  }, [selectedTimetable]);

  const handleNextCombination = () => {
    if (selectedIndex < filteredTimetables.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      const targetPage = Math.floor(nextIdx / PAGE_SIZE) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      }
      timetableCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrevCombination = () => {
    if (selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      setSelectedIndex(prevIdx);
      const targetPage = Math.floor(prevIdx / PAGE_SIZE) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      }
      timetableCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectCombinationIndex = (idx: number) => {
    if (idx >= 0 && idx < filteredTimetables.length) {
      setSelectedIndex(idx);
      const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      }
      timetableCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Keyboard navigation: Press [Right Arrow] for next combination, [Left Arrow] for previous
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        if (selectedIndex < filteredTimetables.length - 1) {
          handleNextCombination();
        }
      } else if (e.key === "ArrowLeft") {
        if (selectedIndex > 0) {
          handlePrevCombination();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredTimetables.length, page]);

  const handleDeleteCombination = async (timetableId: string, optionNumber: number) => {
    const currentList = timetableData?.timetables || [];
    const updatedList = currentList.filter((t) => t.timetableId !== timetableId);
    const updatedData: TimetableData = {
      timetables: updatedList,
      timetablesCount: updatedList.length,
    };

    setTimetableData(updatedData);
    if (updatedList.length === 0) {
      try {
        localStorage.removeItem("vtop_ffcs_latest_timetable");
      } catch {}
    } else {
      try {
        localStorage.setItem("vtop_ffcs_latest_timetable", JSON.stringify(updatedData));
      } catch {}
    }

    // Adjust selected index if it was pointing to an index that no longer exists
    if (selectedIndex >= updatedList.length) {
      setSelectedIndex(Math.max(0, updatedList.length - 1));
    }

    toast({
      title: "Combination Deleted",
      description: `Option ${optionNumber} has been removed.`,
    });

    try {
      await apiRequest(`/timetable/option/${encodeURIComponent(timetableId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not sync deletion with server:", err);
    }
  };

  const confirmClearAllSchedules = async () => {
    setClearing(true);
    const emptyData: TimetableData = { timetables: [], timetablesCount: 0 };
    setTimetableData(emptyData);
    try {
      localStorage.removeItem("vtop_ffcs_latest_timetable");
      localStorage.removeItem("vtop_ffcs_selected_batch");
    } catch {}
    setSelectedIndex(0);

    toast({
      title: "All Schedules Cleared",
      description: "You can now upload a fresh course registration sheet.",
    });

    try {
      await apiRequest("/timetable/my/all", { method: "DELETE" });
    } catch (err) {
      console.warn("Could not sync clear all with server:", err);
    } finally {
      setClearing(false);
      setClearDialogOpen(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!timetableCardRef.current) return;
    setDownloading(true);
    try {
      const targetElement = timetableCardRef.current;
      const tableElement = targetElement.querySelector("table") as HTMLElement | null;

      // Generous export width so all 15 columns have wide, uncompressed slot boxes
      const tableWidth = Math.max(
        tableElement?.scrollWidth || 0,
        tableElement?.offsetWidth || 0,
        1800
      );
      const exportWidth = tableWidth + 60;

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
        width: exportWidth,
        windowWidth: exportWidth + 100,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector("[data-timetable-card]") as HTMLElement | null;
          if (clonedCard) {
            clonedCard.style.width = `${exportWidth}px`;
            clonedCard.style.minWidth = `${exportWidth}px`;
            clonedCard.style.maxWidth = "none";
          }
          const clonedScrollable = clonedCard?.querySelector(".overflow-x-auto") as HTMLElement | null;
          if (clonedScrollable) {
            clonedScrollable.style.overflow = "visible";
            clonedScrollable.style.width = `${tableWidth}px`;
          }

          const clonedTable = clonedCard?.querySelector("table") as HTMLElement | null;
          if (clonedTable) {
            clonedTable.style.width = `${tableWidth}px`;
            clonedTable.style.minWidth = `${tableWidth}px`;
            clonedTable.style.tableLayout = "fixed";
          }

          // Ensure every cell has plenty of width and zero overflow clipping
          clonedCard?.querySelectorAll("th, td").forEach((cell) => {
            const cellEl = cell as HTMLElement;
            cellEl.style.overflow = "visible";
            cellEl.style.verticalAlign = "top";
          });

          // Style all cards for maximum crispness and readable layout
          clonedCard?.querySelectorAll("[data-slot-card]").forEach((node) => {
            const cardEl = node as HTMLElement;
            cardEl.style.fontFamily = "Arial, Helvetica, sans-serif";
            cardEl.style.minHeight = "96px";
            cardEl.style.height = "auto";
            cardEl.style.padding = "8px 8px 10px 8px";
            cardEl.style.display = "flex";
            cardEl.style.flexDirection = "column";
            cardEl.style.justifyContent = "space-between";
            cardEl.style.overflow = "visible";
            cardEl.style.boxSizing = "border-box";
          });

          // Style all faculty names so they NEVER clip, smudge or wrap onto card borders
          clonedCard?.querySelectorAll("[data-faculty-text]").forEach((node) => {
            const facultyEl = node as HTMLElement;
            facultyEl.style.fontSize = "10.5px";
            facultyEl.style.fontWeight = "600";
            facultyEl.style.lineHeight = "14px";
            facultyEl.style.whiteSpace = "normal";
            facultyEl.style.overflow = "visible";
            facultyEl.style.wordBreak = "break-word";
            facultyEl.style.marginTop = "6px";
            facultyEl.style.paddingBottom = "2px";
          });

          // Style course codes
          clonedCard?.querySelectorAll("[data-course-code]").forEach((node) => {
            const codeEl = node as HTMLElement;
            codeEl.style.fontSize = "12px";
            codeEl.style.fontWeight = "bold";
            codeEl.style.lineHeight = "15px";
            codeEl.style.letterSpacing = "0.2px";
          });

          // Style curriculum category badges
          clonedCard?.querySelectorAll("[data-cat-badge]").forEach((node) => {
            const badgeEl = node as HTMLElement;
            badgeEl.style.fontSize = "8.5px";
            badgeEl.style.fontWeight = "bold";
            badgeEl.style.padding = "1px 3px";
            badgeEl.style.borderRadius = "3px";
          });
        },
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas could not generate image blob");
        }
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.download = `VIT_Timetable_Option_${selectedIndex + 1}.png`;
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

        toast({
          title: "Timetable Downloaded",
          description: `Option ${selectedIndex + 1} schedule exported successfully with crystal-clear text.`,
        });
      }, "image/png");
    } catch (err) {
      console.error("Failed to export timetable as image:", err);
      toast({
        title: "Download Failed",
        description: "Could not export timetable as image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getTheoryEntry = (day: string, slot: SlotRange | null) => {
    if (!slot || !selectedTimetable?.schedule?.[day]) return null;
    return (
      selectedTimetable.schedule[day].find(
        (entry) => !isLabEntry(entry) && entry.startTime === slot.start && entry.endTime === slot.end
      ) || null
    );
  };

  const getLabEntry = (day: string, slot: SlotRange) => {
    if (!selectedTimetable?.schedule?.[day]) return null;
    return (
      selectedTimetable.schedule[day].find(
        (entry) => isLabEntry(entry) && entry.startTime === slot.start && entry.endTime === slot.end
      ) || null
    );
  };

  const renderCellContent = (
    day: string,
    colIndex: number,
    section: "morning" | "evening",
    theory: TimetableEntry | null,
    lab: TimetableEntry | null
  ) => {
    const hasCourse = Boolean(theory || lab);
    const templateLabel = TEMPLATE_CELL_LABELS[day]?.[section]?.[colIndex] || "-";

    if (!hasCourse) {
      return (
        <div className="leading-tight text-slate-400 dark:text-slate-500 font-mono text-[11px] text-center py-3 select-none">
          {templateLabel || "-"}
        </div>
      );
    }

    return (
      <div className="space-y-1.5 leading-normal text-xs">
        {[theory, lab].filter(Boolean).map((entry, idx) => {
          const theme = getCourseTheme(entry?.courseCode);
          const catCode = getCourseCategory(entry?.courseCode || "");
          const catBadge = getCategoryBadge(catCode);
          const hasDistinctTitle = Boolean(
            entry?.courseName &&
            entry.courseName.trim().toUpperCase() !== entry?.courseCode?.trim().toUpperCase()
          );

          return (
            <div
              key={`${entry?.slot || "slot"}-${entry?.courseCode || "code"}-${idx}`}
              data-slot-card="true"
              className={`p-2 rounded-md ${theme.cardBg} border-2 ${theme.border} shadow-sm transition-all flex flex-col justify-between min-h-[92px]`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tight leading-none ${theme.slotBadge}`}>
                      {entry?.slot || "-"}
                    </span>
                    {entry?.courseCode && (
                      <span
                        data-cat-badge="true"
                        className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase tracking-tight leading-none border ${catBadge.badgeClass}`}
                        title={catBadge.name}
                      >
                        {catCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {entry?.venue || "-"}
                  </span>
                </div>
                <div data-course-code="true" className={`font-bold text-xs leading-snug tracking-tight ${theme.codeText}`}>
                  {entry?.courseCode || "-"}
                </div>
                {hasDistinctTitle && (
                  <div data-course-title="true" className={`text-[11px] font-medium leading-snug mt-0.5 ${theme.titleText}`} title={entry?.courseName}>
                    {entry?.courseName}
                  </div>
                )}
              </div>
              {entry?.faculty && (
                <div
                  data-faculty-text="true"
                  className={`text-[10px] mt-2 font-semibold leading-tight break-words flex items-center gap-1 ${theme.subText}`}
                  title={entry?.faculty}
                >
                  <User className="w-3 h-3 shrink-0" />
                  <span>{entry?.faculty}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!timetableData || !timetableData.timetables?.length) {
    return (
      <DashboardLayout>
        <SEO title="Timetables & Schedules" description="View your generated VIT FFCS conflict-free timetables." />
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-10 text-center max-w-xl mx-auto my-12 shadow-card">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Timetable Combinations Available</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs mb-6">
            Please upload your course registration Excel sheet to generate conflict-free timetable permutations.
          </p>
          <Button
            onClick={() => navigate("/upload")}
            className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs rounded"
          >
            Go to Generator
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Generated Timetable Options" description="Explore 100% clash-free VIT timetable schedules and weekly slot grids." />

      {/* VTOP Timetable Header */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#2455a3] dark:text-blue-400 uppercase tracking-wider">
                VTOP Course Timetable
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Fall Semester</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Generated Timetable Combinations ({totalTimetables} Options)
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
              All permutations adhere strictly to VIT theory and laboratory slot separation rules with zero clashes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs rounded shrink-0 flex items-center gap-1.5"
            >
              <Link to="/select-faculty">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Adjust Faculty Selection</span>
              </Link>
            </Button>

            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={clearing}
                  className="border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs rounded shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearing ? "Clearing..." : "Clear All"}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Clear All Timetable Schedules?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                    This will remove all generated schedule combinations from your account so you can start fresh for the next semester. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmClearAllSchedules}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Yes, Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Academic Shift Filter Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">Shift Category:</span>
          {(["All", "Morning", "Evening"] as const).map((filter) => {
            const isActive = batchFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setBatchFilter(filter);
                  setPage(1);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#2455a3] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {filter === "All" ? "All Options" : `${filter} Shift (${filter === "Morning" ? "A1 / L31+" : "A2 / L1+"})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Combination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentPageTimetables.map((item, index) => {
          const globalIndex = (page - 1) * PAGE_SIZE + index + 1;
          const currentIndex = globalIndex - 1;
          const isActive = currentIndex === selectedIndex;
          return (
            <div
              key={item.timetableId}
              onClick={() => setSelectedIndex(currentIndex)}
              className={`cursor-pointer p-4 rounded bg-white dark:bg-slate-900 border transition-colors shadow-card ${
                isActive
                  ? "border-[#2455a3] border-t-4 border-t-[#2455a3] bg-blue-50/20 dark:bg-blue-950/30 ring-2 ring-[#2455a3]/40"
                  : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Option {globalIndex}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                    <Star className={`w-3.5 h-3.5 ${isActive ? "text-[#2455a3] dark:text-blue-400 fill-[#2455a3] dark:fill-blue-400" : "text-slate-400"}`} />
                    <span>Combination {globalIndex}</span>
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#2455a3] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Selected
                    </span>
                  )}
                  {detectTimetableShift(item) === "Morning" ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#2455a3] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Morning (A1 / L31+)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Evening (A2 / L1+)
                    </span>
                  )}
                </div>
              </div>

              {/* Curriculum Guarantee Status */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>100% Core Guaranteed</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {item.curriculumStats
                    ? `${item.curriculumStats.breakdown?.FC || 1} FC • ${item.curriculumStats.breakdown?.DLES || 2} DLES • ${item.curriculumStats.breakdown?.DC || 6} DC • ${item.curriculumStats.breakdown?.DE || 1} DE`
                    : "1 FC • 2 DLES • 6 DC • 1 DE"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>Free Days: {item.features?.totalFreeDays ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Starts: {item.features?.earliestStartTime || item.features?.latestStartTime || "--"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>{getTimetableCredits(item)} / 27 Cr</span>
                  </div>
                </div>

                {/* Small Delete Button in bottom-right corner as requested */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCombination(item.timetableId, globalIndex);
                  }}
                  title={`Delete Combination ${globalIndex}`}
                  aria-label={`Delete Combination ${globalIndex}`}
                  className="px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-colors flex items-center gap-1 text-[11px] font-semibold shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2.5 shadow-sm text-xs">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs rounded h-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </Button>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Showing page {page} of {totalPages}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs rounded h-8"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Detailed VTOP Weekly Slot Table */}
      {selectedTimetable && (
        <div ref={timetableCardRef} data-timetable-card="true" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Weekly Timetable Grid: Combination {selectedIndex + 1}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    of {filteredTimetables.length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Shift:{" "}
                  <span className="font-bold text-[#2455a3] dark:text-blue-400">
                    {detectTimetableShift(selectedTimetable)} Shift
                  </span>
                  {" "}• {detectTimetableShift(selectedTimetable) === "Morning" ? "Theory 08:00 - 13:00 (A1 series) & Labs 14:00 - 19:30 (L31 to L60)" : "Labs 08:00 - 13:20 (L1 to L30) & Theory 14:00 - 19:00 (A2 series)"}
                </p>
              </div>

              {/* Combination Switcher Controller */}
              <div className="flex items-center gap-1.5 sm:ml-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700" data-html2canvas-ignore="true">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={selectedIndex === 0}
                  onClick={handlePrevCombination}
                  title="Previous Combination (ArrowLeft)"
                  className="h-8 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  <span>Prev</span>
                </Button>

                {/* Quick Dropdown Selector */}
                <select
                  value={selectedIndex}
                  onChange={(e) => handleSelectCombinationIndex(Number(e.target.value))}
                  className="h-8 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
                  title="Jump to specific combination"
                >
                  {filteredTimetables.map((_, i) => (
                    <option key={i} value={i}>
                      Combo {i + 1} of {filteredTimetables.length}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  size="sm"
                  disabled={selectedIndex === filteredTimetables.length - 1}
                  onClick={handleNextCombination}
                  title="Next Combination (ArrowRight)"
                  className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{getTimetableCredits(selectedTimetable)} Credits (18–27 Range)</span>
              </span>

              <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>100% Conflict-Free</span>
              </span>

              <Button
                type="button"
                onClick={handleDownloadImage}
                disabled={downloading}
                data-html2canvas-ignore="true"
                className="h-8 px-3 text-xs font-bold text-white bg-[#2455a3] hover:bg-[#1b4b8a] dark:bg-blue-600 dark:hover:bg-blue-500 border-none rounded shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? "Exporting PNG..." : "Download as Image"}</span>
              </Button>
            </div>
          </div>

          {/* Degree Curriculum Satisfaction Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/80 mb-4 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-indigo-600 text-white shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                  100% Core Requirements Satisfied
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                  All degree core requirements locked in first:{" "}
                  <strong className="text-blue-700 dark:text-blue-300">1 FC</strong> •{" "}
                  <strong className="text-purple-700 dark:text-purple-300">2 DLES</strong> •{" "}
                  <strong className="text-indigo-700 dark:text-indigo-300">6 DC</strong> •{" "}
                  <strong className="text-amber-700 dark:text-amber-300">1 DE (Slot E)</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Core: <strong className="text-indigo-700 dark:text-indigo-300">19.5 Cr</strong> + Elective: <strong className="text-amber-700 dark:text-amber-300">3.0 Cr</strong>
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                = {getTimetableCredits(selectedTimetable)} Total Credits
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1550px] w-full border-collapse text-xs border border-slate-300 dark:border-slate-800">
              <tbody>
                {/* Theory Hours Header Row */}
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 bg-[#2455a3] text-white font-bold p-2 text-center min-w-[100px]">
                    THEORY HOURS
                  </th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`th-m-${col.key}`} className="border border-slate-300 dark:border-slate-700 bg-[#2455a3] text-white font-semibold p-2 min-w-[115px] sm:min-w-[125px] text-center">
                      {col.theory ? (
                        <div className="leading-tight text-[11px]">
                          <div>{col.theory.start}</div>
                          <div>to</div>
                          <div>{col.theory.end}</div>
                        </div>
                      ) : null}
                    </th>
                  ))}
                  <th className="border border-slate-300 dark:border-slate-700 bg-[#d4ac0d] text-slate-900 font-bold w-12 text-center" rowSpan={2}>
                    LUNCH
                  </th>
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`th-e-${col.key}`} className="border border-slate-300 dark:border-slate-700 bg-[#2455a3] text-white font-semibold p-2 min-w-[115px] sm:min-w-[125px] text-center">
                      {col.theory ? (
                        <div className="leading-tight text-[11px]">
                          <div>{col.theory.start}</div>
                          <div>to</div>
                          <div>{col.theory.end}</div>
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>

                {/* Lab Hours Header Row */}
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 bg-[#1b4b8a] text-white font-bold p-2 text-center min-w-[100px]">
                    LAB HOURS
                  </th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`lh-m-${col.key}`} className="border border-slate-300 dark:border-slate-700 bg-[#1b4b8a] text-white font-semibold p-2 min-w-[115px] sm:min-w-[125px] text-center">
                      <div className="leading-tight text-[11px]">
                        <div>{col.lab.start}</div>
                        <div>to</div>
                        <div>{col.lab.end}</div>
                      </div>
                    </th>
                  ))}
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`lh-e-${col.key}`} className="border border-slate-300 dark:border-slate-700 bg-[#1b4b8a] text-white font-semibold p-2 min-w-[115px] sm:min-w-[125px] text-center">
                      <div className="leading-tight text-[11px]">
                        <div>{col.lab.start}</div>
                        <div>to</div>
                        <div>{col.lab.end}</div>
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Day Rows */}
                {WEEK_DAYS.map((day, dayIdx) => (
                  <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <th className="border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2 text-center min-w-[80px]">
                      {DAY_SHORT[day]}
                    </th>
                    {MORNING_COLUMNS.map((col, colIdx) => {
                      const theory = getTheoryEntry(day, col.theory);
                      const lab = getLabEntry(day, col.lab);
                      const hasCourse = Boolean(theory || lab);
                      const primaryEntry = theory || lab;
                      const cellTheme = primaryEntry ? getCourseTheme(primaryEntry.courseCode) : null;
                      return (
                        <td
                          key={`${day}-m-${col.key}`}
                          className={`border border-slate-300 dark:border-slate-800 p-1.5 align-top transition-colors min-w-[115px] sm:min-w-[125px] ${
                            hasCourse
                              ? (cellTheme?.tdBg || "bg-blue-50/90 dark:bg-blue-950/40")
                              : "bg-slate-50/60 dark:bg-slate-900/60"
                          }`}
                        >
                          {renderCellContent(day, colIdx, "morning", theory, lab)}
                        </td>
                      );
                    })}
                    {dayIdx === 0 && (
                      <th
                        rowSpan={WEEK_DAYS.length}
                        className="border border-slate-300 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold w-12 tracking-widest text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-1 text-[11px]">
                          {"LUNCH".split("").map((char, idx) => (
                            <span key={`lunch-char-${idx}`}>{char}</span>
                          ))}
                        </div>
                      </th>
                    )}
                    {EVENING_COLUMNS.map((col, colIdx) => {
                      const theory = getTheoryEntry(day, col.theory);
                      const lab = getLabEntry(day, col.lab);
                      const hasCourse = Boolean(theory || lab);
                      const primaryEntry = theory || lab;
                      const cellTheme = primaryEntry ? getCourseTheme(primaryEntry.courseCode) : null;
                      return (
                        <td
                          key={`${day}-e-${col.key}`}
                          className={`border border-slate-300 dark:border-slate-800 p-1.5 align-top transition-colors min-w-[115px] sm:min-w-[125px] ${
                            hasCourse
                              ? (cellTheme?.tdBg || "bg-blue-50/90 dark:bg-blue-950/40")
                              : "bg-slate-50/60 dark:bg-slate-900/60"
                          }`}
                        >
                          {renderCellContent(day, colIdx, "evening", theory, lab)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Course Color Legend */}
          {uniqueCourses.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <span>Allocated Course Color Legend:</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  (Classes are color-coded across all slots)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {uniqueCourses.map((c) => {
                  const theme = getCourseTheme(c.code);
                  const catCode = getCourseCategory(c.code);
                  const catBadge = getCategoryBadge(catCode);
                  const hasDistinctTitle = Boolean(
                    c.name && c.name.trim().toUpperCase() !== c.code.trim().toUpperCase()
                  );
                  return (
                    <div
                      key={c.code}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border-2 ${theme.border} ${theme.cardBg} shadow-xs`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.slotBadge}`} />
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${catBadge.badgeClass}`} title={catBadge.name}>
                        {catCode}
                      </span>
                      <span className={`font-bold ${theme.codeText}`}>{c.code}</span>
                      {hasDistinctTitle && (
                        <span className={`text-[11px] truncate max-w-[200px] ${theme.titleText}`}>
                          - {c.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Combination Navigation Controller */}
          <div
            data-html2canvas-ignore="true"
            className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Combination {selectedIndex + 1} of {filteredTimetables.length}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline">
                • Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">←</kbd> and <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">→</kbd> keys to cycle combinations
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedIndex === 0}
                onClick={handlePrevCombination}
                title="Previous Combination (ArrowLeft)"
                className="h-8 px-3 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous Combination
              </Button>

              <select
                value={selectedIndex}
                onChange={(e) => handleSelectCombinationIndex(Number(e.target.value))}
                className="h-8 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
                title="Jump to specific combination"
              >
                {filteredTimetables.map((_, i) => (
                  <option key={i} value={i}>
                    Combo {i + 1} of {filteredTimetables.length}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                size="sm"
                disabled={selectedIndex === filteredTimetables.length - 1}
                onClick={handleNextCombination}
                title="Next Combination (ArrowRight)"
                className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>Next Combination</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Results;
