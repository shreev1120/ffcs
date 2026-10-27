import * as XLSX from "xlsx";
import { getSlotBatch } from "./clientSlotUtils";

export interface ParsedCourse {
  slNo: number;
  courseCode: string;
  code?: string;
  courseName: string;
  title?: string;
  credits: number;
  category: string;
  registrationType: string;
  courseType: string;
  type?: string;
  slot: string;
  faculty: string;
  venue: string;
  batchType: "Morning" | "Evening" | "Both";
  isLab: boolean;
  theorySlots: string[];
  labSlots: string[];
}

function findRowValue(row: Record<string, unknown>, possibleKeys: string[]): string | undefined {
  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
    const matchingKey = rowKeys.find((k) => k.trim().toLowerCase() === key.toLowerCase());
    if (
      matchingKey &&
      row[matchingKey] !== undefined &&
      row[matchingKey] !== null &&
      String(row[matchingKey]).trim() !== ""
    ) {
      return String(row[matchingKey]).trim();
    }
  }
  return undefined;
}

export function parseCourseRow(row: Record<string, unknown>, index: number): ParsedCourse | null {
  try {
    const slNo =
      findRowValue(row, ["Sl. No", "Sl.No", "S.No", "Serial No", "Sl No", "SL NO"]) ||
      String(index + 1);

    const courseCodeTitle = findRowValue(row, [
      "Course Code & Title",
      "Course Code & Course Title",
      "Course Code &",
      "Course Code & ",
      "Course Code and Title",
      "COURSE CODE & TITLE",
      "COURSE CODE & COURSE TITLE",
    ]);

    const creditsRaw =
      findRowValue(row, ["Credits", "CREDITS", "L-T-P-J-C", "Credit", "L T P J C", "Cr"]) || "3";
    const category = findRowValue(row, ["Category", "CATEGORY"]) || "General";
    const regType =
      findRowValue(row, ["Reg Type", "REG TYPE", "Registration Type", "Type of Reg"]) || "Regular";
    const slot = findRowValue(row, ["Slot", "SLOT", "slot", "Slots"]) || "";
    const faculty =
      findRowValue(row, ["Faculty", "FACULTY", "faculty", "Faculty Name", "Staff"]) || "TBA";
    const venue =
      findRowValue(row, ["Venue", "VENUE", "venue", "Room", "Class Room", "Classroom"]) || "TBA";
    const courseType = findRowValue(row, ["Course Type", "COURSE TYPE", "Type", "type"]);

    let courseCode = findRowValue(row, ["Course Code", "COURSE CODE", "Code", "code"]);
    let courseName = findRowValue(row, [
      "Course Title",
      "COURSE TITLE",
      "Title",
      "title",
      "Course Name",
    ]);

    // Handle combined "BCSE202L - Data Structures" or "BCSE202L Data Structures"
    if (courseCodeTitle && (!courseCode || !courseName)) {
      const splitPos = courseCodeTitle.indexOf(" - ");
      if (splitPos !== -1) {
        courseCode = courseCodeTitle.substring(0, splitPos).trim();
        courseName = courseCodeTitle.substring(splitPos + 3).trim();
      } else {
        const firstSpace = courseCodeTitle.trim().indexOf(" ");
        if (firstSpace !== -1 && /^[A-Z]{3,4}[0-9]/i.test(courseCodeTitle.trim())) {
          courseCode = courseCodeTitle.trim().substring(0, firstSpace).trim();
          courseName = courseCodeTitle.trim().substring(firstSpace + 1).trim();
        } else {
          courseCode = courseCodeTitle;
          courseName = courseCodeTitle;
        }
      }
    }

    if (!courseCode || !slot) {
      return null;
    }

    if (!courseName) {
      courseName = courseCode;
    }

    // Parse credits (handle formats like "3-0-0-0-3", "3 0 0 3.0", or "3")
    let parsedCredits = 0;
    if (typeof creditsRaw === "string") {
      if (creditsRaw.includes("-")) {
        const parts = creditsRaw.split("-");
        parsedCredits = parseFloat(parts[parts.length - 1]) || 0;
      } else if (creditsRaw.includes(" ")) {
        const parts = creditsRaw.trim().split(/\s+/);
        parsedCredits = parseFloat(parts[parts.length - 1]) || 0;
      } else {
        parsedCredits = parseFloat(creditsRaw) || 0;
      }
    } else {
      parsedCredits = parseFloat(String(creditsRaw)) || 0;
    }

    const slotStr = slot.toString().trim().toUpperCase();
    const batchType = getSlotBatch(slotStr);

    // Determine course type accurately
    let determinedType = courseType;
    if (!determinedType) {
      if (slotStr === "NIL" || slotStr === "N/A" || slotStr === "-" || slotStr === "NONE") {
        determinedType = "Non-graded";
      } else if (/\bL\d+/i.test(slotStr) && !slotStr.match(/[A-G]\d+/i)) {
        determinedType = "Lab";
      } else if (courseCode.endsWith("P") && (slotStr.includes("L") || !slotStr.match(/[A-G]\d+/i))) {
        determinedType = "Lab";
      } else {
        determinedType = "Theory";
      }
    }

    const isLab =
      determinedType.toLowerCase().includes("lab") ||
      courseCode.toUpperCase().endsWith("P") ||
      (slotStr.startsWith("L") && !slotStr.match(/[A-G]\d+/i));

    const theorySlots = isLab ? [] : [slotStr];
    const labSlots = isLab ? [slotStr] : [];

    return {
      slNo: parseInt(slNo, 10) || index + 1,
      courseCode: courseCode.trim().toUpperCase(),
      code: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      title: courseName.trim(),
      credits: parsedCredits,
      category: category ? category.trim() : "N/A",
      registrationType: regType ? regType.trim() : "Regular",
      courseType: determinedType,
      type: determinedType,
      slot: slotStr,
      faculty: faculty ? faculty.trim() : "TBA",
      venue: venue ? venue.trim() : "TBA",
      batchType,
      isLab,
      theorySlots,
      labSlots,
    };
  } catch (error) {
    console.warn(`Row ${index + 1} parsing error:`, error);
    return null;
  }
}

/**
 * Parse an Excel file directly in the client browser
 */
export async function parseExcelFileInBrowser(file: File): Promise<ParsedCourse[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The uploaded Excel workbook contains no sheets.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

  if (!rawData || rawData.length === 0) {
    throw new Error("Excel spreadsheet is empty or has no recognizable data rows.");
  }

  const courses: ParsedCourse[] = [];
  rawData.forEach((row, idx) => {
    const course = parseCourseRow(row, idx);
    if (course) {
      courses.push(course);
    }
  });

  if (courses.length === 0) {
    throw new Error("No valid courses found. Ensure columns include Course Code and Slot.");
  }

  return courses;
}
