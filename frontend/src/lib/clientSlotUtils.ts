import {
  MASTER_THEORY_SLOTS,
  MASTER_LAB_SLOTS,
  SlotSession,
  parseSlotList,
  checkSlotClash,
} from "./slotMapping";

export function parseSlotString(slotStr: string): string[] {
  return parseSlotList(slotStr);
}

export function getSlotInfo(slotCode: string): { batch: "Morning" | "Evening"; sessions: SlotSession[] } | null {
  const norm = slotCode.trim().toUpperCase();
  if (MASTER_THEORY_SLOTS[norm]) return MASTER_THEORY_SLOTS[norm];
  if (MASTER_LAB_SLOTS[norm]) return MASTER_LAB_SLOTS[norm];
  return null;
}

export function hasClash(slot1: string, slot2: string): boolean {
  return checkSlotClash(slot1, slot2);
}

export function getSlotBatch(slotString: string): "Morning" | "Evening" | "Both" {
  const slotCodes = parseSlotString(slotString);
  if (slotCodes.length === 0) return "Both";

  const batches = slotCodes.map((code) => {
    const normalized = code.trim().toUpperCase();

    if (/^L\d+$/.test(normalized)) {
      const slotNumber = parseInt(normalized.slice(1), 10);
      if (slotNumber >= 1 && slotNumber <= 30) return "Morning";
      if (slotNumber >= 31 && slotNumber <= 60) return "Evening";
      return "Both";
    }

    if (normalized.endsWith("1")) return "Morning";
    if (normalized.endsWith("2")) return "Evening";

    const info = getSlotInfo(normalized);
    return info ? info.batch : "Both";
  });

  if (batches.every((b) => b === "Morning")) return "Morning";
  if (batches.every((b) => b === "Evening")) return "Evening";
  return "Both";
}

export function isLabCourse(course: { slot?: string; courseType?: string; courseCode?: string }): boolean {
  if (!course) return false;
  const slotCodes = parseSlotString(course.slot || "");
  const hasLabSlot = slotCodes.some((code) => /^L\d+$/i.test(code));
  if (hasLabSlot) return true;
  const hasTheorySlot = slotCodes.some((code) => /^[A-G]/i.test(code));
  if (hasTheorySlot) return false;
  const type = (course.courseType || "").toUpperCase();
  if (type.includes("LAB")) return true;
  if (type.includes("THEORY")) return false;
  const code = (course.courseCode || "").toUpperCase();
  return code.endsWith("P");
}

export function convertLabSlotForBatch(slotString: string, targetBatch: "Morning" | "Evening"): string {
  if (!slotString) return slotString;
  const codes = parseSlotString(slotString);
  if (codes.length === 0) return slotString;

  const converted = codes.map((code) => {
    const norm = code.toUpperCase();
    const m = norm.match(/^L(\d+)$/i);
    if (!m) return code;
    const num = parseInt(m[1], 10);
    if (targetBatch === "Morning" && num >= 1 && num <= 30) {
      return `L${num + 30}`;
    }
    if (targetBatch === "Evening" && num >= 31 && num <= 60) {
      return `L${num - 30}`;
    }
    return code;
  });

  return converted.join("+");
}

export function isMorningTheorySlot(slotString: string): boolean {
  const slotCodes = parseSlotString(slotString);
  if (slotCodes.length === 0) return false;

  return slotCodes.every((code) => {
    const norm = code.toUpperCase();
    if (/^L\d+$/.test(norm)) return false;
    if (norm.endsWith("2")) return false;
    if (norm.endsWith("1")) return true;
    const info = getSlotInfo(norm);
    return info && info.batch === "Morning";
  });
}

export function isEveningTheorySlot(slotString: string): boolean {
  const slotCodes = parseSlotString(slotString);
  if (slotCodes.length === 0) return false;

  return slotCodes.every((code) => {
    const norm = code.toUpperCase();
    if (/^L\d+$/.test(norm)) return false;
    if (norm.endsWith("1")) return false;
    if (norm.endsWith("2")) return true;
    const info = getSlotInfo(norm);
    return info && info.batch === "Evening";
  });
}

export function isMorningLabSlot(slotString: string): boolean {
  const slotCodes = parseSlotString(slotString);
  if (slotCodes.length === 0) return false;

  return slotCodes.every((code) => {
    const norm = code.toUpperCase();
    if (/^L\d+$/.test(norm)) {
      const num = parseInt(norm.slice(1), 10);
      return num >= 1 && num <= 30;
    }
    return false;
  });
}

export function isEveningLabSlot(slotString: string): boolean {
  const slotCodes = parseSlotString(slotString);
  if (slotCodes.length === 0) return false;

  return slotCodes.every((code) => {
    const norm = code.toUpperCase();
    if (/^L\d+$/.test(norm)) {
      const num = parseInt(norm.slice(1), 10);
      return num >= 31 && num <= 60;
    }
    return false;
  });
}

export function filterCoursesByBatch<T extends { slot?: string; courseType?: string; courseCode?: string }>(
  courses: T[],
  batchPreference: "Morning" | "Evening" | "Both"
): T[] {
  if (!Array.isArray(courses)) return [];
  if (batchPreference === "Both") return courses;

  return courses.filter((course) => {
    if (!course || !course.slot || course.slot === "NIL") return false;
    const lab = isLabCourse(course);

    if (batchPreference === "Morning") {
      return lab ? isEveningLabSlot(course.slot) : isMorningTheorySlot(course.slot);
    }

    if (batchPreference === "Evening") {
      return lab ? isMorningLabSlot(course.slot) : isEveningTheorySlot(course.slot);
    }

    return false;
  });
}

export function validateTimetableBatchPurity(
  courses: Array<{ slot?: string; courseType?: string; courseCode?: string }>,
  batchPreference: "Morning" | "Evening" | "Both"
): boolean {
  if (!Array.isArray(courses) || courses.length === 0) return false;
  if (!["Morning", "Evening"].includes(batchPreference)) return true;

  for (const course of courses) {
    if (!course || !course.slot || course.slot === "NIL") continue;
    const lab = isLabCourse(course);

    if (batchPreference === "Morning") {
      if (lab && !isEveningLabSlot(course.slot)) return false;
      if (!lab && !isMorningTheorySlot(course.slot)) return false;
    } else if (batchPreference === "Evening") {
      if (lab && !isMorningLabSlot(course.slot)) return false;
      if (!lab && !isEveningTheorySlot(course.slot)) return false;
    }
  }

  return true;
}

export function getTimetableBatch(courses: Array<{ slot?: string; courseType?: string; courseCode?: string }>): "Morning" | "Evening" | "Mixed" {
  if (!Array.isArray(courses) || courses.length === 0) return "Morning";
  if (validateTimetableBatchPurity(courses, "Morning")) return "Morning";
  if (validateTimetableBatchPurity(courses, "Evening")) return "Evening";
  return "Mixed";
}

export function getTimeSlots(slotString: string): Array<{ day: string; time: string; slot: string; batch: string }> {
  const slotCodes = parseSlotString(slotString);
  const timeSlots: Array<{ day: string; time: string; slot: string; batch: string }> = [];

  for (const code of slotCodes) {
    const info = getSlotInfo(code);
    if (info) {
      for (const session of info.sessions || []) {
        timeSlots.push({
          day: session.day,
          time: session.time,
          slot: code,
          batch: info.batch,
        });
      }
    }
  }

  return timeSlots;
}
