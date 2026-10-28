import {
  hasClash,
  filterCoursesByBatch,
  convertLabSlotForBatch,
  isLabCourse,
  getTimeSlots,
  validateTimetableBatchPurity,
  getTimetableBatch,
  parseSlotString,
} from "./clientSlotUtils";
import { ParsedCourse } from "./clientExcelParser";
import {
  getCourseCategoryPriority,
  isCoreCourse,
  getCourseCategory,
  getCategoryFullName,
} from "./curriculumRules";

export interface TimetableEntry {
  courseCode: string;
  courseName: string;
  slot: string;
  faculty: string;
  venue: string;
  startTime: string;
  endTime: string;
  courseType?: string;
}

export interface TimetableFeatures {
  totalFreeDays: number;
  freeDaysList: string[];
  earliestStartTime: string;
  latestStartTime: string;
  earliestFinishTime: string;
  latestFinishTime: string;
  dailyGaps: Record<string, number>;
  totalGaps: number;
  deadHourGaps: number;
  avgDailySpanHours: number;
  batchShift?: string;
  rankingScore?: number;
  rankingCriteria?: string;
  heuristicSummary?: string;
  rank?: number;
}

export interface CurriculumStats {
  totalCourses: number;
  coreCoursesCount: number;
  electiveCoursesCount: number;
  coreCredits: number;
  electiveCredits: number;
  totalCredits: number;
  breakdown: Record<string, number>;
  isCoreGuaranteed: boolean;
}

export interface ClientTimetable {
  timetableId: string;
  batch: "Morning" | "Evening" | "Mixed";
  courses: ParsedCourse[];
  schedule: Record<string, TimetableEntry[]>;
  rankingScore: number;
  rankingCriteria: string;
  heuristicSummary: string;
  features: TimetableFeatures & { curriculumStats?: CurriculumStats };
  curriculumStats?: CurriculumStats;
  coreCount?: number;
  generationMode?: string;
  excludedCourseGroups?: string[];
  totalCourses: number;
  totalCredits: number;
  rank?: number;
}

export interface GeneratorPreferences {
  batchPreference: "Morning" | "Evening" | "Both";
  rankingCriteria?: "earliest_finish" | "no_morning" | "max_free_days" | "balanced";
  maxTimetables?: number;
  minCredits?: number;
  maxCredits?: number;
  preferredTheorySlots?: string[];
  avoidEarlyMorning?: boolean;
  freeDayPreferred?: string | null;
  selectedFaculties?: string[];
}

function normalizeFacultyName(faculty?: string): string {
  return (faculty || "").trim().toUpperCase();
}

function getCourseComponentKind(course: { courseType?: string; courseCode?: string }): "LAB" | "THEORY" | "OTHER" {
  const courseType = (course.courseType || "").trim().toUpperCase();
  const code = (course.courseCode || "").trim().toUpperCase();

  if (courseType.includes("LAB")) return "LAB";
  if (courseType.includes("THEORY")) return "THEORY";
  if (code.endsWith("P")) return "LAB";
  if (code.endsWith("L")) return "THEORY";
  return "OTHER";
}

function getCourseFamilyKey(courseCode?: string): string {
  const code = (courseCode || "").trim().toUpperCase();
  const match = code.match(/^([A-Z]{2,}\d{3,4})[A-Z]$/);
  return match ? match[1] : code;
}

export function getCoveredTheorySlotBands(slotString: string): Set<string> {
  const bands = new Set<string>();
  const codes = parseSlotString(slotString || "");
  codes.forEach((code) => {
    const norm = code.trim().toUpperCase();
    const match = norm.match(/^T?T?([A-G])[12]$/);
    if (match) {
      bands.add(match[1]);
    }
  });
  return bands;
}

export function theoryBandToBit(band: string): number {
  const code = band.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, ... G=6
  return code >= 0 && code <= 6 ? 1 << code : 0;
}

export function getSlotTheoryMask(slot: string): number {
  let mask = 0;
  const bands = getCoveredTheorySlotBands(slot);
  bands.forEach((b) => {
    mask |= theoryBandToBit(b);
  });
  return mask;
}

interface CourseOptionGroup {
  key: string;
  courseCode: string;
  courseName: string;
  category: string;
  curriculumCategory?: string;
  categoryPriority?: number;
  options: ParsedCourse[];
}

function buildFacultyConstraintFamilies(optionGroups: CourseOptionGroup[]): Set<string> {
  const familyTheoryFaculties = new Map<string, Set<string>>();
  const familyLabFaculties = new Map<string, Set<string>>();

  optionGroups.forEach((group) => {
    (group.options || []).forEach((opt) => {
      const familyKey = getCourseFamilyKey(opt.courseCode);
      const kind = getCourseComponentKind(opt);
      const faculty = normalizeFacultyName(opt.faculty);
      if (!faculty || kind === "OTHER") return;

      if (kind === "THEORY") {
        if (!familyTheoryFaculties.has(familyKey)) familyTheoryFaculties.set(familyKey, new Set());
        familyTheoryFaculties.get(familyKey)!.add(faculty);
      } else if (kind === "LAB") {
        if (!familyLabFaculties.has(familyKey)) familyLabFaculties.set(familyKey, new Set());
        familyLabFaculties.get(familyKey)!.add(faculty);
      }
    });
  });

  const constrained = new Set<string>();
  familyTheoryFaculties.forEach((theoryFaculties, familyKey) => {
    const labFaculties = familyLabFaculties.get(familyKey);
    if (labFaculties && labFaculties.size > 0) {
      const hasCommonFaculty = [...theoryFaculties].some((f) => labFaculties.has(f));
      if (hasCommonFaculty) {
        constrained.add(familyKey);
      }
    }
  });

  return constrained;
}

function passesFacultyConsistency(courses: ParsedCourse[], constrainedFamilies: Set<string>): boolean {
  if (!constrainedFamilies || constrainedFamilies.size === 0) return true;

  const theoryFacultyByFamily = new Map<string, string>();
  const labFacultyByFamily = new Map<string, string>();

  courses.forEach((c) => {
    const familyKey = getCourseFamilyKey(c.courseCode);
    if (!constrainedFamilies.has(familyKey)) return;

    const kind = getCourseComponentKind(c);
    const faculty = normalizeFacultyName(c.faculty);
    if (!faculty) return;

    if (kind === "THEORY") {
      theoryFacultyByFamily.set(familyKey, faculty);
    } else if (kind === "LAB") {
      labFacultyByFamily.set(familyKey, faculty);
    }
  });

  for (const familyKey of constrainedFamilies) {
    const theoryFaculty = theoryFacultyByFamily.get(familyKey);
    const labFaculty = labFacultyByFamily.get(familyKey);
    if (theoryFaculty && labFaculty && theoryFaculty !== labFaculty) {
      return false;
    }
  }

  return true;
}

function buildCourseOptionGroups(
  courses: ParsedCourse[],
  batchPreference: "Morning" | "Evening",
  selectedFaculties?: string[]
): CourseOptionGroup[] {
  // Filter courses for pure batch shift (or convert single labs if needed)
  let eligibleCourses = filterCoursesByBatch(courses, batchPreference);

  // If zero eligible, allow auto-converting lab slots
  if (eligibleCourses.length === 0) {
    const convertedCourses = courses.map((c) => {
      if (isLabCourse(c)) {
        const converted = convertLabSlotForBatch(c.slot, batchPreference);
        return { ...c, slot: converted };
      }
      return c;
    });
    eligibleCourses = filterCoursesByBatch(convertedCourses, batchPreference);
  }

  // Deduplicate identical options
  const optionMap = new Map<string, ParsedCourse>();
  eligibleCourses.forEach((c) => {
    const uniqueOptionKey = `${c.courseCode}__${c.courseType}__${c.slot}__${c.faculty}__${c.venue}`;
    if (!optionMap.has(uniqueOptionKey)) {
      optionMap.set(uniqueOptionKey, c);
    }
  });

  // Group by Course Code
  const groupMap = new Map<string, ParsedCourse[]>();
  optionMap.forEach((course) => {
    const groupKey = course.courseCode;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(course);
  });

  // Normalize selected faculty names for quick, case-insensitive matching
  const normSelectedFaculties = new Set(
    (selectedFaculties || [])
      .map((f) => normalizeFacultyName(f))
      .filter((f) => f.length > 0)
  );

  const optionGroups: CourseOptionGroup[] = [];
  groupMap.forEach((options, groupKey) => {
    let filteredOptions = options;

    // If user specified preferred faculties:
    // Check if any offering in this course group is taught by one of the selected faculties.
    // If yes, filter this course group to ONLY offerings from the selected faculties!
    // (If the user selected multiple best faculties for this course, all their offerings are kept).
    // If no offering matches any selected faculty (e.g. user selected none for this course), retain all offerings.
    if (normSelectedFaculties.size > 0) {
      const matching = options.filter((opt) =>
        normSelectedFaculties.has(normalizeFacultyName(opt.faculty))
      );
      if (matching.length > 0) {
        filteredOptions = matching;
      }
    }

    const first = filteredOptions[0] || options[0];
    optionGroups.push({
      key: groupKey,
      courseCode: first.courseCode,
      courseName: first.courseName,
      category: first.category || "General",
      options: filteredOptions,
    });
  });

  // Sort groups: Priority 1 (Foundation/Skills) first, then Discipline Core, DLES, Electives; then fewer options first
  optionGroups.sort((a, b) => {
    const prioA = getCourseCategoryPriority(a.category, a.courseCode);
    const prioB = getCourseCategoryPriority(b.category, b.courseCode);
    if (prioA !== prioB) return prioA - prioB;
    return a.options.length - b.options.length;
  });

  return optionGroups;
}

interface RawCombo {
  courses: ParsedCourse[];
  excludedGroupKeys: string[];
  generationMode: string;
  coreCount?: number;
}

function generateCombinations(
  courses: ParsedCourse[],
  preferences: GeneratorPreferences
): RawCombo[] {
  const {
    batchPreference = "Morning",
    maxTimetables = 50,
    minCredits = 18,
    maxCredits = 27,
    selectedFaculties = [],
  } = preferences;

  if (batchPreference === "Both") {
    const half = Math.ceil(maxTimetables / 2);
    const m = generateCombinations(courses, { ...preferences, batchPreference: "Morning", maxTimetables: half });
    const e = generateCombinations(courses, { ...preferences, batchPreference: "Evening", maxTimetables: half });
    return [...m, ...e];
  }

  const optionGroups = buildCourseOptionGroups(courses, batchPreference, selectedFaculties);
  if (optionGroups.length === 0) return [];

  const constrainedFamilies = buildFacultyConstraintFamilies(optionGroups);
  const suffixMaxCredits = new Array(optionGroups.length + 1).fill(0);
  for (let i = optionGroups.length - 1; i >= 0; i--) {
    const groupMaxCr = Math.max(...optionGroups[i].options.map((o) => o.credits || 0), 0);
    suffixMaxCredits[i] = suffixMaxCredits[i + 1] + groupMaxCr;
  }

  // Core groups precomputations (FC, DLES, DC):
  const groupIsCore = optionGroups.map((g) => isCoreCourse(g.courseCode, g.category));
  const suffixCoreGroups = new Array(optionGroups.length + 1).fill(0);
  for (let i = optionGroups.length - 1; i >= 0; i--) {
    suffixCoreGroups[i] = suffixCoreGroups[i + 1] + (groupIsCore[i] ? 1 : 0);
  }

  // Precompute required theory slots (A through G) bitmasks
  const groupMasks: number[] = optionGroups.map((g) => {
    let m = 0;
    g.options.forEach((opt) => {
      m |= getSlotTheoryMask(opt.slot);
    });
    return m;
  });

  let requiredBandsMask = 0;
  groupMasks.forEach((m) => {
    requiredBandsMask |= m;
  });

  // Verify that requiredBandsMask can mathematically fit within maxCredits:
  let minBandCreditsSum = 0;
  for (let b = 0; b < 7; b++) {
    const bit = 1 << b;
    if ((requiredBandsMask & bit) !== 0) {
      let minCr = Infinity;
      optionGroups.forEach((g) => {
        const provides = (g.options || []).some((opt) => (getSlotTheoryMask(opt.slot) & bit) !== 0);
        if (provides) {
          const gMin = Math.min(...(g.options || []).map((o) => Number(o.credits) || 3));
          if (gMin < minCr) minCr = gMin;
        }
      });
      if (minCr !== Infinity) {
        minBandCreditsSum += minCr;
      }
    }
  }
  if (minBandCreditsSum > maxCredits) {
    requiredBandsMask = 0;
  }

  const suffixMasks = new Array(optionGroups.length + 1).fill(0);
  for (let i = optionGroups.length - 1; i >= 0; i--) {
    suffixMasks[i] = suffixMasks[i + 1] | groupMasks[i];
  }

  const allTimetables: RawCombo[] = [];
  const tracker = {
    iterations: 0,
    maxIterations: Math.max(150000, maxTimetables * 15000),
    startTime: Date.now(),
    maxDurationMs: 4000,
    bestCoreCount: -1,
    bestSelectedGroups: 0,
    seen: new Set<string>(),
    courseSetCounts: new Map<string, number>(),
  };

  function backtrack(
    groupIndex: number,
    currentTimetable: ParsedCourse[],
    currentCredits: number,
    selectedGroupsCount: number,
    currentCoreCount: number,
    excludedGroupKeys: string[],
    selectedFacultyByFamily: Map<string, string>,
    currentTheoryMask: number
  ) {
    if (tracker.iterations++ > tracker.maxIterations) return;
    if ((tracker.iterations & 511) === 0 && Date.now() - tracker.startTime > tracker.maxDurationMs) return;

    // Prune if remaining core groups cannot reach bestCoreCount
    if (tracker.bestCoreCount > 0 && currentCoreCount + suffixCoreGroups[groupIndex] < tracker.bestCoreCount) {
      return;
    }

    // Compulsory requirement: Every combination must allocate all theory slots from A to G (or all available in input).
    if (requiredBandsMask && (currentTheoryMask | suffixMasks[groupIndex]) !== requiredBandsMask) {
      return;
    }

    const remainingGroups = optionGroups.length - groupIndex;
    if (tracker.bestSelectedGroups > 0 && selectedGroupsCount + remainingGroups < tracker.bestSelectedGroups) {
      return;
    }

    if (currentCredits + suffixMaxCredits[groupIndex] < minCredits) {
      return;
    }

    if (groupIndex >= optionGroups.length) {
      if (
        selectedGroupsCount <= 0 ||
        currentCredits < minCredits ||
        currentCredits > maxCredits ||
        (requiredBandsMask && currentTheoryMask !== requiredBandsMask)
      ) {
        return;
      }

      // Higher core count strictly beats lower core count
      if (currentCoreCount > tracker.bestCoreCount) {
        tracker.bestCoreCount = currentCoreCount;
        tracker.bestSelectedGroups = selectedGroupsCount;
        const retained = allTimetables.filter((t) => (t.coreCount || 0) >= tracker.bestCoreCount);
        allTimetables.length = 0;
        tracker.seen.clear();
        tracker.courseSetCounts.clear();
        retained.forEach((t) => {
          allTimetables.push(t);
          const sig = t.courses.map((c) => `${c.courseCode}|${c.slot}|${c.faculty}`).sort().join("||");
          tracker.seen.add(sig);
          const setKey = t.courses.map((c) => c.courseCode).sort().join(",");
          tracker.courseSetCounts.set(setKey, (tracker.courseSetCounts.get(setKey) || 0) + 1);
        });
      } else if (currentCoreCount < tracker.bestCoreCount) {
        return;
      }

      if (selectedGroupsCount > tracker.bestSelectedGroups) {
        tracker.bestSelectedGroups = selectedGroupsCount;
        const retained = allTimetables.filter((t) => (t.coreCount || 0) >= tracker.bestCoreCount && t.courses.length >= tracker.bestSelectedGroups);
        allTimetables.length = 0;
        tracker.seen.clear();
        tracker.courseSetCounts.clear();
        retained.forEach((t) => {
          allTimetables.push(t);
          const sig = t.courses.map((c) => `${c.courseCode}|${c.slot}|${c.faculty}`).sort().join("||");
          tracker.seen.add(sig);
          const setKey = t.courses.map((c) => c.courseCode).sort().join(",");
          tracker.courseSetCounts.set(setKey, (tracker.courseSetCounts.get(setKey) || 0) + 1);
        });
      }

      if (selectedGroupsCount >= tracker.bestSelectedGroups && allTimetables.length < maxTimetables * 2) {
        if (validateTimetableBatchPurity(currentTimetable, batchPreference)) {
          const courseSig = currentTimetable.map((c) => `${c.courseCode}|${c.slot}|${c.faculty}`).sort().join("||");
          if (!tracker.seen.has(courseSig)) {
            const courseSetKey = currentTimetable.map((c) => c.courseCode).sort().join(",");
            const existingCount = tracker.courseSetCounts.get(courseSetKey) || 0;
            const maxPerSet = Math.max(4, Math.floor((maxTimetables * 2) / 10));
            if (existingCount < maxPerSet || allTimetables.length >= maxTimetables * 1.5) {
              tracker.seen.add(courseSig);
              tracker.courseSetCounts.set(courseSetKey, existingCount + 1);
              allTimetables.push({
                courses: [...currentTimetable],
                excludedGroupKeys: [...excludedGroupKeys],
                generationMode: "zero-clash-pure",
                coreCount: currentCoreCount,
              });
            }
          }
        }
      }
      return;
    }

    const currentGroup = optionGroups[groupIndex];
    const currentSlots = currentTimetable.map((c) => c.slot);
    const isCore = groupIsCore[groupIndex];

    // Try each option in current group
    for (const option of currentGroup.options) {
      const optionCredits = option.credits || 0;
      if (currentCredits + optionCredits > maxCredits) continue;

      // Check slot clash against all currently selected courses
      const clashes = currentSlots.some((slot) => hasClash(option.slot, slot));
      if (clashes) continue;

      // Check faculty consistency for embedded theory+lab courses
      const familyKey = getCourseFamilyKey(option.courseCode);
      const isConstrained = constrainedFamilies.has(familyKey);
      const optFaculty = normalizeFacultyName(option.faculty);

      let facultyConflict = false;
      let rollbackFaculty = false;

      if (isConstrained && optFaculty) {
        const existingFaculty = selectedFacultyByFamily.get(familyKey);
        if (existingFaculty && existingFaculty !== optFaculty) {
          facultyConflict = true;
        } else if (!existingFaculty) {
          selectedFacultyByFamily.set(familyKey, optFaculty);
          rollbackFaculty = true;
        }
      }

      if (!facultyConflict) {
        const optTheoryMask = getSlotTheoryMask(option.slot);
        currentTimetable.push(option);
        backtrack(
          groupIndex + 1,
          currentTimetable,
          currentCredits + optionCredits,
          selectedGroupsCount + 1,
          currentCoreCount + (isCore ? 1 : 0),
          excludedGroupKeys,
          selectedFacultyByFamily,
          currentTheoryMask | optTheoryMask
        );
        currentTimetable.pop();
      }

      if (rollbackFaculty) {
        selectedFacultyByFamily.delete(familyKey);
      }

      if (allTimetables.length >= maxTimetables * 2) return;
    }

    // Branch 2: Skip current group
    excludedGroupKeys.push(currentGroup.key);
    backtrack(
      groupIndex + 1,
      currentTimetable,
      currentCredits,
      selectedGroupsCount,
      currentCoreCount,
      excludedGroupKeys,
      selectedFacultyByFamily,
      currentTheoryMask
    );
    excludedGroupKeys.pop();
  }

  backtrack(0, [], 0, 0, 0, [], new Map(), 0);

  // Sort raw combos to prioritize coreCount
  allTimetables.sort((a, b) => {
    const diffCore = (b.coreCount || 0) - (a.coreCount || 0);
    if (diffCore !== 0) return diffCore;
    return b.courses.length - a.courses.length;
  });

  // If no combination was found with strict minCredits, relax credit threshold down to available
  if (allTimetables.length === 0) {
    const relaxedTimetables: RawCombo[] = [];
    tracker.iterations = 0;
    tracker.startTime = Date.now();

    function relaxedBacktrack(idx: number, cur: ParsedCourse[], curCr: number) {
      if (relaxedTimetables.length >= maxTimetables) return;
      if (idx >= optionGroups.length) {
        if (cur.length > 0) {
          relaxedTimetables.push({
            courses: [...cur],
            excludedGroupKeys: [],
            generationMode: "relaxed-credits",
          });
        }
        return;
      }

      for (const opt of optionGroups[idx].options) {
        const clashes = cur.some((c) => hasClash(opt.slot, c.slot));
        if (!clashes && passesFacultyConsistency([...cur, opt], constrainedFamilies)) {
          cur.push(opt);
          relaxedBacktrack(idx + 1, cur, curCr + (opt.credits || 0));
          cur.pop();
        }
      }
      relaxedBacktrack(idx + 1, cur, curCr);
    }

    relaxedBacktrack(0, [], 0);
    return relaxedTimetables.slice(0, maxTimetables);
  }

  return allTimetables.slice(0, maxTimetables);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function createSchedule(courses: ParsedCourse[]): Record<string, TimetableEntry[]> {
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const schedule: Record<string, TimetableEntry[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  courses.forEach((course) => {
    const timeSlots = getTimeSlots(course.slot);
    timeSlots.forEach((slotInfo) => {
      if (schedule[slotInfo.day]) {
        const [start, end] = slotInfo.time.split("-");
        schedule[slotInfo.day].push({
          courseCode: course.courseCode,
          courseName: course.courseName,
          slot: slotInfo.slot,
          faculty: course.faculty || "Faculty",
          venue: course.venue || "TBD",
          startTime: start,
          endTime: end,
          courseType: course.courseType,
        });
      }
    });
  });

  // Sort daily entries chronologically
  weekDays.forEach((day) => {
    schedule[day].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  });

  return schedule;
}

function calculateFeatures(schedule: Record<string, TimetableEntry[]>): TimetableFeatures {
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  let freeDaysCount = 0;
  const freeDaysList: string[] = [];
  const dailyGaps: Record<string, number> = {};
  let totalGaps = 0;
  let deadHourGaps = 0;
  let totalDailySpanMinutes = 0;
  let daysWithClasses = 0;

  let earliestStartMins = Infinity;
  let latestStartMins = -Infinity;
  let earliestFinishMins = Infinity;
  let latestFinishMins = -Infinity;

  weekDays.forEach((day) => {
    const entries = schedule[day] || [];
    if (entries.length === 0) {
      freeDaysCount++;
      freeDaysList.push(day);
      dailyGaps[day] = 0;
      return;
    }

    daysWithClasses++;
    const dayFirst = timeToMinutes(entries[0].startTime);
    const dayLast = timeToMinutes(entries[entries.length - 1].endTime);

    if (dayFirst < earliestStartMins) earliestStartMins = dayFirst;
    if (dayFirst > latestStartMins) latestStartMins = dayFirst;
    if (dayLast < earliestFinishMins) earliestFinishMins = dayLast;
    if (dayLast > latestFinishMins) latestFinishMins = dayLast;

    totalDailySpanMinutes += dayLast - dayFirst;

    let dayGapMinutes = 0;
    for (let i = 0; i < entries.length - 1; i++) {
      const curEnd = timeToMinutes(entries[i].endTime);
      const nxtStart = timeToMinutes(entries[i + 1].startTime);
      if (nxtStart > curEnd) {
        const diff = nxtStart - curEnd;
        dayGapMinutes += diff;
        if (diff >= 50 && diff <= 120) {
          deadHourGaps++;
        }
      }
    }
    dailyGaps[day] = dayGapMinutes;
    totalGaps += dayGapMinutes;
  });

  function formatMins(mins: number): string {
    if (!isFinite(mins) || mins < 0) return "--:--";
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  const avgSpan = daysWithClasses > 0 ? totalDailySpanMinutes / daysWithClasses / 60 : 0;

  return {
    totalFreeDays: freeDaysCount,
    freeDaysList,
    earliestStartTime: formatMins(earliestStartMins),
    latestStartTime: formatMins(latestStartMins),
    earliestFinishTime: formatMins(earliestFinishMins),
    latestFinishTime: formatMins(latestFinishMins),
    dailyGaps,
    totalGaps,
    deadHourGaps,
    avgDailySpanHours: Math.round(avgSpan * 10) / 10,
  };
}

function computeHeuristicScore(
  features: TimetableFeatures,
  rankingCriteria: string = "balanced"
): { score: number; rankingCriteria: string; summary: string } {
  let rawScore = 80;
  let summary = "Balanced timetable";

  const freeDays = features.totalFreeDays || 0;
  const deadHours = features.deadHourGaps || 0;

  switch (rankingCriteria) {
    case "earliest_finish": {
      const finishMins = timeToMinutes(features.latestFinishTime === "--:--" ? "19:00" : features.latestFinishTime);
      const finishBonus = Math.max(0, 1140 - finishMins) / 6; // 1140 = 19:00
      rawScore = Math.min(100, Math.max(30, 70 + finishBonus + freeDays * 5));
      summary = `Early class completion at ${features.latestFinishTime} with ${freeDays} free days`;
      break;
    }
    case "no_morning": {
      const startMins = timeToMinutes(features.earliestStartTime === "--:--" ? "08:00" : features.earliestStartTime);
      const sleepInBonus = Math.max(0, startMins - 480) / 4; // 480 = 08:00
      rawScore = Math.min(100, Math.max(30, 75 + sleepInBonus));
      summary = `Comfortable morning starts around ${features.earliestStartTime}`;
      break;
    }
    case "max_free_days": {
      rawScore = Math.min(100, 60 + freeDays * 15 - deadHours * 3);
      summary = `${freeDays} total free days (${features.freeDaysList.join(", ") || "none"})`;
      break;
    }
    case "balanced":
    default: {
      const penalty = deadHours * 4;
      rawScore = Math.max(30, Math.min(100, 95 - penalty + freeDays * 4));
      summary = deadHours === 0
        ? `Zero dead-hour gaps with ${freeDays} free days`
        : `Even daily schedule with ${deadHours} gap intervals`;
      break;
    }
  }

  return {
    score: Math.round(rawScore),
    rankingCriteria,
    summary,
  };
}

/**
 * Generate full conflict-free timetables purely in the client browser
 */
export function generateClientTimetables(
  courses: ParsedCourse[],
  preferences: GeneratorPreferences
): {
  timetables: ClientTimetable[];
  timetablesCount: number;
  batchPreference: "Morning" | "Evening" | "Both";
  coursesCount: number;
} {
  const minCredits = preferences.minCredits !== undefined ? Number(preferences.minCredits) : 18;
  const maxCredits = preferences.maxCredits !== undefined ? Number(preferences.maxCredits) : 27;
  const rankingCriteria = preferences.rankingCriteria || "balanced";

  const rawCombos = generateCombinations(courses, {
    ...preferences,
    minCredits,
    maxCredits,
  });

    const totalCoreInInput = courses.filter((c) => isCoreCourse(c.courseCode, c.category)).length;

    const scored: ClientTimetable[] = rawCombos
    .map((combo, idx) => {
      const courseList = combo.courses;
      const schedule = createSchedule(courseList);
      const features = calculateFeatures(schedule);
      const heuristic = computeHeuristicScore(features, rankingCriteria);
      const ttBatch = getTimetableBatch(courseList);
      const totalCredits = courseList.reduce((sum, c) => sum + (c.credits || 0), 0);

      const coreCourses = courseList.filter((c) => isCoreCourse(c.courseCode, c.category));
      const electiveCourses = courseList.filter((c) => !isCoreCourse(c.courseCode, c.category));
      const coreCredits = coreCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
      const electiveCredits = electiveCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

      const breakdown: Record<string, number> = { FC: 0, DLES: 0, DC: 0, DE: 0 };
      courseList.forEach((c) => {
        const cat = getCourseCategory(c.courseCode, c.category);
        breakdown[cat] = (breakdown[cat] || 0) + 1;
      });

      const curriculumStats: CurriculumStats = {
        totalCourses: courseList.length,
        coreCoursesCount: coreCourses.length,
        electiveCoursesCount: electiveCourses.length,
        coreCredits,
        electiveCredits,
        totalCredits,
        breakdown,
        isCoreGuaranteed: totalCoreInInput === 0 || coreCourses.length >= totalCoreInInput,
      };

      const featuresWithScore: TimetableFeatures & { curriculumStats?: CurriculumStats } = {
        ...features,
        batchShift: ttBatch,
        rankingScore: heuristic.score,
        rankingCriteria: heuristic.rankingCriteria,
        heuristicSummary: heuristic.summary,
        curriculumStats,
      };

      return {
        timetableId: `TT-LOCAL-${Date.now()}-${idx + 1}`,
        batch: ttBatch,
        courses: courseList,
        schedule,
        rankingScore: heuristic.score,
        rankingCriteria: heuristic.rankingCriteria,
        heuristicSummary: heuristic.summary,
        features: featuresWithScore,
        curriculumStats,
        coreCount: coreCourses.length,
        generationMode: combo.generationMode,
        excludedCourseGroups: combo.excludedGroupKeys,
        totalCourses: courseList.length,
        totalCredits,
      };
    })
    .filter((tt) => tt.totalCredits >= minCredits && tt.totalCredits <= maxCredits);

  // Sort by Core courses count first, then heuristic score
  scored.sort((a, b) => {
    const diffCore = (b.coreCount || 0) - (a.coreCount || 0);
    if (diffCore !== 0) return diffCore;
    return b.rankingScore - a.rankingScore;
  });

  // Assign ranks 1..N
  scored.forEach((tt, i) => {
    tt.rank = i + 1;
    if (tt.features) {
      tt.features.rank = i + 1;
    }
  });

  return {
    timetables: scored,
    timetablesCount: scored.length,
    batchPreference: preferences.batchPreference || "Morning",
    coursesCount: courses.length,
  };
}
