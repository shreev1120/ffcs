export interface SlotSession {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  time: string; // e.g. "08:00-08:50"
  start: string;
  end: string;
}

export interface SlotInfo {
  code: string;
  batch: "Morning" | "Evening";
  sessions: SlotSession[];
}

export const MASTER_THEORY_SLOTS: Record<string, { batch: "Morning" | "Evening"; sessions: SlotSession[] }> = {
  // Morning Theory (*1)
  A1: {
    batch: "Morning",
    sessions: [
      { day: "Monday", time: "08:00-08:50", start: "08:00", end: "08:50" },
      { day: "Wednesday", time: "08:55-09:45", start: "08:55", end: "09:45" },
    ],
  },
  B1: {
    batch: "Morning",
    sessions: [
      { day: "Tuesday", time: "08:00-08:50", start: "08:00", end: "08:50" },
      { day: "Thursday", time: "08:55-09:45", start: "08:55", end: "09:45" },
    ],
  },
  C1: {
    batch: "Morning",
    sessions: [
      { day: "Wednesday", time: "08:00-08:50", start: "08:00", end: "08:50" },
      { day: "Friday", time: "08:55-09:45", start: "08:55", end: "09:45" },
    ],
  },
  D1: {
    batch: "Morning",
    sessions: [
      { day: "Monday", time: "09:50-10:40", start: "09:50", end: "10:40" },
      { day: "Thursday", time: "08:00-08:50", start: "08:00", end: "08:50" },
    ],
  },
  E1: {
    batch: "Morning",
    sessions: [
      { day: "Tuesday", time: "09:50-10:40", start: "09:50", end: "10:40" },
      { day: "Friday", time: "08:00-08:50", start: "08:00", end: "08:50" },
    ],
  },
  F1: {
    batch: "Morning",
    sessions: [
      { day: "Monday", time: "08:55-09:45", start: "08:55", end: "09:45" },
      { day: "Wednesday", time: "09:50-10:40", start: "09:50", end: "10:40" },
    ],
  },
  G1: {
    batch: "Morning",
    sessions: [
      { day: "Tuesday", time: "08:55-09:45", start: "08:55", end: "09:45" },
      { day: "Thursday", time: "09:50-10:40", start: "09:50", end: "10:40" },
    ],
  },
  TA1: { batch: "Morning", sessions: [{ day: "Friday", time: "09:50-10:40", start: "09:50", end: "10:40" }] },
  TB1: { batch: "Morning", sessions: [{ day: "Monday", time: "10:45-11:35", start: "10:45", end: "11:35" }] },
  TC1: { batch: "Morning", sessions: [{ day: "Tuesday", time: "10:45-11:35", start: "10:45", end: "11:35" }] },
  TD1: { batch: "Morning", sessions: [{ day: "Wednesday", time: "10:45-11:35", start: "10:45", end: "11:35" }] },
  TE1: { batch: "Morning", sessions: [{ day: "Thursday", time: "10:45-11:35", start: "10:45", end: "11:35" }] },
  TF1: { batch: "Morning", sessions: [{ day: "Friday", time: "10:45-11:35", start: "10:45", end: "11:35" }] },
  TG1: { batch: "Morning", sessions: [{ day: "Monday", time: "11:40-12:30", start: "11:40", end: "12:30" }] },
  TAA1: { batch: "Morning", sessions: [{ day: "Tuesday", time: "11:40-12:30", start: "11:40", end: "12:30" }] },
  TCC1: { batch: "Morning", sessions: [{ day: "Thursday", time: "11:40-12:30", start: "11:40", end: "12:30" }] },
  TDD1: { batch: "Morning", sessions: [{ day: "Friday", time: "11:40-12:30", start: "11:40", end: "12:30" }] },

  // Evening Theory (*2)
  A2: {
    batch: "Evening",
    sessions: [
      { day: "Monday", time: "14:00-14:50", start: "14:00", end: "14:50" },
      { day: "Wednesday", time: "14:55-15:45", start: "14:55", end: "15:45" },
    ],
  },
  B2: {
    batch: "Evening",
    sessions: [
      { day: "Tuesday", time: "14:00-14:50", start: "14:00", end: "14:50" },
      { day: "Thursday", time: "14:55-15:45", start: "14:55", end: "15:45" },
    ],
  },
  C2: {
    batch: "Evening",
    sessions: [
      { day: "Wednesday", time: "14:00-14:50", start: "14:00", end: "14:50" },
      { day: "Friday", time: "14:55-15:45", start: "14:55", end: "15:45" },
    ],
  },
  D2: {
    batch: "Evening",
    sessions: [
      { day: "Monday", time: "15:50-16:40", start: "15:50", end: "16:40" },
      { day: "Thursday", time: "14:00-14:50", start: "14:00", end: "14:50" },
    ],
  },
  E2: {
    batch: "Evening",
    sessions: [
      { day: "Tuesday", time: "15:50-16:40", start: "15:50", end: "16:40" },
      { day: "Friday", time: "14:00-14:50", start: "14:00", end: "14:50" },
    ],
  },
  F2: {
    batch: "Evening",
    sessions: [
      { day: "Monday", time: "14:55-15:45", start: "14:55", end: "15:45" },
      { day: "Wednesday", time: "15:50-16:40", start: "15:50", end: "16:40" },
    ],
  },
  G2: {
    batch: "Evening",
    sessions: [
      { day: "Tuesday", time: "14:55-15:45", start: "14:55", end: "15:45" },
      { day: "Thursday", time: "15:50-16:40", start: "15:50", end: "16:40" },
    ],
  },
  TA2: { batch: "Evening", sessions: [{ day: "Friday", time: "15:50-16:40", start: "15:50", end: "16:40" }] },
  TB2: { batch: "Evening", sessions: [{ day: "Monday", time: "16:45-17:35", start: "16:45", end: "17:35" }] },
  TC2: { batch: "Evening", sessions: [{ day: "Tuesday", time: "16:45-17:35", start: "16:45", end: "17:35" }] },
  TD2: { batch: "Evening", sessions: [{ day: "Wednesday", time: "16:45-17:35", start: "16:45", end: "17:35" }] },
  TE2: { batch: "Evening", sessions: [{ day: "Thursday", time: "16:45-17:35", start: "16:45", end: "17:35" }] },
  TF2: { batch: "Evening", sessions: [{ day: "Friday", time: "16:45-17:35", start: "16:45", end: "17:35" }] },
  TG2: { batch: "Evening", sessions: [{ day: "Monday", time: "17:40-18:30", start: "17:40", end: "18:30" }] },
  TAA2: { batch: "Evening", sessions: [{ day: "Tuesday", time: "17:40-18:30", start: "17:40", end: "18:30" }] },
  TBB2: { batch: "Evening", sessions: [{ day: "Wednesday", time: "17:40-18:30", start: "17:40", end: "18:30" }] },
  TCC2: { batch: "Evening", sessions: [{ day: "Thursday", time: "17:40-18:30", start: "17:40", end: "18:30" }] },
  TDD2: { batch: "Evening", sessions: [{ day: "Friday", time: "17:40-18:30", start: "17:40", end: "18:30" }] },
};

// Generate Lab slots L1..L60
export const MASTER_LAB_SLOTS: Record<string, { batch: "Morning" | "Evening"; sessions: SlotSession[] }> = {};
const weekDays: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"> = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const morningLabTimes = [
  { time: "08:00-08:50", start: "08:00", end: "08:50" },
  { time: "08:50-09:40", start: "08:50", end: "09:40" },
  { time: "09:50-10:40", start: "09:50", end: "10:40" },
  { time: "10:40-11:30", start: "10:40", end: "11:30" },
  { time: "11:40-12:30", start: "11:40", end: "12:30" },
  { time: "12:30-13:20", start: "12:30", end: "13:20" },
];
const eveningLabTimes = [
  { time: "14:00-14:50", start: "14:00", end: "14:50" },
  { time: "14:50-15:40", start: "14:50", end: "15:40" },
  { time: "15:50-16:40", start: "15:50", end: "16:40" },
  { time: "16:40-17:30", start: "16:40", end: "17:30" },
  { time: "17:40-18:30", start: "17:40", end: "18:30" },
  { time: "18:30-19:20", start: "18:30", end: "19:20" },
];

let lNum = 1;
for (const day of weekDays) {
  for (const t of morningLabTimes) {
    MASTER_LAB_SLOTS[`L${lNum}`] = {
      batch: "Morning",
      sessions: [{ day, time: t.time, start: t.start, end: t.end }],
    };
    lNum++;
  }
}

lNum = 31;
for (const day of weekDays) {
  for (const t of eveningLabTimes) {
    MASTER_LAB_SLOTS[`L${lNum}`] = {
      batch: "Evening",
      sessions: [{ day, time: t.time, start: t.start, end: t.end }],
    };
    lNum++;
  }
}

export function parseSlotList(slotStr: string): string[] {
  if (!slotStr) return [];
  return slotStr
    .split(/[+/,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function getSlotSessions(slotCode: string): SlotSession[] {
  const norm = slotCode.trim().toUpperCase();
  if (MASTER_THEORY_SLOTS[norm]) return MASTER_THEORY_SLOTS[norm].sessions;
  if (MASTER_LAB_SLOTS[norm]) return MASTER_LAB_SLOTS[norm].sessions;
  return [];
}

export function getAllSessionsForCompoundSlot(compoundSlot: string): SlotSession[] {
  const pieces = parseSlotList(compoundSlot);
  const result: SlotSession[] = [];
  pieces.forEach((p) => {
    result.push(...getSlotSessions(p));
  });
  return result;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function doTwoSessionsClash(s1: SlotSession, s2: SlotSession): boolean {
  if (s1.day !== s2.day) return false;
  const start1 = timeToMinutes(s1.start);
  const end1 = timeToMinutes(s1.end);
  const start2 = timeToMinutes(s2.start);
  const end2 = timeToMinutes(s2.end);
  return start1 < end2 && start2 < end1;
}

export function checkSlotClash(slotA: string, slotB: string): boolean {
  const sessionsA = getAllSessionsForCompoundSlot(slotA);
  const sessionsB = getAllSessionsForCompoundSlot(slotB);
  for (const a of sessionsA) {
    for (const b of sessionsB) {
      if (doTwoSessionsClash(a, b)) return true;
    }
  }
  return false;
}

// Popular Standard Slot Options for Easy Selection
export const COMMON_THEORY_SLOTS = [
  "A1+TA1",
  "B1+TB1",
  "C1+TC1",
  "D1+TD1",
  "E1+TE1",
  "F1+TF1",
  "G1+TG1",
  "TAA1",
  "TCC1",
  "TDD1",
  "A2+TA2",
  "B2+TB2",
  "C2+TC2",
  "D2+TD2",
  "E2+TE2",
  "F2+TF2",
  "G2+TG2",
  "TAA2",
  "TBB2",
  "TCC2",
  "TDD2",
];

export const COMMON_LAB_SLOTS = [
  "L1+L2",
  "L3+L4",
  "L5+L6",
  "L7+L8",
  "L9+L10",
  "L11+L12",
  "L13+L14",
  "L15+L16",
  "L19+L20",
  "L21+L22",
  "L23+L24",
  "L25+L26",
  "L27+L28",
  "L29+L30",
  "L31+L32",
  "L33+L34",
  "L35+L36",
  "L37+L38",
  "L39+L40",
  "L41+L42",
  "L43+L44",
  "L45+L46",
  "L47+L48",
  "L49+L50",
  "L51+L52",
  "L53+L54",
  "L55+L56",
  "L57+L58",
  "L59+L60",
];
