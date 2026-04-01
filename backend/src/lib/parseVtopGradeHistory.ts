import { load, type CheerioAPI } from "cheerio";
import { letterGradeToGradePoint } from "./vitGradeScale";

/** VIT-style course codes: CSE1001, BMAT202P, STS3021, BSTS101L, etc. */
const COURSE_CODE_RE = /^[A-Z]{2,10}\d{2,}[A-Z0-9]*$/i;

export function normVtopSemesterLabel(s: string | null | undefined): string {
  const t = (s ?? "").trim().slice(0, 120);
  return t || "Unknown";
}

export type ParsedGradeCourse = {
  semesterLabel: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  grade: string | null;
  gradePoint: number | null;
  faculty: string | null;
  slot: string | null;
  category: string | null;
};

export type ParsedSemesterSummary = {
  semesterLabel: string;
  gpaFromPortal: number | null;
  sortIndex: number;
};

export type ParsedGradeHistory = {
  cgpaFromPortal: number | null;
  rows: ParsedGradeCourse[];
  semesters: ParsedSemesterSummary[];
};

function extractGpaFromCellText(cells: string[]): number | null {
  const j = cells.join(" ").toLowerCase();
  if (!/\bgpa\b/.test(j) && !/\bsgpa\b/.test(j)) return null;
  const m = j.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v) || v < 0 || v > 10.5) return null;
  return v;
}

function parseCgpaFromFullText(text: string): number | null {
  const compact = text.replace(/\s+/g, " ");
  const patterns = [
    /CGPA\s*[-–—:=,]?\s*(\d+(?:\.\d+)?)/i,
    /CGPA\s*(\d+(?:\.\d+)?)/i,
    /Cumulative\s+Grade\s+Point\s+Average\s*[-–—:=,]?\s*(\d+(?:\.\d+)?)/i,
    /Cumulative\s+GPA\s*[-–—:=,]?\s*(\d+(?:\.\d+)?)/i,
    /Overall\s+CGPA\s*[-–—:=,]?\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const p of patterns) {
    const m = compact.match(p);
    if (m) {
      const v = parseFloat(m[1]);
      if (Number.isFinite(v) && v >= 0 && v <= 10.5) return v;
    }
  }
  return null;
}

function isLikelyTableHeaderRow(cells: string[]): boolean {
  const lower = cells.map((c) => c.trim().toLowerCase());
  const joined = lower.join(" ");
  if (/course code/.test(joined) && (/credit/.test(joined) || /title/.test(joined) || /grade/.test(joined))) {
    return true;
  }
  if (lower.some((c) => c === "sl.no" || c === "sl no" || c === "s.no")) {
    return true;
  }
  return false;
}

function looksLikeSemesterHeading(text: string): boolean {
  const t = text.trim();
  if (t.length < 6) return false;
  if (/^course code$/i.test(t)) return false;
  return /semester|trimester|monsoon|fall|winter|summer|academic|session|year|\d{2,4}\s*[-–]\s*\d{2,4}|\bodd\b|\beven\b/i.test(
    t
  );
}

function isLikelySemesterBannerRow(cells: string[]): boolean {
  const text = cells.map((c) => c.trim()).filter(Boolean).join(" ");
  if (text.length < 8) return false;
  if (findCourseCodeColumnIndex(cells) >= 0) return false;
  return looksLikeSemesterHeading(text);
}

/** First column index whose text looks like a VIT course code (ignoring Sl.No digits). */
function findCourseCodeColumnIndex(cells: string[]): number {
  for (let i = 0; i < cells.length; i++) {
    const raw = cells[i].replace(/\s/g, "");
    if (!raw) continue;
    if (/^coursecode$/i.test(raw)) continue;
    if (/^sl\.?no\.?$/i.test(raw.replace(/\./g, ""))) continue;
    if (COURSE_CODE_RE.test(raw)) return i;
  }
  return -1;
}

function parseFloatCreditOrGp(s: string | undefined): number | null {
  if (s == null || !String(s).trim()) return null;
  const v = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

/** VTOP grade tables often include a session column, e.g. "Apr-2025 - 02-Jun-2025", between title and credits. */
function looksLikeVtopSessionDurationCell(s: string | undefined): boolean {
  if (!s || s.length < 8) return false;
  const t = s.trim();
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[-–]\s*\d{4}/i.test(t)) return true;
  if (/\d{4}\s*[-–]\s*\d{1,2}\s*[-–\s]*(?:[a-z]{3}|\d{1,2})/i.test(t)) return true;
  if (
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t) &&
    /[-–]/.test(t) &&
    /\d{4}/.test(t)
  ) {
    return true;
  }
  return false;
}

function isVitLetterGradeToken(s: string): boolean {
  const compact = s.replace(/\s/g, "").toUpperCase();
  if (!compact || /^\d/.test(compact)) return false;
  if (/^[SABCDEFI](?:\+|-)?$/.test(compact)) return true;
  if (/^(EX|W|I|AB|MP|RA|SA|PP|NP|P)$/.test(compact)) return true;
  if (compact === "PASS" || compact === "FAIL") return true;
  return false;
}

function finalizeParsedGradeRow(c: ParsedGradeCourse): ParsedGradeCourse {
  if (c.gradePoint == null && c.grade) {
    const gp = letterGradeToGradePoint(c.grade);
    if (gp != null) return { ...c, gradePoint: gp };
  }
  return c;
}

/**
 * Fix rows where a session/duration column shifted indices so credits landed in `grade`
 * (numeric "3" was interpreted as grade points via letterGradeToGradePoint).
 */
function normalizeParsedGradeCourseRow(row: ParsedGradeCourse, cells: string[]): ParsedGradeCourse {
  const parts = cells.map((c) => c.replace(/\s+/g, " ").trim()).filter((c) => c.length > 0);
  if (parts.length === 0) return row;

  const letterIdx = parts.findIndex((c) => isVitLetterGradeToken(c));
  const letter = letterIdx >= 0 ? parts[letterIdx].replace(/\s/g, "").toUpperCase() : null;

  const gradeStr = row.grade?.trim() ?? "";
  const parsedNum = parseFloatCreditOrGp(gradeStr);
  const numericGradeLooksLikeCredit =
    gradeStr.length > 0 &&
    /^[\d.,]+\s*$/.test(gradeStr) &&
    parsedNum != null &&
    parsedNum > 0 &&
    parsedNum <= 24;

  const gpMatchesNumericGradeBug =
    row.gradePoint != null &&
    parsedNum != null &&
    Math.abs(row.gradePoint - parsedNum) < 0.001;

  const gradeFieldIsDuration = gradeStr.length > 0 && looksLikeVtopSessionDurationCell(gradeStr);

  if (letter) {
    if (numericGradeLooksLikeCredit || gpMatchesNumericGradeBug || row.credits == null || gradeFieldIsDuration) {
      let creditVal = row.credits ?? (numericGradeLooksLikeCredit ? parsedNum : null);
      if (creditVal == null && letterIdx > 0) {
        for (let j = letterIdx - 1; j >= 0; j--) {
          const v = parseFloatCreditOrGp(parts[j]);
          if (v != null && v > 0 && v <= 24) {
            creditVal = v;
            break;
          }
        }
      }

      let gp: number | null = row.gradePoint;
      if (letterIdx >= 0 && letterIdx + 1 < parts.length) {
        const after = parseFloatCreditOrGp(parts[letterIdx + 1]);
        if (after != null && after >= 0 && after <= 10) gp = after;
      }
      if (gp == null || gpMatchesNumericGradeBug) {
        const fromLetter = letterGradeToGradePoint(letter);
        if (fromLetter != null) gp = fromLetter;
      }

      let slot: string | null = row.slot;
      let faculty: string | null = row.faculty;
      const durationParts: string[] = [];
      for (const p of parts) {
        if (looksLikeVtopSessionDurationCell(p)) durationParts.push(p);
      }
      if (durationParts.length > 0) {
        slot = [slot, ...durationParts].filter(Boolean).join("; ") || null;
      }
      if (faculty && looksLikeVtopSessionDurationCell(faculty)) {
        faculty = null;
      }

      for (let k = letterIdx + 2; k < parts.length; k++) {
        const p = parts[k];
        if (looksLikeVtopSessionDurationCell(p)) continue;
        if (/^\d+$/.test(p) && p.length <= 2) continue;
        const asNum = parseFloatCreditOrGp(p);
        if (asNum != null && asNum === creditVal) continue;
        if (isVitLetterGradeToken(p)) continue;
        if (asNum != null && asNum >= 0 && asNum <= 10) continue;
        if (!faculty && p.length > 2) {
          faculty = p;
          break;
        }
      }

      return finalizeParsedGradeRow({
        ...row,
        credits: creditVal ?? row.credits,
        grade: letter,
        gradePoint: gp,
        faculty,
        slot,
      });
    }
  }

  let out = row;
  if (out.faculty && looksLikeVtopSessionDurationCell(out.faculty)) {
    out = {
      ...out,
      faculty: null,
      slot: [out.slot, out.faculty].filter(Boolean).join("; ") || null,
    };
  }
  const durationParts = parts.filter((p) => looksLikeVtopSessionDurationCell(p));
  if (durationParts.length > 0) {
    out = {
      ...out,
      slot: [out.slot, ...durationParts].filter(Boolean).join("; ") || null,
    };
  }
  return finalizeParsedGradeRow(out);
}

function parseCourseRowFromCells(cells: string[], currentSem: string): ParsedGradeCourse | null {
  const codeIdx = findCourseCodeColumnIndex(cells);
  if (codeIdx < 0) return null;

  const courseCode = cells[codeIdx].replace(/\s/g, "");
  if (!courseCode || /^coursecode$/i.test(courseCode)) return null;

  const tail = cells.slice(codeIdx + 1).map((c) => c.replace(/\s+/g, " ").trim());
  const courseName = (tail[0] ?? "").trim();

  // Title | session dates | credits | grade | grade point | … (common on VTOP CC semester view)
  if (tail.length >= 5 && looksLikeVtopSessionDurationCell(tail[1])) {
    const creditsD = parseFloatCreditOrGp(tail[2]);
    const gradeD = ((tail[3] ?? "").trim() || null) as string | null;
    const gpD = parseFloatCreditOrGp(tail[4]);
    const raw: ParsedGradeCourse = {
      semesterLabel: currentSem,
      courseCode,
      courseName,
      credits: creditsD,
      grade: gradeD,
      gradePoint: gpD,
      faculty: (tail[5] ?? "").trim() || null,
      slot: (tail[1] ?? "").trim() || null,
      category: null,
    };
    return normalizeParsedGradeCourseRow(raw, cells);
  }

  const credits = parseFloatCreditOrGp(tail[1]);
  const grade = (tail[2] ?? "").trim() || null;
  const gradePoint = parseFloatCreditOrGp(tail[3]);
  let faculty: string | null = (tail[4] ?? "").trim() || null;
  let slot: string | null = (tail[5] ?? "").trim() || null;
  let category: string | null = (tail[6] ?? "").trim() || null;

  // Alternate layout: Type column before credits (Code | Title | TH | 4 | A | 9)
  if (
    credits == null &&
    grade == null &&
    gradePoint == null &&
    tail.length >= 5 &&
    !/^\d/.test(tail[1] ?? "")
  ) {
    const c2 = parseFloatCreditOrGp(tail[2]);
    const g2 = (tail[3] ?? "").trim() || null;
    const gp2 = parseFloatCreditOrGp(tail[4]);
    if (c2 != null || g2 || gp2 != null) {
      return normalizeParsedGradeCourseRow(
        {
          semesterLabel: currentSem,
          courseCode,
          courseName,
          credits: c2,
          grade: g2,
          gradePoint: gp2,
          faculty: (tail[5] ?? "").trim() || null,
          slot: (tail[6] ?? "").trim() || null,
          category: (tail[1] ?? "").trim() || null,
        },
        cells
      );
    }
  }

  return normalizeParsedGradeCourseRow(
    {
      semesterLabel: currentSem,
      courseCode,
      courseName,
      credits,
      grade,
      gradePoint,
      faculty,
      slot,
      category,
    },
    cells
  );
}

type GradeColumnMap = {
  courseCode: number;
  courseTitle: number;
  courseType?: number;
  credits: number;
  grade: number;
  gradePoint?: number;
};

function normHeaderCell(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Detect Sl.No | Course Code | Title | Type | Credits | Grade | Grade Point | … header row. */
function tryInferGradeColumnMap(cells: string[]): GradeColumnMap | null {
  if (cells.length < 5) return null;
  const h = cells.map(normHeaderCell);
  const joined = h.join(" | ");
  if (!/course/.test(joined)) return null;
  const looksLikeHeader =
    h.some((x) => /course\s*code/.test(x) || x === "code") &&
    h.some((x) => /credit/.test(x)) &&
    h.some((x) => /grade/.test(x));
  if (!looksLikeHeader) return null;

  const find = (pred: (x: string) => boolean) => h.findIndex(pred);

  let codeI = find((x) => /course\s*code/.test(x));
  if (codeI < 0) codeI = find((x) => x === "code");

  const titleI = find(
    (x) => /course\s*title/.test(x) || /^title$/.test(x) || /course\s*name/.test(x)
  );
  let creditsI = find((x) => /credit/.test(x) && !/grade/.test(x));
  let gradeI = find(
    (x) =>
      x === "grade" ||
      (/grade/.test(x) && !/point/.test(x) && !/credit/.test(x))
  );
  const gpI = find((x) => /grade\s*point/.test(x) || /^gp$/.test(x) || /^points?$/.test(x));
  const typeI = find((x) => /course\s*type/.test(x) || x === "type" || x === "category");

  if (codeI < 0 || titleI < 0 || creditsI < 0 || gradeI < 0) return null;

  return {
    courseCode: codeI,
    courseTitle: titleI,
    courseType: typeI >= 0 ? typeI : undefined,
    credits: creditsI,
    grade: gradeI,
    gradePoint: gpI >= 0 ? gpI : undefined,
  };
}

function parseMappedGradeRow(cells: string[], m: GradeColumnMap, sem: string): ParsedGradeCourse | null {
  const code = (cells[m.courseCode] ?? "").replace(/\s/g, "").trim();
  if (!code || !COURSE_CODE_RE.test(code)) return null;
  if (/^coursecode$/i.test(code)) return null;

  const courseName = (cells[m.courseTitle] ?? "").trim();
  const credits = parseFloatCreditOrGp(cells[m.credits]);
  const grade = ((cells[m.grade] ?? "").trim() || null) as string | null;
  const gradePoint =
    m.gradePoint != null ? parseFloatCreditOrGp(cells[m.gradePoint]) : null;
  const category = m.courseType != null ? (cells[m.courseType] ?? "").trim() || null : null;

  return normalizeParsedGradeCourseRow(
    {
      semesterLabel: sem,
      courseCode: code,
      courseName,
      credits,
      grade,
      gradePoint,
      faculty: null,
      slot: null,
      category,
    },
    cells
  );
}

/**
 * Parse VTOP grade history HTML: all semester sections, course rows, optional CGPA / semester GPA lines.
 * Handles (1) headings before each table (examinations view), (2) Sl.No + header row column maps, (3) colspan semester banners.
 */
export function parseVtopGradeHistoryHtml(html: string): ParsedGradeHistory {
  const $ = load(html);
  const bodyText = $("body").text();
  const cgpaFromPortal = parseCgpaFromFullText(bodyText);

  const rows: ParsedGradeCourse[] = [];
  const semesterOrder: string[] = [];
  const semesterGpas = new Map<string, number>();
  let currentSem = normVtopSemesterLabel(null);

  function pushSemester(raw: string) {
    const n = normVtopSemesterLabel(raw);
    if (!semesterOrder.includes(n)) semesterOrder.push(n);
    currentSem = n;
  }

  function processTableRows($table: any, initialSem: string) {
    let sem = initialSem;
    let columnMap: GradeColumnMap | null = null;

    $table.find("tr").each((_i: number, row: any) => {
      const cells = $(row)
        .find("td, th")
        .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
        .get();
      if (cells.length === 0) return;

      const singleBanner =
        cells.length <= 2 &&
        cells.join(" ").length < 180 &&
        findCourseCodeColumnIndex(cells) < 0 &&
        looksLikeSemesterHeading(cells.join(" "));
      if (singleBanner) {
        const joined = cells.map((c) => c.trim()).filter(Boolean).join(" ");
        pushSemester(joined);
        sem = currentSem;
        columnMap = null;
        return;
      }

      if (cells.length <= 3) {
        const gpaHere = extractGpaFromCellText(cells);
        if (gpaHere != null) {
          if (currentSem) semesterGpas.set(currentSem, gpaHere);
          return;
        }
        const joined = cells.join(" ").replace(/\s+/g, " ").trim();
        if (joined.length < 6) return;
        if (/^course code$/i.test(joined) || /^credit/i.test(joined)) return;
        if (/^\d+$/.test(cells[0] || "")) return;
        const looksLikeCode = COURSE_CODE_RE.test((cells[1] || cells[0] || "").replace(/\s/g, ""));
        if (looksLikeCode) return;
        if (looksLikeSemesterHeading(joined)) {
          pushSemester(joined);
          sem = currentSem;
          columnMap = null;
        }
        return;
      }

      const headerMap = tryInferGradeColumnMap(cells);
      if (headerMap) {
        columnMap = headerMap;
        return;
      }

      if (isLikelyTableHeaderRow(cells)) {
        columnMap = null;
        return;
      }

      if (isLikelySemesterBannerRow(cells)) {
        pushSemester(cells.map((c) => c.trim()).filter(Boolean)[0]);
        sem = currentSem;
        columnMap = null;
        return;
      }

      const gpaInWideRow = extractGpaFromCellText(cells);
      if (gpaInWideRow != null && findCourseCodeColumnIndex(cells) < 0) {
        if (currentSem) semesterGpas.set(currentSem, gpaInWideRow);
        return;
      }

      if (columnMap) {
        const mapped = parseMappedGradeRow(cells, columnMap, sem);
        if (mapped) {
          rows.push(mapped);
          return;
        }
      }

      const course = parseCourseRowFromCells(cells, sem);
      if (course) {
        rows.push(course);
        return;
      }

      const joinedWide = cells.join(" ").trim();
      if (
        joinedWide.length >= 12 &&
        /semester|fall|winter|summer|monsoon/i.test(joinedWide) &&
        findCourseCodeColumnIndex(cells) < 0
      ) {
        pushSemester(joinedWide);
        sem = currentSem;
        columnMap = null;
      }
    });
  }

  $("table").each((_, tableEl) => {
    const $table = $(tableEl);
    let initialSem = currentSem;

    let sib: ReturnType<typeof $> = $table.prev();
    for (let hop = 0; hop < 8 && sib.length; hop++) {
      if (sib.is("h1,h2,h3,h4,h5,h6")) {
        const t = sib.text().trim();
        if (looksLikeSemesterHeading(t)) {
          pushSemester(t);
          initialSem = currentSem;
        }
        break;
      }
      if (sib.is("div")) {
        const t = sib.text().replace(/\s+/g, " ").trim();
        if (t.length > 5 && t.length < 200 && looksLikeSemesterHeading(t)) {
          pushSemester(t);
          initialSem = currentSem;
          break;
        }
      }
      sib = sib.prev();
    }

    processTableRows($table, initialSem);
  });

  if (rows.length > 0 && semesterOrder.length === 0) {
    semesterOrder.push(currentSem);
  }

  const semesters: ParsedSemesterSummary[] = semesterOrder.map((label, i) => ({
    semesterLabel: label,
    gpaFromPortal: semesterGpas.get(label) ?? null,
    sortIndex: i,
  }));

  return { cgpaFromPortal, rows, semesters };
}

/** When only legacy course rows are available, rebuild semester list and optional GPA map. */
export function buildSemesterSummariesFromCourses(
  rows: ParsedGradeCourse[],
  gpas: Map<string, number>
): ParsedSemesterSummary[] {
  const order: string[] = [];
  for (const r of rows) {
    const L = normVtopSemesterLabel(r.semesterLabel);
    if (!order.includes(L)) order.push(L);
  }
  return order.map((label, i) => ({
    semesterLabel: label,
    gpaFromPortal: gpas.get(label) ?? null,
    sortIndex: i,
  }));
}

/** Fallback when structured parse finds no rows (alternate table layout). */
export function legacyParseVtopGradeRows($: CheerioAPI): ParsedGradeCourse[] {
  const rows: ParsedGradeCourse[] = [];
  let currentSem = normVtopSemesterLabel(null);

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((_, td) => $(td).text().replace(/\s+/g, " ").trim())
      .get();
    if (cells.length === 0) return;

    if (cells.length <= 3) {
      const text = cells.join(" ").replace(/\s+/g, " ").trim();
      if (
        text.length > 3 &&
        !/^course code$/i.test(text) &&
        !/credit/i.test(text) &&
        !/^\d+$/.test(cells[0] || "")
      ) {
        const looksLikeCode = COURSE_CODE_RE.test((cells[1] || cells[0] || "").replace(/\s/g, ""));
        if (!looksLikeCode && !extractGpaFromCellText(cells)) {
          currentSem = normVtopSemesterLabel(text);
        }
      }
      return;
    }

    if (isLikelyTableHeaderRow(cells)) return;

    const course = parseCourseRowFromCells(cells, currentSem);
    if (course) {
      rows.push(course);
    }
  });

  return rows.map((r) => finalizeParsedGradeRow(r));
}
