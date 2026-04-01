import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { load } from "cheerio";
import { prisma } from "../lib/prisma";
import { effectiveGradePoint } from "../lib/vitGradeScale";
import { parseVtopMarksTableHtml } from "../lib/parseVtopMarksTable";
import {
  parseVtopGradeHistoryHtml,
  legacyParseVtopGradeRows,
  normVtopSemesterLabel,
  buildSemesterSummariesFromCourses,
  type ParsedGradeHistory,
  type ParsedGradeCourse,
} from "../lib/parseVtopGradeHistory";
import { parseSemesterSelectOptions } from "../lib/parseVtopSemesterDropdown";

puppeteerExtra.use(StealthPlugin());

const VTOP_BASE = "https://vtopcc.vit.ac.in/vtop";
const TIMEOUT = 60000;

interface VtopSession { browser: any; page: any; createdAt: number; }
const sessions = new Map<string, VtopSession>();

/** Captcha on VTOP is bound to this browser tab; keep alive long enough to type + sync. */
const CAPTCHA_BROWSER_TTL_MS = 25 * 60 * 1000;

function clearSession(userId: string) {
  const session = sessions.get(userId);
  if (session) { session.browser.close().catch(() => {}); sessions.delete(userId); }
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.createdAt > CAPTCHA_BROWSER_TTL_MS) clearSession(userId);
  }
}, 60 * 1000);

export interface VtopSyncResult {
  attendance: number;
  grades: number;
  courses: number;
  academicEvents: number;
  timetable: number;
  marks: number;
  message: string;
}

export interface VtopCaptchaResult {
  hasCaptcha: boolean;
  captchaImage?: string;
}

export async function getVtopCaptcha(userId: string): Promise<VtopCaptchaResult> {
  clearSession(userId);
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${VTOP_BASE}/login`, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  const studentCard = await page.$(".cardStudent");
  if (studentCard) { await studentCard.click(); await new Promise(r => setTimeout(r, 2000)); }
  sessions.set(userId, { browser, page, createdAt: Date.now() });
  const captchaInput = await page.$('input[name="captchaStr"]');
  if (!captchaInput) return { hasCaptcha: false };
  const captchaImage = await page.evaluate(() => {
    const img = document.querySelector('img[aria-describedby="button-addon2"]') as HTMLImageElement;
    if (!img) return null;
    return img.src.replace("data:image/jpeg;base64,", "");
  });
  if (!captchaImage) return { hasCaptcha: false };
  return { hasCaptcha: true, captchaImage };
}

export async function syncVtopData(userId: string, username: string, password: string, captchaStr?: string): Promise<VtopSyncResult> {
  let session = sessions.get(userId);
  const reusedCaptchaBrowser = !!session;
  if (session) {
    session.createdAt = Date.now();
  }

  let page: any, browser: any;

  if (session) {
    page = session.page; browser = session.browser;
  } else {
    browser = await puppeteerExtra.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${VTOP_BASE}/login`, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 2000));
    const studentCard = await page.$(".cardStudent");
    if (studentCard) { await studentCard.click(); await new Promise(r => setTimeout(r, 2000)); }
  }

  try {
    const captchaTrimmed = captchaStr?.trim();
    if (captchaTrimmed && !reusedCaptchaBrowser) {
      throw new Error(
        "VTOP captcha only works for the same browser session that showed the image. Click “Connect VTOP” again, enter the new captcha, then “Sync Now” (do not wait longer than ~25 minutes)."
      );
    }

    await page.waitForSelector("#username", { visible: true });
    await page.click("#username", { clickCount: 3 });
    await page.type("#username", username, { delay: 50 });
    await page.click("#password", { clickCount: 3 });
    await page.type("#password", password, { delay: 50 });

    if (captchaTrimmed) {
      const captchaInput = await page.$('input[name="captchaStr"]');
      if (captchaInput) {
        await page.click('input[name="captchaStr"]', { clickCount: 3 });
        await page.type('input[name="captchaStr"]', captchaTrimmed, { delay: 50 });
      }
    }

    await page.click("#submitBtn");
    await Promise.race([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: TIMEOUT }),
      new Promise(resolve => setTimeout(resolve, 8000))
    ]);
    await new Promise((r) => setTimeout(r, 500));

    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const onLoginUrl = /\/login(\/|$|\?|#)/i.test(page.url() || "");
    const authFailureHints =
      /invalid|incorrect|failed|wrong|error|unable\s+to\s+login|captcha|mismatch|try\s+again/i;
    if (authFailureHints.test(bodyText)) {
      if (/captcha|mismatch|wrong/i.test(bodyText)) {
        throw new Error(
          "VTOP rejected the login (often wrong or expired captcha). Click “Refresh Captcha”, enter it again, and sync immediately."
        );
      }
      throw new Error("Invalid VTOP credentials or login blocked. Check username, password, and captcha.");
    }
    if (onLoginUrl) {
      throw new Error(
        "VTOP kept you on the login page. Refresh captcha, try again, or click “Connect VTOP” if your session expired."
      );
    }

    await gotoAuthenticatedVtopShell(page);
    const authorizedID = await readAuthorizedIdFromPage(page, username.trim().toUpperCase());

    // Detect semester ID dynamically
    const semesterSubId = getDefaultSemesterSubId();
    console.log("Using semesterSubId:", semesterSubId, "authorizedID:", authorizedID);

    const semesterOptions = await discoverVtopSemesterOptions(page, authorizedID, semesterSubId);
    console.log(
      "[VTOP] Semester dropdown / fallback options:",
      semesterOptions.length,
      semesterOptions.map((o) => o.value).join(", ")
    );

    const attendanceCount = await scrapeAttendance(page, userId, authorizedID, semesterSubId);
    const timetableCount = await scrapeTimetable(page, userId, authorizedID, semesterOptions, semesterSubId);
    const gradesCount = await scrapeGrades(page, userId, authorizedID, semesterOptions, semesterSubId);
    await applyTimetableSemesterFallback(userId);
    await refreshVtopGradeMetricsFromDb(userId);
    const academicEventsCount = await scrapeAcademicCalendar(page, userId, authorizedID, semesterSubId);
    const marksCount = await scrapeMarks(page, userId, authorizedID);
    const { semesters: semUpserted, courses: courseUpserted } =
      await syncSemestersAndCoursesFromVtop(userId);

    const coreRows = attendanceCount + gradesCount + timetableCount + marksCount;
    if (coreRows === 0) {
      throw new Error(
        "VTOP accepted login but returned no attendance, grades, timetable, or marks. " +
          "Try captcha again, confirm the correct semester on VTOP, or check whether the portal layout changed."
      );
    }

    return {
      attendance: attendanceCount,
      grades: gradesCount,
      courses: courseUpserted,
      academicEvents: academicEventsCount,
      timetable: timetableCount,
      marks: marksCount,
      message: `Synced ${attendanceCount} attendance, ${gradesCount} grades, ${semUpserted} new semesters, ${courseUpserted} course rows, ${timetableCount} timetable, ${marksCount} marks, ${academicEventsCount} calendar events`,
    };
  } finally {
    clearSession(userId);
  }
}

function getDefaultSemesterSubId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const shortYear = String(year).slice(2); // "26"
  const prevYear = year - 1;              // 2025

  if (month >= 1 && month <= 5) {
    return `CH${prevYear}${shortYear}05`;  // CH202526 05
  } else {
    return `CH${year}${shortYear}15`;
  }
}

async function gotoAuthenticatedVtopShell(page: any): Promise<void> {
  await page.goto(`${VTOP_BASE}/content`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2500));
  const url = page.url() || "";
  if (/\/login(\/|$|\?|#)/i.test(url)) {
    throw new Error(
      "VTOP did not stay signed in (still on login). Usually: wrong/expired captcha (use Connect VTOP → Sync Now in one go), wrong password, or portal blocking automation. Try a fresh captcha first."
    );
  }
}

async function readAuthorizedIdFromPage(page: any, fallback: string): Promise<string> {
  const id = await page.evaluate(() => {
    const selectors = [
      'input[name="authorizedID"]',
      "input#authorizedID",
      'input[name="authorizedStudentPrimaryId"]',
      "#authorizedStudentPrimaryId",
      'input[name="authorizedId"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      const v = el?.value?.trim();
      if (v) return v;
    }
    const meta = document.querySelector('meta[name="authorizedID"]') as HTMLMetaElement | null;
    if (meta?.content?.trim()) return meta.content.trim();
    return "";
  });
  return id || fallback;
}

async function getCsrfAndCookies(page: any) {
  const csrf = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="_csrf"]') as HTMLMetaElement;
    const input = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
    return meta?.content ?? input?.value ?? "";
  });
  const cookies = await page.cookies();
  const cookieStr = cookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
  return { csrf, cookieStr };
}

async function fetchWithSession(page: any, url: string, body: URLSearchParams, cookieStr: string): Promise<string> {
  return page.evaluate(async (u: string, b: string, c: string) => {
    const res = await fetch(u, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: c },
      body: b,
    });
    return res.text();
  }, url, body.toString(), cookieStr);
}

async function scrapeAttendance(page: any, userId: string, authorizedID: string, semesterSubId: string): Promise<number> {
  try {
    const { csrf, cookieStr } = await getCsrfAndCookies(page);
    const body = new URLSearchParams({ _csrf: csrf, semesterSubId, authorizedID, x: new Date().toUTCString() });
    const html = await fetchWithSession(page, `${VTOP_BASE}/processViewStudentAttendance`, body, cookieStr);
    console.log("Attendance HTML length:", html.length);
    console.log("Attendance HTML preview:", html.substring(0, 500));
    const $ = load(html);
    const rows: { courseCode: string; courseName: string; courseType: string; attended: number; conducted: number; attendancePercent: number }[] = [];
    $("table tr").each((_, row) => {
      const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
      if (cells.length < 12) return;
      const courseCode = cells[1];
      if (!courseCode || courseCode === "Course Code") return;
      rows.push({
        courseCode,
        courseName: cells[2],
        courseType: cells[3],
        attended: parseInt(cells[9]) || 0,
        conducted: parseInt(cells[10]) || 0,
        attendancePercent: parseFloat(cells[11]) || 0,
      });
    });
    for (const r of rows) {
      await prisma.vtopAttendance.upsert({
        where: { userId_courseCode: { userId, courseCode: r.courseCode } },
        update: {
          courseName: r.courseName,
          courseType: r.courseType,
          attended: r.attended,
          conducted: r.conducted,
          attendancePercent: r.attendancePercent,
          syncedAt: new Date(),
        },
        create: {
          userId,
          courseCode: r.courseCode,
          courseName: r.courseName,
          courseType: r.courseType,
          attended: r.attended,
          conducted: r.conducted,
          attendancePercent: r.attendancePercent,
        },
      });
    }
    console.log("Attendance synced:", rows.length);
    return rows.length;
  } catch (err) { console.error("Attendance scrape failed:", err); return 0; }
}

/** Semester IDs to try for grade history (current from calendar + recent terms). */
function buildSemSubIdCandidates(primary: string): string[] {
  const set = new Set<string>();
  const add = (s: string) => {
    const t = s?.trim();
    if (t) set.add(t);
  };
  add(primary);
  const m = primary.match(/^CH(\d{4})(\d{2})(\d{2})$/i);
  if (m) {
    const startYear = parseInt(m[1], 10);
    const termSuffix = m[3];
    const altSuffix = termSuffix === "05" ? "15" : "05";
    for (let k = 1; k <= 5; k++) {
      const y = startYear - k;
      const yy = String(y + 1).slice(-2);
      add(`CH${y}${yy}${termSuffix}`);
      add(`CH${y}${yy}${altSuffix}`);
    }
  }
  for (const x of ["CH20241505", "CH20242505", "CH20231505", "CH20232505"]) add(x);
  return [...set];
}

function mergeParsedGradeRows(rows: ParsedGradeCourse[]): ParsedGradeCourse[] {
  const map = new Map<string, ParsedGradeCourse>();
  const score = (x: ParsedGradeCourse) =>
    (x.grade ? 2 : 0) + (x.gradePoint != null ? 1 : 0) + (x.credits != null ? 1 : 0);
  for (const r of rows) {
    const k = `${normVtopSemesterLabel(r.semesterLabel)}::${r.courseCode.replace(/\s/g, "")}`;
    const prev = map.get(k);
    if (!prev || score(r) > score(prev)) map.set(k, r);
  }
  return [...map.values()];
}

async function persistVtopGradeMetrics(userId: string, parsed: ParsedGradeHistory): Promise<void> {
  const hasPortalCgpa = parsed.cgpaFromPortal != null;
  const hasSemesterGpa = parsed.semesters.some((s) => s.gpaFromPortal != null);
  if (parsed.rows.length === 0 && !hasPortalCgpa && !hasSemesterGpa) {
    return;
  }

  await prisma.vtopStudentMetrics.upsert({
    where: { userId },
    create: { userId, cgpaFromPortal: parsed.cgpaFromPortal },
    update: {
      ...(hasPortalCgpa ? { cgpaFromPortal: parsed.cgpaFromPortal } : {}),
      syncedAt: new Date(),
    },
  });

  if (parsed.rows.length === 0) return;

  await prisma.vtopSemesterMetrics.deleteMany({ where: { userId } });
  if (parsed.semesters.length > 0) {
    await prisma.vtopSemesterMetrics.createMany({
      data: parsed.semesters.map((s) => ({
        userId,
        semesterLabel: s.semesterLabel,
        gpaFromPortal: s.gpaFromPortal,
        sortIndex: s.sortIndex,
      })),
    });
  }
}

/** VTOP CC (vtopcc.vit.ac.in): grade history lives under examinations/, not processViewStudentGradeHistory. */
const EXAM_GRADE_HISTORY_PATH = "examinations/examGradeView/StudentGradeHistory";
const EXAM_MARK_VIEW_PATH = "examinations/StudentMarkView";

const LEGACY_GRADE_HISTORY_PATHS = ["processViewStudentGradeHistory", "processViewGradeHistory"];

function isTomcatNotFoundHtml(html: string): boolean {
  if (!html || html.length < 200) return true;
  return /HTTP Status 404|404\s*–\s*Not Found|<title>HTTP Status 404/i.test(html);
}

function buildExamVerifyMenuBody(csrf: string, authorizedID: string): URLSearchParams {
  return new URLSearchParams({
    verifyMenu: "true",
    authorizedID,
    _csrf: csrf,
    nocache: String(Date.now()),
  });
}

/** POST to a path under VTOP_BASE (e.g. examinations/... or processView...). */
async function postVtopForm(
  page: any,
  pathUnderVtop: string,
  body: URLSearchParams,
  cookieStr: string,
  mode: "bare" | "ajax"
): Promise<string> {
  const url = `${VTOP_BASE}/${pathUnderVtop}`;
  if (mode === "bare") {
    return fetchWithSession(page, url, body, cookieStr);
  }
  return page.evaluate(
    async (fullUrl: string, bodyStr: string, cookies: string, vtopBase: string) => {
      const origin = new URL(vtopBase).origin;
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
          Referer: `${vtopBase}/content`,
          Origin: origin,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: bodyStr,
      });
      return res.text();
    },
    url,
    body.toString(),
    cookieStr,
    VTOP_BASE
  );
}

type VtopSemesterOption = { value: string; label: string };

async function fetchTimetableHtmlString(
  page: any,
  csrf: string,
  cookieStr: string,
  authorizedID: string,
  semesterSubIdValue: string
): Promise<string> {
  return page.evaluate(
    async (url: string, csrfToken: string, authId: string, semId: string, cookies: string, base: string) => {
      const body = new URLSearchParams({
        _csrf: csrfToken,
        semesterSubId: semId,
        authorizedID: authId,
        x: new Date().toUTCString(),
      });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
          Referer: `${base}/content`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: body.toString(),
      });
      return res.text();
    },
    `${VTOP_BASE}/processViewTimeTable`,
    csrf,
    authorizedID,
    semesterSubIdValue,
    cookieStr,
    VTOP_BASE
  );
}

async function discoverVtopSemesterOptions(
  page: any,
  authorizedID: string,
  primarySemesterSubId: string
): Promise<VtopSemesterOption[]> {
  const { csrf, cookieStr } = await getCsrfAndCookies(page);
  const map = new Map<string, string>();

  for (const mode of ["bare", "ajax"] as const) {
    const b = buildExamVerifyMenuBody(csrf, authorizedID);
    const h = await postVtopForm(page, EXAM_GRADE_HISTORY_PATH, b, cookieStr, mode);
    if (h && !isTomcatNotFoundHtml(h) && h.length > 500) {
      for (const o of parseSemesterSelectOptions(h)) map.set(o.value, o.label);
      break;
    }
  }

  try {
    const tHtml = await fetchTimetableHtmlString(page, csrf, cookieStr, authorizedID, primarySemesterSubId);
    if (tHtml && tHtml.length > 500) {
      for (const o of parseSemesterSelectOptions(tHtml)) {
        if (!map.has(o.value)) map.set(o.value, o.label);
      }
    }
  } catch {
    /* ignore */
  }

  if (map.size === 0) {
    for (const id of buildSemSubIdCandidates(primarySemesterSubId)) {
      map.set(id, id);
    }
  }

  return [...map.entries()].map(([value, label]) => ({ value, label }));
}

async function fetchExamGradeHistoryForSemester(
  page: any,
  authorizedID: string,
  semValue: string,
  csrf: string,
  cookieStr: string
): Promise<string> {
  const variants = [
    () => {
      const p = buildExamVerifyMenuBody(csrf, authorizedID);
      p.set("semesterSubId", semValue);
      return p;
    },
    () => {
      const p = buildExamVerifyMenuBody(csrf, authorizedID);
      p.set("semSubId", semValue);
      return p;
    },
  ];
  for (const build of variants) {
    for (const mode of ["bare", "ajax"] as const) {
      try {
        const html = await postVtopForm(page, EXAM_GRADE_HISTORY_PATH, build(), cookieStr, mode);
        if (!isTomcatNotFoundHtml(html) && html.length > 400) return html;
      } catch {
        continue;
      }
    }
  }
  return "";
}

async function applyTimetableSemesterFallback(userId: string): Promise<void> {
  const tt = await prisma.vtopTimetable.findMany({
    where: { userId, semesterLabel: { not: null } },
  });
  const codeToSem = new Map<string, string>();
  for (const t of tt) {
    const lbl = normVtopSemesterLabel(t.semesterLabel ?? "");
    if (lbl === "Unknown") continue;
    if (!codeToSem.has(t.courseCode)) codeToSem.set(t.courseCode, lbl);
  }
  if (codeToSem.size === 0) return;

  const grades = await prisma.vtopGrade.findMany({ where: { userId } });
  for (const g of grades) {
    const cur = normVtopSemesterLabel(g.semesterLabel);
    if (cur !== "Unknown") continue;
    const target = codeToSem.get(g.courseCode);
    if (!target || target === "Unknown") continue;

    const duplicate = await prisma.vtopGrade.findFirst({
      where: {
        userId,
        courseCode: g.courseCode,
        semesterLabel: target,
        NOT: { id: g.id },
      },
    });
    if (duplicate) {
      await prisma.vtopGrade.delete({ where: { id: g.id } });
      continue;
    }
    await prisma.vtopGrade.update({
      where: { id: g.id },
      data: { semesterLabel: target },
    });
  }
}

async function refreshVtopGradeMetricsFromDb(userId: string): Promise<void> {
  const grades = await prisma.vtopGrade.findMany({
    where: { userId },
    orderBy: [{ semesterLabel: "asc" }, { courseCode: "asc" }],
  });
  const [existing, existingSem] = await Promise.all([
    prisma.vtopStudentMetrics.findUnique({ where: { userId } }),
    prisma.vtopSemesterMetrics.findMany({ where: { userId } }),
  ]);
  const portalGpaByLabel = new Map<string, number>();
  for (const s of existingSem) {
    if (s.gpaFromPortal != null) {
      portalGpaByLabel.set(normVtopSemesterLabel(s.semesterLabel), s.gpaFromPortal);
    }
  }
  const rows: ParsedGradeCourse[] = grades.map((g) => ({
    semesterLabel: g.semesterLabel,
    courseCode: g.courseCode,
    courseName: g.courseName,
    credits: g.credits,
    grade: g.grade,
    gradePoint: g.gradePoint,
    faculty: g.faculty ?? null,
    slot: g.slot ?? null,
    category: g.category ?? null,
  }));
  const parsed: ParsedGradeHistory = {
    cgpaFromPortal: existing?.cgpaFromPortal ?? null,
    rows,
    semesters: buildSemesterSummariesFromCourses(rows, portalGpaByLabel),
  };
  await persistVtopGradeMetrics(userId, parsed);
}

/**
 * Grade history: VTOP CC uses examinations/examGradeView/StudentGradeHistory (verifyMenu + nocache).
 * Legacy processView* kept as fallback when semester-scoped params are used or exam fails.
 */
async function fetchGradeHistoryHtml(
  page: any,
  authorizedID: string,
  primarySemesterSubId: string,
  extraParams?: Record<string, string>
): Promise<string> {
  const { csrf, cookieStr } = await getCsrfAndCookies(page);

  if (!extraParams) {
    for (const mode of ["bare", "ajax"] as const) {
      try {
        const examBody = buildExamVerifyMenuBody(csrf, authorizedID);
        const html = await postVtopForm(page, EXAM_GRADE_HISTORY_PATH, examBody, cookieStr, mode);
        if (!isTomcatNotFoundHtml(html) && html.length > 500) {
          console.log("[VTOP] Grade history (examinations): HTML length:", html.length);
          return html;
        }
      } catch {
        continue;
      }
    }
  }

  const x = new Date().toUTCString();

  const hasAltSem =
    !!extraParams &&
    (Object.prototype.hasOwnProperty.call(extraParams, "semSubId") ||
      Object.prototype.hasOwnProperty.call(extraParams, "semesterSubId"));

  const bodies: URLSearchParams[] = [];

  if (!hasAltSem) {
    bodies.push(
      new URLSearchParams({
        _csrf: csrf,
        authorizedID,
        semesterSubId: primarySemesterSubId,
        x,
      })
    );
  }
  bodies.push(
    new URLSearchParams({
      _csrf: csrf,
      authorizedID,
      x,
      ...(extraParams ?? {}),
    })
  );
  if (hasAltSem && extraParams) {
    bodies.push(
      new URLSearchParams({
        _csrf: csrf,
        authorizedID,
        semesterSubId: primarySemesterSubId,
        x,
        ...extraParams,
      })
    );
  }

  let last = "";
  for (const path of LEGACY_GRADE_HISTORY_PATHS) {
    for (const body of bodies) {
      for (const mode of ["bare", "ajax"] as const) {
        try {
          const html = await postVtopForm(page, path, body, cookieStr, mode);
          last = html;
          if (!isTomcatNotFoundHtml(html) && html.length > 800) {
            return html;
          }
        } catch {
          continue;
        }
      }
    }
  }
  return last;
}

async function scrapeGrades(
  page: any,
  userId: string,
  authorizedID: string,
  semesterOptions: VtopSemesterOption[],
  primarySemesterSubId: string
): Promise<number> {
  try {
    const cur = (page.url() || "").toLowerCase();
    if (!cur.includes("/content")) {
      await page.goto(`${VTOP_BASE}/content`, { waitUntil: "domcontentloaded" });
    }
    await new Promise((r) => setTimeout(r, 1000));

    const { csrf, cookieStr } = await getCsrfAndCookies(page);

    let mergedCgpa: number | null = null;
    const mergedRows: ParsedGradeCourse[] = [];
    const semesterGpaMerge = new Map<string, number>();
    let widestHtml = "";

    const parseGradeHtml = (h: string): ParsedGradeHistory | null => {
      if (!h || isTomcatNotFoundHtml(h)) return null;
      let p = parseVtopGradeHistoryHtml(h);
      if (p.rows.length === 0) {
        const $ = load(h);
        const legacyRows = legacyParseVtopGradeRows($);
        if (legacyRows.length > 0) {
          p = {
            cgpaFromPortal: p.cgpaFromPortal,
            rows: legacyRows,
            semesters: buildSemesterSummariesFromCourses(legacyRows, new Map()),
          };
        }
      }
      return p;
    };

    const ingest = (p: ParsedGradeHistory, dropdownLabel: string | null, htmlForLog: string) => {
      if (p.cgpaFromPortal != null) mergedCgpa = mergedCgpa ?? p.cgpaFromPortal;
      const L = dropdownLabel ? normVtopSemesterLabel(dropdownLabel) : null;
      if (L) {
        for (const s of p.semesters) {
          if (s.gpaFromPortal != null) {
            semesterGpaMerge.set(L, s.gpaFromPortal);
            break;
          }
        }
        for (const r of p.rows) mergedRows.push({ ...r, semesterLabel: L });
      } else {
        for (const s of p.semesters) {
          if (s.gpaFromPortal != null) {
            semesterGpaMerge.set(normVtopSemesterLabel(s.semesterLabel), s.gpaFromPortal);
          }
        }
        mergedRows.push(...p.rows);
      }
      if (p.rows.length > 0) widestHtml = htmlForLog;
    };

    for (const opt of semesterOptions) {
      try {
        const h = await fetchExamGradeHistoryForSemester(page, authorizedID, opt.value, csrf, cookieStr);
        const p = parseGradeHtml(h);
        if (p) ingest(p, opt.label, h);
        if (p?.rows.length) {
          console.log("[VTOP] Grades (semester dropdown)", opt.value, "→", p.rows.length, "rows");
        }
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        continue;
      }
    }

    if (mergedRows.length === 0) {
      const semIds = buildSemSubIdCandidates(primarySemesterSubId);
      const attempts: (Record<string, string> | undefined)[] = [undefined];
      for (const id of semIds) {
        attempts.push({ semSubId: id });
        attempts.push({ semesterSubId: id });
      }
      for (const extra of attempts) {
        try {
          const h = await fetchGradeHistoryHtml(page, authorizedID, primarySemesterSubId, extra);
          const p = parseGradeHtml(h);
          if (!p) continue;
          ingest(p, null, h);
          await new Promise((r) => setTimeout(r, 200));
        } catch {
          continue;
        }
      }
    }

    const rows = mergeParsedGradeRows(mergedRows);
    const semesters =
      rows.length > 0 ? buildSemesterSummariesFromCourses(rows, semesterGpaMerge) : [];

    const parsed: ParsedGradeHistory = {
      cgpaFromPortal: mergedCgpa,
      rows,
      semesters,
    };

    if (parsed.rows.length === 0) {
      console.warn(
        "[VTOP] Grade history: 0 course rows after merge. Widest HTML length:",
        widestHtml.length,
        "preview:",
        widestHtml.slice(0, 400).replace(/\s+/g, " ")
      );
    }

    await persistVtopGradeMetrics(userId, parsed);
    if (parsed.rows.length === 0) return 0;

    for (const r of parsed.rows) {
      const semesterLabel = normVtopSemesterLabel(r.semesterLabel);
      await prisma.vtopGrade.upsert({
        where: {
          userId_semesterLabel_courseCode: { userId, semesterLabel, courseCode: r.courseCode },
        },
        update: {
          courseName: r.courseName,
          credits: r.credits,
          grade: r.grade,
          gradePoint: r.gradePoint,
          faculty: r.faculty,
          slot: r.slot,
          category: r.category,
          syncedAt: new Date(),
        },
        create: {
          userId,
          semesterLabel,
          courseCode: r.courseCode,
          courseName: r.courseName,
          credits: r.credits,
          grade: r.grade,
          gradePoint: r.gradePoint,
          faculty: r.faculty,
          slot: r.slot,
          category: r.category,
        },
      });
    }
    console.log("Grades synced:", parsed.rows.length, "CGPA portal:", parsed.cgpaFromPortal);
    return parsed.rows.length;
  } catch (err) {
    console.error("Grades scrape failed:", err);
    return 0;
  }
}

function hashCourseColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 52% 42%)`;
}

export async function syncSemestersAndCoursesFromVtop(
  userId: string
): Promise<{ semesters: number; courses: number }> {
  try {
    const grades = await prisma.vtopGrade.findMany({
      where: { userId },
      orderBy: [{ semesterLabel: "asc" }, { courseCode: "asc" }],
    });
    const groups = new Map<string, typeof grades>();
    for (const g of grades) {
      const key = (g.semesterLabel?.trim() || "Grade history").slice(0, 120);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(g);
    }
    if (groups.size === 0) return { semesters: 0, courses: 0 };

    const tt = await prisma.vtopTimetable.findMany({ where: { userId } });
    const ttByCode = new Map<string, { venue: string; slot: string; courseType: string }[]>();
    for (const t of tt) {
      const list = ttByCode.get(t.courseCode) ?? [];
      list.push({ venue: t.venue, slot: t.slot, courseType: t.courseType });
      ttByCode.set(t.courseCode, list);
    }

    const att = await prisma.vtopAttendance.findMany({ where: { userId } });
    const attByCode = new Map(att.map((a) => [a.courseCode, a]));

    let newSemesters = 0;
    let newCourses = 0;

    const now = new Date();
    const endPlaceholder = new Date(now);
    endPlaceholder.setMonth(endPlaceholder.getMonth() + 5);

    for (const [semName, rows] of groups) {
      let semester = await prisma.semester.findFirst({
        where: { userId, name: semName, deletedAt: null },
      });
      if (!semester) {
        semester = await prisma.semester.create({
          data: {
            userId,
            name: semName,
            startDate: now,
            endDate: endPlaceholder,
          },
        });
        newSemesters++;
      }

      for (const g of rows) {
        const code = g.courseCode;
        const slots = ttByCode.get(code) ?? [];
        const venueStr =
          slots.length > 0
            ? slots.map((s) => `${s.slot} ${s.courseType} @ ${s.venue}`).join("; ")
            : undefined;
        const typeFromAtt = attByCode.get(code)?.courseType;
        const desc =
          [typeFromAtt && `Type: ${typeFromAtt}`, venueStr && `Schedule: ${venueStr}`]
            .filter(Boolean)
            .join(" · ") || null;

        const existing = await prisma.course.findFirst({
          where: { semesterId: semester.id, code, deletedAt: null },
        });

        if (existing) {
          await prisma.course.update({
            where: { id: existing.id },
            data: {
              name: g.courseName || existing.name,
              credits: g.credits ?? existing.credits,
              description: desc ?? existing.description,
              color: existing.color || hashCourseColor(code),
              instructor: g.faculty?.trim() || existing.instructor,
            },
          });
        } else {
          await prisma.course.create({
            data: {
              semesterId: semester.id,
              name: g.courseName || code,
              code,
              credits: g.credits ?? undefined,
              description: desc,
              color: hashCourseColor(code),
              instructor: g.faculty?.trim() || undefined,
            },
          });
          newCourses++;
        }
      }
    }

    return { semesters: newSemesters, courses: newCourses };
  } catch (err) {
    console.error("syncSemestersAndCoursesFromVtop failed:", err);
    return { semesters: 0, courses: 0 };
  }
}

async function scrapeMarks(page: any, userId: string, authorizedID: string): Promise<number> {
  const legacyPaths = ["processViewStudentMark", "processViewMarks", "processStudentMarks"];
  try {
    const { csrf, cookieStr } = await getCsrfAndCookies(page);
    for (const mode of ["bare", "ajax"] as const) {
      try {
        const body = buildExamVerifyMenuBody(csrf, authorizedID);
        const html = await postVtopForm(page, EXAM_MARK_VIEW_PATH, body, cookieStr, mode);
        if (html && html.length >= 300) {
          const n = await parseAndStoreMarksHtml(html, userId);
          if (n > 0) {
            console.log("[VTOP] Marks (examinations/StudentMarkView):", n, "rows");
            return n;
          }
        }
      } catch {
        continue;
      }
    }
    for (const p of legacyPaths) {
      try {
        const body = new URLSearchParams({
          _csrf: csrf,
          authorizedID,
          x: new Date().toUTCString(),
        });
        const html = await fetchWithSession(page, `${VTOP_BASE}/${p}`, body, cookieStr);
        if (!html || html.length < 300) continue;
        const n = await parseAndStoreMarksHtml(html, userId);
        if (n > 0) return n;
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error("Marks scrape failed:", err);
  }
  return 0;
}

async function parseAndStoreMarksHtml(html: string, userId: string): Promise<number> {
  const rows = parseVtopMarksTableHtml(html);
  if (rows.length === 0) return 0;
  for (const row of rows) {
    await prisma.vtopMark.upsert({
      where: {
        userId_courseCode_component: {
          userId,
          courseCode: row.courseCode,
          component: row.component,
        },
      },
      update: {
        scored: row.scored,
        maxScore: row.maxScore,
        syncedAt: new Date(),
      },
      create: {
        userId,
        courseCode: row.courseCode,
        component: row.component,
        scored: row.scored,
        maxScore: row.maxScore,
      },
    });
  }
  return rows.length;
}

async function scrapeTimetable(
  page: any,
  userId: string,
  authorizedID: string,
  semesterOptions: VtopSemesterOption[],
  primarySemesterSubId: string
): Promise<number> {
  try {
    const cur = (page.url() || "").toLowerCase();
    if (!cur.includes("/content")) {
      await page.goto(`${VTOP_BASE}/content`, { waitUntil: "domcontentloaded" });
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }

    const { csrf, cookieStr } = await getCsrfAndCookies(page);
    const opts: VtopSemesterOption[] =
      semesterOptions.length > 0
        ? semesterOptions
        : [{ value: primarySemesterSubId, label: primarySemesterSubId }];

    await prisma.vtopTimetable.deleteMany({ where: { userId } });

    const DAY_MAP: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };

    const THEORY_TIMES: Record<number, { start: string; end: string }> = {
      0: { start: "08:00", end: "08:50" },
      1: { start: "08:55", end: "09:45" },
      2: { start: "09:50", end: "10:40" },
      3: { start: "10:45", end: "11:35" },
      4: { start: "11:40", end: "12:30" },
      5: { start: "12:35", end: "13:25" },
      6: { start: "14:00", end: "14:50" },
      7: { start: "14:55", end: "15:45" },
      8: { start: "15:50", end: "16:40" },
      9: { start: "16:45", end: "17:35" },
      10: { start: "17:40", end: "18:30" },
      11: { start: "18:35", end: "19:25" },
    };

    const LAB_TIMES: Record<number, { start: string; end: string }> = {
      0: { start: "08:00", end: "08:50" },
      1: { start: "08:50", end: "09:40" },
      2: { start: "09:50", end: "10:40" },
      3: { start: "10:40", end: "11:30" },
      4: { start: "11:40", end: "12:30" },
      5: { start: "12:30", end: "13:20" },
      6: { start: "14:00", end: "14:50" },
      7: { start: "14:50", end: "15:40" },
      8: { start: "15:50", end: "16:40" },
      9: { start: "16:40", end: "17:30" },
      10: { start: "17:40", end: "18:30" },
      11: { start: "18:30", end: "19:20" },
    };

    const attendance = await prisma.vtopAttendance.findMany({ where: { userId } });
    const nameMap = new Map(attendance.map((a) => [a.courseCode, a.courseName]));

    const allEntries: {
      userId: string;
      semesterSubId: string;
      semesterLabel: string | null;
      courseCode: string;
      courseName: string;
      courseType: string;
      slot: string;
      venue: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[] = [];

    for (const opt of opts) {
      const html = await fetchTimetableHtmlString(page, csrf, cookieStr, authorizedID, opt.value);
      if (!html || html.length < 200) continue;

      const $ = load(html);
      console.log(
        "[VTOP] Timetable",
        opt.value,
        "HTML length:",
        html.length,
        "timeTableStyle rows:",
        $("table#timeTableStyle tr").length
      );

      const semesterSubIdVal = opt.value.trim();
      const semNorm = normVtopSemesterLabel(opt.label);
      const semesterLabelVal = semNorm === "Unknown" ? null : semNorm;

      const entries: typeof allEntries = [];
      let currentDay = -1;
      let isTheory = true;

      $("table#timeTableStyle tr").each((_, row) => {
        const cells = $(row).find("td");
        if (!cells.length) return;

        const firstText = $(cells[0]).text().trim().toUpperCase();
        if (DAY_MAP[firstText] !== undefined) currentDay = DAY_MAP[firstText];

        const labelText =
          cells.length > 1 ? $(cells[1]).text().trim().toUpperCase() : $(cells[0]).text().trim().toUpperCase();
        if (labelText === "THEORY") isTheory = true;
        else if (labelText === "LAB") isTheory = false;

        if (currentDay < 0) return;

        const hasDay = DAY_MAP[firstText] !== undefined;
        const startIdx = hasDay ? 2 : 1;
        const timesMap = isTheory ? THEORY_TIMES : LAB_TIMES;

        let colIdx = 0;
        cells.each((i, cell) => {
          if (i < startIdx) return;
          const text = $(cell).text().trim();
          const bg = $(cell).attr("bgcolor") || "";
          if (text === "Lunch") return;
          if (bg === "#CCFF33" && text && text.includes("-")) {
            const parts = text.split("-");
            if (parts.length >= 3) {
              const slot = parts[0];
              const courseCode = parts[1];
              const courseType = parts[2];
              const venue = parts[3] || "";
              const timeInfo = timesMap[colIdx];
              if (timeInfo) {
                entries.push({
                  userId,
                  semesterSubId: semesterSubIdVal,
                  semesterLabel: semesterLabelVal,
                  courseCode,
                  courseName: courseCode,
                  courseType,
                  slot,
                  venue,
                  dayOfWeek: currentDay,
                  startTime: timeInfo.start,
                  endTime: timeInfo.end,
                });
              }
            }
          }
          colIdx++;
        });
      });

      for (const entry of entries) {
        entry.courseName = nameMap.get(entry.courseCode) || entry.courseCode;
      }
      allEntries.push(...entries);
      await new Promise((r) => setTimeout(r, 150));
    }

    const seen = new Set<string>();
    const unique = allEntries.filter((e) => {
      const key = `${e.semesterSubId}-${e.slot}-${e.dayOfWeek}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length > 0) {
      await prisma.vtopTimetable.createMany({ data: unique });
    }

    console.log(`Timetable synced: ${unique.length} entries across ${opts.length} semester option(s)`);
    return unique.length;
  } catch (err) {
    console.error("Timetable scrape failed:", err);
    return 0;
  }
}

async function scrapeAcademicCalendar(page: any, userId: string, authorizedID: string, semesterSubId: string): Promise<number> {
  try {
    const { csrf, cookieStr } = await getCsrfAndCookies(page);
    const MONTH_MAP: Record<string, number> = {
      JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4,
      JUNE: 5, JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
    };

    // Determine months based on semesterSubId pattern
    // CH20252605 = Winter 2025-26 = Jan-May 2026
    // CH20251501 = Summer 2025 = May-Sep 2025
    // Default to current year months if can't detect
    const currentYear = new Date().getFullYear();
    let months: string[];

    if (semesterSubId.includes("2605") || semesterSubId.includes("2606")) {
      // Winter semester Jan-May
      months = [`01-JAN-${currentYear}`, `01-FEB-${currentYear}`, `01-MAR-${currentYear}`, `01-APR-${currentYear}`, `01-MAY-${currentYear}`];
    } else if (semesterSubId.includes("1505") || semesterSubId.includes("1506")) {
      // Summer semester May-Sep
      months = [`01-MAY-${currentYear}`, `01-JUN-${currentYear}`, `01-JUL-${currentYear}`, `01-AUG-${currentYear}`, `01-SEP-${currentYear}`];
    } else {
      // Fallback: scrape next 5 months from now
      const now = new Date();
      const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      months = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return `01-${MONTH_ABBR[d.getMonth()]}-${d.getFullYear()}`;
      });
    }

    let eventCount = 0;

    for (const calDate of months) {
      const body = new URLSearchParams({ _csrf: csrf, calDate, semSubId: semesterSubId, classGroupId: "ALL", authorizedID, x: new Date().toUTCString() });
      const html = await fetchWithSession(page, `${VTOP_BASE}/processViewCalendar`, body, cookieStr);
      const $ = load(html);
      const headerText = $("h4").first().text().trim();
      const [monthName, yearStr] = headerText.split(" ");
      const monthIndex = MONTH_MAP[monthName?.toUpperCase()] ?? 0;
      const year = parseInt(yearStr) || currentYear;

      const cells: { date: Date; eventType: string; label: string }[] = [];
      $("table td").each((_, td) => {
        const spans = $(td).find("span");
        if (spans.length < 2) return;
        const dateNum = parseInt($(spans[0]).text().trim());
        if (!dateNum || isNaN(dateNum)) return;
        const eventType = $(spans[1]).text().trim();
        if (!eventType) return;
        const label = spans.length >= 3 ? $(spans[2]).text().trim() : "";
        const date = new Date(year, monthIndex, dateNum);
        cells.push({ date, eventType, label });
      });
      for (const { date, eventType, label } of cells) {
        await prisma.vtopAcademicEvent.upsert({
          where: { userId_date: { userId, date } },
          update: { eventType, label, syncedAt: new Date() },
          create: { userId, date, eventType, label },
        });
        eventCount += 1;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Academic calendar synced: ${eventCount} events`);
    return eventCount;
  } catch (err) { console.error("Academic calendar scrape failed:", err); return 0; }
}

export async function getVtopAttendance(userId: string) {
  return prisma.vtopAttendance.findMany({ where: { userId }, orderBy: { courseCode: "asc" } });
}

export async function getVtopGrades(userId: string) {
  return prisma.vtopGrade.findMany({ where: { userId }, orderBy: { courseCode: "asc" } });
}

/** CGPA snapshot (portal value when scraped + credit-weighted computation). */
export async function getVtopCgpa(userId: string) {
  const s = await getVtopGradesSummary(userId);
  return {
    cgpa: s.cgpa,
    cgpaComputed: s.cgpaComputed,
    cgpaFromPortal: s.cgpaFromPortal,
    totalCredits: s.totalCredits,
    totalWeightedScore: s.totalWeightedScore,
  };
}

/** Grades grouped by semester with computed / portal GPA per term. */
export async function getVtopSemesterGrades(userId: string) {
  const s = await getVtopGradesSummary(userId);
  return { semesters: s.semesters };
}

export interface GradeSummaryCourse {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  grade: string | null;
  gradePoint: number | null;
  faculty: string | null;
  slot: string | null;
  category: string | null;
}

export interface GradeSummarySemester {
  semesterLabel: string | null;
  totalCredits: number;
  weightedScore: number;
  gpa: number | null;
  /** Semester GPA shown on VTOP grade history when scraped */
  gpaFromPortal: number | null;
  /** GPA from credits × grade points only */
  gpaComputed: number | null;
  courses: GradeSummaryCourse[];
}

export async function getVtopGradesSummary(userId: string): Promise<{
  cgpa: number | null;
  cgpaFromPortal: number | null;
  cgpaComputed: number | null;
  totalCredits: number;
  totalWeightedScore: number;
  semesters: GradeSummarySemester[];
}> {
  const [grades, studentM, semesterMetrics] = await Promise.all([
    prisma.vtopGrade.findMany({
      where: { userId },
      orderBy: [{ semesterLabel: "asc" }, { courseCode: "asc" }],
    }),
    prisma.vtopStudentMetrics.findUnique({ where: { userId } }),
    prisma.vtopSemesterMetrics.findMany({ where: { userId }, orderBy: { sortIndex: "asc" } }),
  ]);

  const sortIndexByLabel = new Map<string, number>();
  const portalGpaByLabel = new Map<string, number | null>();
  for (const m of semesterMetrics) {
    sortIndexByLabel.set(m.semesterLabel, m.sortIndex);
    portalGpaByLabel.set(m.semesterLabel, m.gpaFromPortal);
  }

  const bySem = new Map<string, typeof grades>();
  for (const g of grades) {
    const k = normVtopSemesterLabel(g.semesterLabel);
    if (!bySem.has(k)) bySem.set(k, []);
    bySem.get(k)!.push(g);
  }

  const labelSort = (a: string, b: string) => {
    const ia = sortIndexByLabel.has(a) ? sortIndexByLabel.get(a)! : 9999;
    const ib = sortIndexByLabel.has(b) ? sortIndexByLabel.get(b)! : 9999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  };

  const sortedLabels = [...bySem.keys()].sort(labelSort);

  const semesters: GradeSummarySemester[] = [];
  let totalCredAll = 0;
  let totalWeightedAll = 0;

  for (const label of sortedLabels) {
    const rows = bySem.get(label)!;
    let wc = 0;
    let ws = 0;
    for (const r of rows) {
      const c = r.credits;
      const gp = effectiveGradePoint(r.grade, r.gradePoint);
      if (c != null && gp != null && !Number.isNaN(c) && !Number.isNaN(gp)) {
        wc += c;
        ws += c * gp;
      }
    }
    const gpaComputed = wc > 0 ? ws / wc : null;
    const gpaFromPortal = portalGpaByLabel.get(label) ?? null;
    const gpa = gpaFromPortal ?? gpaComputed;
    semesters.push({
      semesterLabel: label === "Unknown" ? null : label,
      totalCredits: wc,
      weightedScore: ws,
      gpa,
      gpaFromPortal,
      gpaComputed,
      courses: rows.map((r) => ({
        id: r.id,
        courseCode: r.courseCode,
        courseName: r.courseName,
        credits: r.credits,
        grade: r.grade,
        gradePoint: effectiveGradePoint(r.grade, r.gradePoint),
        faculty: r.faculty ?? null,
        slot: r.slot ?? null,
        category: r.category ?? null,
      })),
    });
    totalCredAll += wc;
    totalWeightedAll += ws;
  }

  const cgpaComputed = totalCredAll > 0 ? totalWeightedAll / totalCredAll : null;
  const cgpaFromPortal = studentM?.cgpaFromPortal ?? null;
  const cgpa = cgpaFromPortal ?? cgpaComputed;

  return {
    cgpa,
    cgpaFromPortal,
    cgpaComputed,
    totalCredits: totalCredAll,
    totalWeightedScore: totalWeightedAll,
    semesters,
  };
}

export async function getVtopMarks(userId: string) {
  return prisma.vtopMark.findMany({
    where: { userId },
    orderBy: [{ courseCode: "asc" }, { component: "asc" }],
  });
}

export async function getVtopAcademicEvents(userId: string) {
  return prisma.vtopAcademicEvent.findMany({ where: { userId }, orderBy: { date: "asc" } });
}

export async function getVtopTimetable(userId: string) {
  return prisma.vtopTimetable.findMany({ where: { userId }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
}