/**
 * Curriculum Category Rules & Priority Engine for VIT FFCS
 * 
 * Based on VIT Curriculum Credit Detail:
 * Priority 1: FC   - Foundation Core
 * Priority 2: DLES - Discipline-linked Engineering Sciences
 * Priority 3: DC   - Discipline Core
 * Priority 4: DE   - Discipline Elective
 */

export type CurriculumCategoryCode = 'FC' | 'DLES' | 'DC' | 'DE' | 'PI' | 'OE' | 'BC' | 'NGCR' | 'OTHER';

export const CATEGORY_NAMES: Record<string, string> = {
  FC: 'Foundation Core',
  DLES: 'Discipline-linked Engineering Sciences',
  DC: 'Discipline Core',
  DE: 'Discipline Elective',
  PI: 'Projects and Internship',
  OE: 'Open Elective',
  BC: 'Bridge Course',
  NGCR: 'Non-graded Core Requirement'
};

export const CATEGORY_PRIORITY: Record<string, number> = {
  FC: 1,
  DLES: 2,
  DC: 3,
  DE: 4,
  OE: 5,
  PI: 5,
  BC: 6,
  NGCR: 6
};

// Known course database extracted from official curriculum
export const CURRICULUM_DATA: Record<string, CurriculumCategoryCode> = {
  "ICHY101L": "FC", "ICHY101P": "FC", "ICSE101E": "FC", "ICSE102L": "FC", "ICSE102P": "FC",
  "ICSE103E": "FC", "IEEE102L": "FC", "IEEE102P": "FC", "IENG101L": "FC", "IENG101P": "FC",
  "IENG102P": "FC", "IFLE200L": "FC", "IHSM200L": "FC", "IMAT101L": "FC", "IMAT101P": "FC",
  "IMAT102L": "FC", "IMAT201L": "FC", "IMAT202L": "FC", "IPHY101L": "FC", "IPHY101P": "FC",
  "IPHY102L": "FC", "IPHY102P": "FC", "ISTS101P": "FC", "ISTS102P": "FC", "ISTS201P": "FC",
  "ISTS202P": "FC", "ISTS301P": "FC", "ISTS302P": "FC", "ISWE101L": "FC",

  "IMAT205L": "DLES", "ISWE201L": "DLES", "ISWE201P": "DLES", "ISWE401L": "DLES", "ISWE401P": "DLES",

  "ISWE102L": "DC", "ISWE102P": "DC", "ISWE103L": "DC", "ISWE103P": "DC", "ISWE202L": "DC",
  "ISWE203L": "DC", "ISWE204L": "DC", "ISWE204P": "DC", "ISWE205L": "DC", "ISWE205P": "DC",
  "ISWE206L": "DC", "ISWE206P": "DC", "ISWE301L": "DC", "ISWE301P": "DC", "ISWE302L": "DC",
  "ISWE303L": "DC", "ISWE303P": "DC", "ISWE304L": "DC", "ISWE304P": "DC", "ISWE305L": "DC",
  "ISWE306L": "DC", "ISWE402L": "DC", "ISWE403L": "DC", "ISWE404L": "DC", "ISWE405L": "DC",
  "ISWE406L": "DC", "ISWE406P": "DC", "ISWE407L": "DC", "ISWE407P": "DC",

  "ISWE208L": "DE", "ISWE209L": "DE", "ISWE210L": "DE", "ISWE307L": "DE", "ISWE308L": "DE",
  "ISWE309L": "DE", "ISWE310L": "DE", "ISWE311L": "DE", "ISWE312L": "DE", "ISWE313L": "DE",
  "ISWE314L": "DE", "ISWE391J": "DE", "ISWE392J": "DE", "ISWE393J": "DE", "ISWE394J": "DE",
  "ISWE396J": "DE", "ISWE397J": "DE", "ISWE398J": "DE", "ISWE408L": "DE", "ISWE409L": "DE",
  "ISWE410L": "DE", "ISWE411L": "DE", "ISWE412L": "DE", "ISWE413L": "DE", "ISWE414L": "DE",
  "ISWE415L": "DE", "ISWE416L": "DE", "ISWE417L": "DE", "ISWE418L": "DE", "ISWE419L": "DE",
  "ISWE420L": "DE", "ISWE421L": "DE", "ISWE422L": "DE", "ISWE423L": "DE", "ISWE424L": "DE",
  "ISWE425L": "DE", "ISWE426L": "DE", "ISWE427L": "DE",

  "ISWE399J": "PI", "ISWE498J": "PI", "ISWE499J": "PI"
};

export function cleanCourseCode(codeRaw: string): string {
  if (!codeRaw) return '';
  const str = String(codeRaw).trim().toUpperCase();
  const match = str.match(/\b([A-Z]{3,4}\d{3}[A-Z])\b/);
  if (match) return match[1];
  const prefix = str.split(/[-_\s:]/)[0];
  return prefix || str;
}

export function getCourseCategory(courseCode: string, fallbackCategory?: string): CurriculumCategoryCode {
  const code = cleanCourseCode(courseCode);
  if (CURRICULUM_DATA[code]) {
    return CURRICULUM_DATA[code];
  }

  if (code.startsWith('ISTS') || code.startsWith('HUM') || code.startsWith('ENG') || code.startsWith('CHY') || code.startsWith('PHY')) {
    return 'FC';
  }

  if (fallbackCategory) {
    const cat = String(fallbackCategory).toLowerCase();
    if (cat.includes('foundation')) return 'FC';
    if (cat.includes('linked') || cat.includes('dles') || cat.includes('engineering science')) return 'DLES';
    if (cat.includes('discipline core') || cat.includes('programme core') || cat === 'dc' || cat === 'pc') return 'DC';
    if (cat.includes('elective') || cat === 'de' || cat === 'pe') return 'DE';
    if (cat.includes('open') || cat === 'oe') return 'OE';
  }

  return 'DE';
}

export function getCategoryFullName(catCode: string): string {
  return CATEGORY_NAMES[catCode] || 'Discipline Elective';
}

export function getCourseCategoryPriority(courseCode: string, fallbackCategory?: string): number {
  const cat = getCourseCategory(courseCode, fallbackCategory);
  return CATEGORY_PRIORITY[cat] || 4;
}

export function isCoreCourse(courseCode: string, fallbackCategory?: string): boolean {
  const prio = getCourseCategoryPriority(courseCode, fallbackCategory);
  return prio <= 3; // FC (1), DLES (2), DC (3)
}
