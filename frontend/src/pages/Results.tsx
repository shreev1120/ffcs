import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

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
  schedule: Record<string, TimetableEntry[]>;
  features?: TimetableFeatures;
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

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const timetableData = (location.state as { timetableData?: TimetableData } | null)?.timetableData;

  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const totalTimetables = timetableData?.timetables?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalTimetables / PAGE_SIZE));

  const currentPageTimetables = useMemo(() => {
    if (!timetableData?.timetables) return [];
    const start = (page - 1) * PAGE_SIZE;
    return timetableData.timetables.slice(start, start + PAGE_SIZE);
  }, [page, timetableData]);

  const selectedTimetable = useMemo(() => {
    if (!timetableData?.timetables) return null;
    return timetableData.timetables[selectedIndex] || timetableData.timetables[0] || null;
  }, [selectedIndex, timetableData]);

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
        <div className="leading-tight text-text-muted">
          {templateLabel || "-"}
        </div>
      );
    }

    return (
      <div className="space-y-1 leading-tight">
        {[theory, lab].filter(Boolean).map((entry, idx) => (
          <div key={`${entry?.slot || "slot"}-${entry?.courseCode || "code"}-${idx}`}>
            <div className="font-semibold text-primary">{entry?.slot || "-"}</div>
            <div className="font-medium">{entry?.courseCode || "-"}</div>
            <div className="text-[11px] text-text-secondary">{entry?.courseName || "-"}</div>
            <div className="text-[11px] text-text-secondary">{entry?.faculty || "-"}</div>
            <div className="text-[11px] text-text-secondary">{entry?.venue || "-"}</div>
          </div>
        ))}
      </div>
    );
  };

  if (!timetableData || !timetableData.timetables?.length) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-2xl font-bold mb-3">No timetable combinations available</h2>
          <p className="text-text-secondary mb-6">
            Generate timetables after selecting Morning or Evening preference.
          </p>
          <Button onClick={() => navigate("/upload")}>Go to Generator</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black text-gradient">All Timetable Combinations</h1>
        <p className="text-text-secondary mt-2">
          Showing {totalTimetables} generated combinations. Select a card to inspect full week details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {currentPageTimetables.map((item, index) => {
          const globalIndex = (page - 1) * PAGE_SIZE + index + 1;
          const currentIndex = globalIndex - 1;
          const isActive = currentIndex === selectedIndex;
          return (
            <GlassCard
              key={item.timetableId}
              onClick={() => setSelectedIndex(currentIndex)}
              className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary bg-primary/5" : "hover:bg-primary/5"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Combination {globalIndex}</p>
                  <h3 className="font-display text-lg font-bold mt-1 flex items-center gap-1.5">
                    <Star className={`w-4 h-4 ${isActive ? "text-primary" : "text-text-muted"}`} />
                    {`Combination ${globalIndex}`}
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="flex items-center gap-2 text-text-secondary">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Free Days: {item.features?.totalFreeDays ?? 0}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-3.5 h-3.5" />
                  Start: {item.features?.latestStartTime || "--"}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <p className="text-sm text-text-secondary">
          Page {page} of {totalPages}
        </p>
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {selectedTimetable && (
        <GlassCard hover={false}>
          <h2 className="font-display text-xl font-bold mb-5">Detailed Slot Table: Combination {selectedIndex + 1}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <th className="border border-border bg-muted/70 text-foreground font-bold p-2 min-w-[90px]">THEORY HOURS</th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`th-m-${col.key}`} className="border border-border bg-primary/15 text-foreground font-semibold p-2 min-w-[95px]">
                      {col.theory ? (
                        <div className="leading-tight">
                          <div>{col.theory.start}</div>
                          <div>to</div>
                          <div>{col.theory.end}</div>
                        </div>
                      ) : null}
                    </th>
                  ))}
                  <th className="border border-border bg-muted/60 w-10" rowSpan={2} />
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`th-e-${col.key}`} className="border border-border bg-primary/15 text-foreground font-semibold p-2 min-w-[95px]">
                      {col.theory ? (
                        <div className="leading-tight">
                          <div>{col.theory.start}</div>
                          <div>to</div>
                          <div>{col.theory.end}</div>
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-border bg-muted/70 text-foreground font-bold p-2">LAB HOURS</th>
                  {MORNING_COLUMNS.map((col) => (
                    <th key={`lh-m-${col.key}`} className="border border-border bg-accent/20 text-foreground font-semibold p-2 min-w-[95px]">
                      <div className="leading-tight">
                        <div>{col.lab.start}</div>
                        <div>to</div>
                        <div>{col.lab.end}</div>
                      </div>
                    </th>
                  ))}
                  {EVENING_COLUMNS.map((col) => (
                    <th key={`lh-e-${col.key}`} className="border border-border bg-accent/20 text-foreground font-semibold p-2 min-w-[95px]">
                      <div className="leading-tight">
                        <div>{col.lab.start}</div>
                        <div>to</div>
                        <div>{col.lab.end}</div>
                      </div>
                    </th>
                  ))}
                </tr>

                {WEEK_DAYS.map((day, dayIdx) => (
                  <tr key={day}>
                    <th className="border border-border bg-muted/70 text-foreground font-bold p-2">{DAY_SHORT[day]}</th>
                    {MORNING_COLUMNS.map((col, colIdx) => {
                      const theory = getTheoryEntry(day, col.theory);
                      const lab = getLabEntry(day, col.lab);
                      const hasCourse = Boolean(theory || lab);
                      return (
                        <td
                          key={`${day}-m-${col.key}`}
                          className={`border border-border text-foreground p-2 align-top ${hasCourse ? "bg-primary/10" : "bg-background/40"}`}
                        >
                          {renderCellContent(day, colIdx, "morning", theory, lab)}
                        </td>
                      );
                    })}
                    {dayIdx === 0 && (
                      <th
                        rowSpan={WEEK_DAYS.length}
                        className="border border-border bg-muted/60 text-foreground font-bold w-10 tracking-widest"
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
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
                          className={`border border-border text-foreground p-2 align-top ${hasCourse ? "bg-primary/10" : "bg-background/40"}`}
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
        </GlassCard>
      )}
    </DashboardLayout>
  );
};

export default Results;
