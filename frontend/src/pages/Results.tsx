import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Star, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

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
};

type Timetable = {
  timetableId: string;
  batch?: "Morning" | "Evening" | "Mixed";
  courses?: any[];
  schedule: Record<string, TimetableEntry[]>;
  features?: TimetableFeatures & { batchShift?: string };
  rankingScore?: number;
};

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

const isLabEntry = (entry: TimetableEntry) =>
  entry.slot?.toUpperCase().startsWith("L") || entry.courseType?.toUpperCase().includes("LAB");

type RankingCriteria = "balanced" | "earliest_finish" | "no_morning" | "max_free_days";

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function computeTimetableHeuristic(
  schedule: Record<string, TimetableEntry[]>,
  features: TimetableFeatures | undefined,
  criteria: RankingCriteria
): { score: number; summary: string } {
  const activeDays = Object.keys(schedule || {}).filter((d) => schedule[d] && schedule[d].length > 0);
  const freeDays = features?.totalFreeDays ?? Math.max(0, 5 - activeDays.length);

  switch (criteria) {
    case "earliest_finish": {
      let totalEndMinutes = 0;
      activeDays.forEach((d) => {
        const classes = schedule[d];
        const lastClass = classes[classes.length - 1];
        totalEndMinutes += parseTimeToMinutes(lastClass?.endTime);
      });
      const avgEnd = activeDays.length > 0 ? totalEndMinutes / activeDays.length : 1140;
      const score = Math.max(20, Math.min(100, Math.round(100 - ((avgEnd - 780) / 390) * 75) + freeDays * 5));
      const avgH = Math.floor(avgEnd / 60);
      const avgM = Math.round(avgEnd % 60);
      return {
        score,
        summary: `Concludes by ${String(avgH).padStart(2, "0")}:${String(avgM).padStart(2, "0")} daily (${freeDays} free days)`,
      };
    }
    case "no_morning": {
      let earlyDays = 0;
      let lateDays = 0;
      activeDays.forEach((d) => {
        const classes = schedule[d];
        const first = classes[0];
        const startMin = parseTimeToMinutes(first?.startTime);
        if (startMin <= 480) earlyDays++;
        else if (startMin >= 590) lateDays++;
      });
      const score = Math.max(20, Math.min(100, 100 - earlyDays * 22 + lateDays * 6));
      return {
        score,
        summary: earlyDays === 0
          ? `Zero 08:00 AM periods (${lateDays} days starting 09:50 AM or later)`
          : `${earlyDays} days starting at 08:00 AM; ${lateDays} late starts`,
      };
    }
    case "max_free_days": {
      const score = Math.min(100, 48 + freeDays * 26);
      return {
        score,
        summary: `${freeDays} full free days; periods grouped into ${activeDays.length} weekdays`,
      };
    }
    case "balanced":
    default: {
      let deadGaps = 0;
      activeDays.forEach((d) => {
        const classes = schedule[d];
        for (let i = 0; i < classes.length - 1; i++) {
          const gap = parseTimeToMinutes(classes[i + 1]?.startTime) - parseTimeToMinutes(classes[i]?.endTime);
          if (gap > 75) deadGaps++;
        }
      });
      const score = Math.max(30, Math.min(100, 95 - deadGaps * 12));
      return {
        score,
        summary: deadGaps === 0
          ? `Optimal gap transitions with minimal dead hours (${freeDays} free days)`
          : `Balanced study gaps with ${deadGaps} break windows`,
      };
    }
  }
}

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
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>(
    user?.preferences?.rankingCriteria || "balanced"
  );
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // If timetable data is not yet in state, fetch the latest saved timetables from the user's account
  useEffect(() => {
    if (timetableData && timetableData.timetables?.length) return;

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
  }, [timetableData]);

  const detectTimetableShift = (tt: Timetable): "Morning" | "Evening" => {
    if (tt.batch === "Morning" || tt.batch === "Evening") return tt.batch;
    const allEntries: TimetableEntry[] = Object.values(tt.schedule || {}).flat();
    const theoryEntries = allEntries.filter((e) => !isLabEntry(e));
    const hasEveningTheory = theoryEntries.some((e) => (e.slot || "").includes("2"));
    return hasEveningTheory ? "Evening" : "Morning";
  };

  const filteredTimetables = useMemo(() => {
    const list = timetableData?.timetables || [];
    const shiftFiltered = batchFilter === "All"
      ? list
      : list.filter((tt) => detectTimetableShift(tt) === batchFilter);

    // Score dynamically by chosen criteria
    const scoredList = shiftFiltered.map((tt) => {
      const heuristic = computeTimetableHeuristic(tt.schedule, tt.features, rankingCriteria);
      return {
        ...tt,
        currentScore: heuristic.score,
        currentSummary: heuristic.summary,
      };
    });

    // Legitimate sorting: highest heuristic score first
    scoredList.sort((a, b) => b.currentScore - a.currentScore);
    return scoredList;
  }, [timetableData, batchFilter, rankingCriteria]);

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
        <div className="leading-tight text-slate-400 font-mono text-[11px] text-center">
          {templateLabel || "-"}
        </div>
      );
    }

    return (
      <div className="space-y-1 leading-tight text-xs">
        {[theory, lab].filter(Boolean).map((entry, idx) => (
          <div
            key={`${entry?.slot || "slot"}-${entry?.courseCode || "code"}-${idx}`}
            className="p-1.5 rounded bg-white border border-blue-200 text-slate-800"
          >
            <div className="font-bold text-[#2455a3]">{entry?.slot || "-"}</div>
            <div className="font-semibold text-slate-900">{entry?.courseCode || "-"}</div>
            <div className="text-[11px] text-slate-600 truncate">{entry?.courseName || "-"}</div>
            <div className="text-[10px] text-slate-500 truncate">{entry?.faculty || "-"}</div>
            <div className="text-[10px] text-slate-500 font-mono">{entry?.venue || "-"}</div>
          </div>
        ))}
      </div>
    );
  };

  if (!timetableData || !timetableData.timetables?.length) {
    return (
      <DashboardLayout>
        <SEO title="Timetables & Schedules" description="View your generated VIT FFCS conflict-free timetables." />
        <div className="bg-white border border-slate-300 rounded p-10 text-center max-w-xl mx-auto my-12 shadow-card">
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Timetable Combinations Available</h2>
          <p className="text-slate-600 text-xs mb-6">
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
      <div className="mb-6 bg-white border border-slate-300 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#2455a3] uppercase tracking-wider">
                VTOP Course Timetable
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Fall Semester</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Generated Timetable Combinations ({totalTimetables} Options)
            </h1>
            <p className="text-slate-600 text-xs mt-1">
              All permutations adhere strictly to VIT theory and laboratory slot separation rules with zero clashes.
            </p>
          </div>
          <Button asChild variant="outline" className="border-[#2455a3] text-[#2455a3] hover:bg-blue-50 text-xs rounded shrink-0">
            <Link to="/thank-you">View Confirmation Summary →</Link>
          </Button>
        </div>
      </div>

      {/* Academic Shift Filter Tabs & Heuristic Criteria Selector */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-300 rounded p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 mr-1">Shift Category:</span>
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
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter === "All" ? "All Options" : `${filter} Shift (${filter === "Morning" ? "A1 / L31+" : "A2 / L1+"})`}
              </button>
            );
          })}
        </div>

        {/* Live Optimization Heuristic Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="heuristic-criteria" className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Optimization Heuristic:
          </label>
          <select
            id="heuristic-criteria"
            value={rankingCriteria}
            onChange={(e) => {
              setRankingCriteria(e.target.value as RankingCriteria);
              setPage(1);
              setSelectedIndex(0);
            }}
            className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
          >
            <option value="balanced">Balanced (Optimal gaps between classes)</option>
            <option value="earliest_finish">Earliest Finish (Compact daily schedules)</option>
            <option value="no_morning">Late Start (Avoid 8:00 AM periods)</option>
            <option value="max_free_days">Maximum Free Days (Cluster periods into fewer days)</option>
          </select>
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
              className={`cursor-pointer p-4 rounded bg-white border transition-colors shadow-card ${
                isActive
                  ? "border-[#2455a3] border-t-4 border-t-[#2455a3] bg-blue-50/20"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Option {globalIndex}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Score: {item.currentScore}/100
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Star className={`w-3.5 h-3.5 ${isActive ? "text-[#2455a3] fill-[#2455a3]" : "text-slate-400"}`} />
                    <span>Combination {globalIndex}</span>
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2455a3] border border-blue-200">
                      Selected
                    </span>
                  )}
                  {detectTimetableShift(item) === "Morning" ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2455a3] border border-blue-200">
                      Morning (A1 / L31+)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Evening (A2 / L1+)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span>Free Days: {item.features?.totalFreeDays ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Starts: {item.features?.earliestStartTime || item.features?.latestStartTime || "--"}</span>
                </div>
              </div>

              {/* Real Heuristic Breakdown */}
              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-700">Criteria: </span>
                <span>{item.currentSummary}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mb-6 bg-white border border-slate-300 rounded p-2.5 shadow-sm text-xs">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="border-slate-300 text-xs rounded h-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </Button>
        <p className="text-slate-600 font-medium">
          Showing page {page} of {totalPages}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="border-slate-300 text-xs rounded h-8"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Detailed VTOP Weekly Slot Table */}
      {selectedTimetable && (
        <div className="bg-white border border-slate-300 rounded shadow-card p-5 mb-8">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weekly Timetable Grid: Combination {selectedIndex + 1}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Shift:{" "}
                <span className="font-bold text-[#2455a3]">
                  {detectTimetableShift(selectedTimetable)} Shift
                </span>
                {" "}• {detectTimetableShift(selectedTimetable) === "Morning" ? "Theory 08:00 - 13:00 (A1 series) & Labs 14:00 - 19:30 (L31 to L60)" : "Labs 08:00 - 13:20 (L1 to L30) & Theory 14:00 - 19:00 (A2 series)"}
              </p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>100% Conflict-Free</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full border-collapse text-xs border border-slate-300">
              <tbody>
                {/* Theory Hours Header Row */}
                <tr>
                  <th className="border border-slate-300 bg-[#2455a3] text-white font-bold p-2 text-center min-w-[90px]">
                    THEORY HOURS
                  </th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`th-m-${col.key}`} className="border border-slate-300 bg-[#2455a3] text-white font-semibold p-2 min-w-[95px] text-center">
                      {col.theory ? (
                        <div className="leading-tight text-[11px]">
                          <div>{col.theory.start}</div>
                          <div>to</div>
                          <div>{col.theory.end}</div>
                        </div>
                      ) : null}
                    </th>
                  ))}
                  <th className="border border-slate-300 bg-[#d4ac0d] text-slate-900 font-bold w-12 text-center" rowSpan={2}>
                    LUNCH
                  </th>
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`th-e-${col.key}`} className="border border-slate-300 bg-[#2455a3] text-white font-semibold p-2 min-w-[95px] text-center">
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
                  <th className="border border-slate-300 bg-[#1b4b8a] text-white font-bold p-2 text-center">
                    LAB HOURS
                  </th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`lh-m-${col.key}`} className="border border-slate-300 bg-[#1b4b8a] text-white font-semibold p-2 min-w-[95px] text-center">
                      <div className="leading-tight text-[11px]">
                        <div>{col.lab.start}</div>
                        <div>to</div>
                        <div>{col.lab.end}</div>
                      </div>
                    </th>
                  ))}
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`lh-e-${col.key}`} className="border border-slate-300 bg-[#1b4b8a] text-white font-semibold p-2 min-w-[95px] text-center">
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
                  <tr key={day} className="hover:bg-slate-50/50">
                    <th className="border border-slate-300 bg-slate-100 text-slate-800 font-bold p-2 text-center">
                      {DAY_SHORT[day]}
                    </th>
                    {MORNING_COLUMNS.map((col, colIdx) => {
                      const theory = getTheoryEntry(day, col.theory);
                      const lab = getLabEntry(day, col.lab);
                      const hasCourse = Boolean(theory || lab);
                      return (
                        <td
                          key={`${day}-m-${col.key}`}
                          className={`border border-slate-300 p-1.5 align-top ${hasCourse ? "bg-blue-50/70" : "bg-white"}`}
                        >
                          {renderCellContent(day, colIdx, "morning", theory, lab)}
                        </td>
                      );
                    })}
                    {dayIdx === 0 && (
                      <th
                        rowSpan={WEEK_DAYS.length}
                        className="border border-slate-300 bg-amber-50 text-amber-800 font-bold w-12 tracking-widest text-center"
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
                      return (
                        <td
                          key={`${day}-e-${col.key}`}
                          className={`border border-slate-300 p-1.5 align-top ${hasCourse ? "bg-blue-50/70" : "bg-white"}`}
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
        </div>
      )}
    </DashboardLayout>
  );
};

export default Results;
