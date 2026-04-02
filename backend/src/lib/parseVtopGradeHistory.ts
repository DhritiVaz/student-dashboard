import { load, type CheerioAPI } from "cheerio";
import { letterGradeToGradePoint } from "./vitGradeScale";

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

export function examMonthToSemesterLabel(examMonth: string): string {
  const m = examMonth.match(/^([A-Za-z]+)[- ](\d{4})$/);
  if (!m) return "";
  const month = m[1].toLowerCase();
  const year = parseInt(m[2]);
  if (["nov", "dec", "sep", "oct"].includes(month)) {
    return `Fall Semester ${year}-${String(year + 1).slice(-2)}`;
  }
  if (["jan", "feb", "mar", "apr", "may"].includes(month)) {
    return `Winter Semester ${year - 1}-${String(year).slice(-2)}`;
  }
  if (["jun", "jul", "aug"].includes(month)) {
    return `Summer Semester ${year}-${String(year + 1).slice(-2)}`;
  }
  return "";
}

function extractGpaFromCellText(cells: string[]): number | null {
  const j = cells.join(" ").toLowerCase();
  if (!/\bgpa\b/.test(j) && !/\bsgpa\b/.test(j) && !/\bcgpa\b/.test(j)) return null;
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

function looksLikeSemesterHeading(text: string): boolean {
  const t = text.trim();
  if (t.length < 6) return false;
  if (/^course code$/i.test(t)) return false;
  return /semester|trimester|monsoon|fall|winter|summer|academic|session|year|\d{2,4}\s*[-–]\s*\d{2,4}|\bodd\b|\beven\b/i.test(t);
}

function isLikelySemesterBannerRow(cells: string[]): boolean {
  const text = cells.map((c) => c.trim()).filter(Boolean).join(" ");
  if (text.length < 8) return false;
  if (findCourseCodeColumnIndex(cells) >= 0) return false;
  return looksLikeSemesterHeading(text);
}

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

function looksLikeVtopSessionDurationCell(s: string | undefined): boolean {
  if (!s || s.length < 8) return false;
  const t = s.trim();
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[-–]\s*\d{4}/i.test(t)) return true;
  if (/\d{4}\s*[-–]\s*\d{1,2}\s*[-–\s]*(?:[a-z]{3}|\d{1,2})/i.test(t)) return true;
  return false;
}

function isVitLetterGradeToken(s: string): boolean {
  const compact = s.replace(/\s/g, "").toUpperCase();
  if (!compact || /^\d/.test(compact)) return false;
  if (/^[SABCDEFI](?:\+|-)?$/.test(compact)) return true;
  if (/^(EX|W|I|AB|MP|RA|SA|PP|NP|P|N)$/.test(compact)) return true;
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

type GradeColumnMap = {
  courseCode: number;
  courseTitle: number;
  courseType?: number;
  credits: number;
  grade: number;
  gradePoint?: number;
  examMonth?: number;
  resultDeclared?: number;
  distribution?: number;
};

function normHeaderCell(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function tryInferGradeColumnMap(cells: string[]): GradeColumnMap | null {
  if (cells.length < 5) return null;
  // Reject rows where any cell is abnormally long — these are merged/colspan cells
  if (cells.some(c => c.length > 200)) return null;
  const h = cells.map(normHeaderCell);
  const joined = h.join(" ");

  const hasCourseCode = h.some((x) => /course\s*code/.test(x) || x === "code");
  const hasCredits = h.some((x) => /credit/.test(x) && !/grade/.test(x));
  const hasGrade = h.some((x) => x === "grade" || (/grade/.test(x) && !/point/.test(x) && !/credit/.test(x)));

  if (!hasCourseCode || !hasCredits || !hasGrade) return null;
  if (!/course/.test(joined)) return null;

  const find = (pred: (x: string) => boolean) => h.findIndex(pred);

  let codeI = find((x) => /course\s*code/.test(x));
  if (codeI < 0) codeI = find((x) => x === "code");

  const titleI = find((x) => /course\s*title/.test(x) || /^title$/.test(x) || /course\s*name/.test(x));
  const creditsI = find((x) => /credit/.test(x) && !/grade/.test(x));
  const gradeI = find((x) => x === "grade" || (/grade/.test(x) && !/point/.test(x) && !/credit/.test(x)));
  const gpI = find((x) => /grade\s*point/.test(x) || /^gp$/.test(x) || /^points?$/.test(x));
  const typeI = find((x) => /course\s*type/.test(x) || x === "type" || x === "category");
  const examMonthI = find((x) => /exam[\s_-]*month/i.test(x) || /^exam\s+month$/.test(x));
  const resultDeclaredI = find((x) => /result[\s_-]*declared/i.test(x));
  const distributionI = find((x) => /course[\s_-]*distribution/i.test(x) || x === "distribution");

  if (codeI < 0 || titleI < 0 || creditsI < 0 || gradeI < 0) return null;

  console.log("[GRADE PARSE] Column map — examMonth col:", examMonthI, "distribution col:", distributionI);
  console.log("[GRADE PARSE] Header cells:", h.slice(0, 10));
  return {
    courseCode: codeI,
    courseTitle: titleI,
    courseType: typeI >= 0 ? typeI : undefined,
    credits: creditsI,
    grade: gradeI,
    gradePoint: gpI >= 0 ? gpI : undefined,
    examMonth: examMonthI >= 0 ? examMonthI : undefined,
    resultDeclared: resultDeclaredI >= 0 ? resultDeclaredI : undefined,
    distribution: distributionI >= 0 ? distributionI : undefined,
  };
}

function parseMappedGradeRow(cells: string[], m: GradeColumnMap, sem: string): ParsedGradeCourse | null {
  const code = (cells[m.courseCode] ?? "").replace(/\s/g, "").trim();
  if (!code || !COURSE_CODE_RE.test(code)) return null;
  if (/^coursecode$/i.test(code)) return null;

  const courseName = (cells[m.courseTitle] ?? "").trim();
  const credits = parseFloatCreditOrGp(cells[m.credits]);
  const grade = ((cells[m.grade] ?? "").trim() || null) as string | null;
  const gradePoint = m.gradePoint != null ? parseFloatCreditOrGp(cells[m.gradePoint]) : null;
  const category = m.courseType != null ? (cells[m.courseType] ?? "").trim() || null : null;

  let semesterLabel = sem;
  if (m.examMonth != null) {
    const examMonth = (cells[m.examMonth] ?? "").trim();
    const derived = examMonthToSemesterLabel(examMonth);
    if (derived) semesterLabel = derived;
    else console.log("[GRADE PARSE] examMonth not converted:", examMonth, "course:", code);
  }

  const distribution = m.distribution != null ? (cells[m.distribution] ?? "").trim() || null : null;

  return finalizeParsedGradeRow({
    semesterLabel,
    courseCode: code,
    courseName,
    credits,
    grade,
    gradePoint,
    faculty: distribution,
    slot: null,
    category,
  });
}

function normalizeParsedGradeCourseRow(row: ParsedGradeCourse, cells: string[]): ParsedGradeCourse {
  const parts = cells.map((c) => c.replace(/\s+/g, " ").trim()).filter((c) => c.length > 0);
  if (parts.length === 0) return row;

  const letterIdx = parts.findIndex((c) => isVitLetterGradeToken(c));
  const letter = letterIdx >= 0 ? parts[letterIdx].replace(/\s/g, "").toUpperCase() : null;

  const gradeStr = row.grade?.trim() ?? "";
  const parsedNum = parseFloatCreditOrGp(gradeStr);
  const numericGradeLooksLikeCredit =
    gradeStr.length > 0 && /^[\d.,]+\s*$/.test(gradeStr) && parsedNum != null && parsedNum > 0 && parsedNum <= 24;
  const gpMatchesNumericGradeBug =
    row.gradePoint != null && parsedNum != null && Math.abs(row.gradePoint - parsedNum) < 0.001;
  const gradeFieldIsDuration = gradeStr.length > 0 && looksLikeVtopSessionDurationCell(gradeStr);

  if (letter) {
    if (numericGradeLooksLikeCredit || gpMatchesNumericGradeBug || row.credits == null || gradeFieldIsDuration) {
      let creditVal = row.credits ?? (numericGradeLooksLikeCredit ? parsedNum : null);
      if (creditVal == null && letterIdx > 0) {
        for (let j = letterIdx - 1; j >= 0; j--) {
          const v = parseFloatCreditOrGp(parts[j]);
          if (v != null && v > 0 && v <= 24) { creditVal = v; break; }
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
      return finalizeParsedGradeRow({ ...row, credits: creditVal ?? row.credits, grade: letter, gradePoint: gp });
    }
  }
  return finalizeParsedGradeRow(row);
}

function parseCourseRowFromCells(cells: string[], currentSem: string): ParsedGradeCourse | null {
  const codeIdx = findCourseCodeColumnIndex(cells);
  if (codeIdx < 0) return null;
  const courseCode = cells[codeIdx].replace(/\s/g, "");
  if (!courseCode || /^coursecode$/i.test(courseCode)) return null;
  const tail = cells.slice(codeIdx + 1).map((c) => c.replace(/\s+/g, " ").trim());
  const courseName = (tail[0] ?? "").trim();
  const credits = parseFloatCreditOrGp(tail[1]);
  const grade = (tail[2] ?? "").trim() || null;
  const gradePoint = parseFloatCreditOrGp(tail[3]);
  const faculty = (tail[4] ?? "").trim() || null;
  const slot = (tail[5] ?? "").trim() || null;
  const category = (tail[6] ?? "").trim() || null;
  return normalizeParsedGradeCourseRow({ semesterLabel: currentSem, courseCode, courseName, credits, grade, gradePoint, faculty, slot, category }, cells);
}

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
    if (/^reg\.?no\.?$/i.test(n) || /^CH\d{8,}/i.test(n) || /^course/i.test(n) || n.length < 5) return;
    if (!semesterOrder.includes(n)) semesterOrder.push(n);
    currentSem = n;
  }

  function processTableRows($table: any, initialSem: string) {
    let sem = initialSem;
    let columnMap: GradeColumnMap | null = null;

    $table.find("tr").each((_i: number, row: any) => {
      const cells = $(row).find("td, th").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get();
      if (cells.length === 0) return;

      // ALWAYS try column map detection first
      const headerMap = tryInferGradeColumnMap(cells);
      if (headerMap) {
        columnMap = headerMap;
        return;
      }

      const singleBanner =
        cells.length <= 2 && cells.join(" ").length < 180 &&
        findCourseCodeColumnIndex(cells) < 0 && looksLikeSemesterHeading(cells.join(" "));
      if (singleBanner) {
        pushSemester(cells.map((c) => c.trim()).filter(Boolean).join(" "));
        sem = currentSem; columnMap = null; return;
      }

      if (cells.length <= 3) {
        const gpaHere = extractGpaFromCellText(cells);
        if (gpaHere != null) { if (currentSem) semesterGpas.set(currentSem, gpaHere); return; }
        return;
      }

      if (isLikelySemesterBannerRow(cells)) {
        pushSemester(cells.map((c) => c.trim()).filter(Boolean)[0]);
        sem = currentSem; columnMap = null; return;
      }

      const gpaInWideRow = extractGpaFromCellText(cells);
      if (gpaInWideRow != null && findCourseCodeColumnIndex(cells) < 0) {
        if (currentSem) semesterGpas.set(currentSem, gpaInWideRow); return;
      }

      if (columnMap) {
        const mapped = parseMappedGradeRow(cells, columnMap, sem);
        if (mapped) {
          if (mapped.semesterLabel && mapped.semesterLabel !== "Unknown") {
            if (!semesterOrder.includes(mapped.semesterLabel)) semesterOrder.push(mapped.semesterLabel);
          }
          rows.push(mapped); return;
        }
      }

      const course = parseCourseRowFromCells(cells, sem);
      if (course) { rows.push(course); return; }
    });
  }

  $("table").each((_, tableEl) => {
  const $table = $(tableEl);
  // Don't inherit junk semester labels between tables
  if (currentSem === "Unknown" || /^reg\.?no\.?$/i.test(currentSem)) {
    currentSem = normVtopSemesterLabel(null);
  }
  let initialSem = currentSem;
    let sib: ReturnType<typeof $> = $table.prev();
    for (let hop = 0; hop < 8 && sib.length; hop++) {
      if (sib.is("h1,h2,h3,h4,h5,h6")) {
        const t = sib.text().trim();
        if (looksLikeSemesterHeading(t)) { pushSemester(t); initialSem = currentSem; }
        break;
      }
      if (sib.is("div")) {
        const t = sib.text().replace(/\s+/g, " ").trim();
        if (t.length > 5 && t.length < 200 && looksLikeSemesterHeading(t)) {
          pushSemester(t); initialSem = currentSem; break;
        }
      }
      sib = sib.prev();
    }
    processTableRows($table, initialSem);
  });

  if (rows.length > 0 && semesterOrder.length === 0) semesterOrder.push(currentSem);

  const semesters: ParsedSemesterSummary[] = semesterOrder.map((label, i) => ({
    semesterLabel: label, gpaFromPortal: semesterGpas.get(label) ?? null, sortIndex: i,
  }));

  return { cgpaFromPortal, rows, semesters };
}

export function buildSemesterSummariesFromCourses(rows: ParsedGradeCourse[], gpas: Map<string, number>): ParsedSemesterSummary[] {
  const order: string[] = [];
  for (const r of rows) {
    const L = normVtopSemesterLabel(r.semesterLabel);
    if (!order.includes(L)) order.push(L);
  }
  return order.map((label, i) => ({ semesterLabel: label, gpaFromPortal: gpas.get(label) ?? null, sortIndex: i }));
}

export function legacyParseVtopGradeRows($: CheerioAPI): ParsedGradeCourse[] {
  const rows: ParsedGradeCourse[] = [];
  let currentSem = normVtopSemesterLabel(null);

  $("table tr").each((_, row) => {
    const cells = $(row).find("td").map((_, td) => $(td).text().replace(/\s+/g, " ").trim()).get();
    if (cells.length === 0) return;

    if (cells.length <= 3) {
      const text = cells.join(" ").replace(/\s+/g, " ").trim();
      if (text.length > 3 && !/^course code$/i.test(text) && !/credit/i.test(text) && !/^\d+$/.test(cells[0] || "")) {
        const looksLikeCode = COURSE_CODE_RE.test((cells[1] || cells[0] || "").replace(/\s/g, ""));
        if (!looksLikeCode && !extractGpaFromCellText(cells)) currentSem = normVtopSemesterLabel(text);
      }
      return;
    }

    if (cells.map((c) => c.trim().toLowerCase()).some((c) => c === "sl.no" || c === "sl no" || c === "s.no")) return;

    const course = parseCourseRowFromCells(cells, currentSem);
    if (course) rows.push(course);
  });

  return rows.map((r) => finalizeParsedGradeRow(r));
}