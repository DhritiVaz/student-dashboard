import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";
import { load } from "cheerio";

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();
const VTOP_BASE = "https://vtopcc.vit.ac.in/vtop";
const TIMEOUT = 60000;

interface VtopSession { browser: any; page: any; createdAt: number; }
const sessions = new Map<string, VtopSession>();

function clearSession(userId: string) {
  const session = sessions.get(userId);
  if (session) { session.browser.close().catch(() => {}); sessions.delete(userId); }
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) clearSession(userId);
  }
}, 60 * 1000);

export interface VtopSyncResult {
  attendance: number;
  grades: number;
  courses: number;
  academicEvents: number;
  timetable: number;
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
    await page.waitForSelector("#username", { visible: true });
    await page.click("#username", { clickCount: 3 });
    await page.type("#username", username, { delay: 50 });
    await page.click("#password", { clickCount: 3 });
    await page.type("#password", password, { delay: 50 });

    if (captchaStr) {
      const captchaInput = await page.$('input[name="captchaStr"]');
      if (captchaInput) {
        await page.click('input[name="captchaStr"]', { clickCount: 3 });
        await page.type('input[name="captchaStr"]', captchaStr, { delay: 50 });
      }
    }

    await page.click("#submitBtn");
    await Promise.race([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: TIMEOUT }),
      new Promise(resolve => setTimeout(resolve, 8000))
    ]);

    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    if (bodyText.includes("invalid") || bodyText.includes("incorrect") || bodyText.includes("failed")) {
      throw new Error("Invalid VTOP credentials. Please check your username and password.");
    }

    // Detect semester ID dynamically
    const semesterSubId = getDefaultSemesterSubId();
    console.log("Using semesterSubId:", semesterSubId);

    const attendanceCount = await scrapeAttendance(page, userId, username, semesterSubId);
    const gradesCount = await scrapeGrades(page, userId, username);
    const coursesCount = await syncCoursesFromAttendance(userId);
    const timetableCount = await scrapeTimetable(page, userId, username, semesterSubId);
    const academicEventsCount = await scrapeAcademicCalendar(page, userId, username, semesterSubId);

    return {
      attendance: attendanceCount,
      grades: gradesCount,
      courses: coursesCount,
      academicEvents: academicEventsCount,
      timetable: timetableCount,
      message: `Synced ${attendanceCount} attendance, ${gradesCount} grades, ${coursesCount} courses, ${timetableCount} timetable entries, ${academicEventsCount} calendar events`,
    };
  } finally {
    clearSession(userId);
  }
}

function getDefaultSemesterSubId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const shortYear = String(year).slice(2);
  const prevShortYear = String(year - 1).slice(2);

  // Winter semester (Jan-May): CH + prevYear + currYear + "05"
  // Summer semester (Jun-Dec): CH + currYear + currYear + "15"
  if (month >= 1 && month <= 5) {
    return `CH${prevShortYear}${shortYear}2605`;
  } else {
    return `CH${shortYear}${shortYear}1505`;
  }
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
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": c },
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
    const upserts: Promise<any>[] = [];
    $("table tr").each((_, row) => {
      const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
      if (cells.length < 12) return;
      const courseCode = cells[1];
      if (!courseCode || courseCode === "Course Code") return;
      upserts.push(prisma.vtopAttendance.upsert({
        where: { userId_courseCode: { userId, courseCode } },
        update: { courseName: cells[2], courseType: cells[3], attended: parseInt(cells[9]) || 0, conducted: parseInt(cells[10]) || 0, attendancePercent: parseFloat(cells[11]) || 0, syncedAt: new Date() },
        create: { userId, courseCode, courseName: cells[2], courseType: cells[3], attended: parseInt(cells[9]) || 0, conducted: parseInt(cells[10]) || 0, attendancePercent: parseFloat(cells[11]) || 0 },
      }));
    });
    await Promise.all(upserts);
    console.log("Attendance synced:", upserts.length);
    return upserts.length;
  } catch (err) { console.error("Attendance scrape failed:", err); return 0; }
}

async function scrapeGrades(page: any, userId: string, authorizedID: string): Promise<number> {
  try {
    const { csrf, cookieStr } = await getCsrfAndCookies(page);
    const body = new URLSearchParams({ _csrf: csrf, authorizedID, x: new Date().toUTCString() });
    const html = await fetchWithSession(page, `${VTOP_BASE}/processViewStudentGradeHistory`, body, cookieStr);
    const $ = load(html);
    const upserts: Promise<any>[] = [];
    $("table tr").each((_, row) => {
      const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
      if (cells.length < 5) return;
      const courseCode = cells[1];
      if (!courseCode || courseCode === "Course Code") return;
      upserts.push(prisma.vtopGrade.upsert({
        where: { userId_courseCode: { userId, courseCode } },
        update: { courseName: cells[2], credits: parseFloat(cells[3]) || null, grade: cells[4] || null, gradePoint: parseFloat(cells[5]) || null, syncedAt: new Date() },
        create: { userId, courseCode, courseName: cells[2], credits: parseFloat(cells[3]) || null, grade: cells[4] || null, gradePoint: parseFloat(cells[5]) || null },
      }));
    });
    await Promise.all(upserts);
    return upserts.length;
  } catch (err) { console.error("Grades scrape failed:", err); return 0; }
}

async function syncCoursesFromAttendance(userId: string): Promise<number> {
  try {
    const attendance = await prisma.vtopAttendance.findMany({ where: { userId } });
    const semesters = await prisma.semester.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: "desc" } });
    const semesterId = semesters[0]?.id;
    if (!semesterId) return 0;
    let count = 0;
    for (const a of attendance) {
      const existing = await prisma.course.findFirst({ where: { semesterId, code: a.courseCode, deletedAt: null } });
      if (!existing) {
        await prisma.course.create({ data: { semesterId, name: a.courseName, code: a.courseCode, description: a.courseType || null } });
        count++;
      }
    }
    return count;
  } catch (err) { console.error("Courses from attendance failed:", err); return 0; }
}

async function scrapeTimetable(page: any, userId: string, authorizedID: string, semesterSubId: string): Promise<number> {
  try {
    await page.goto(`${VTOP_BASE}/content`, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 2000));

    const { csrf, cookieStr } = await getCsrfAndCookies(page);

    const html = await page.evaluate(async (url: string, csrfToken: string, authId: string, semId: string, cookies: string, base: string) => {
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
          "Cookie": cookies,
          "Referer": `${base}/content`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: body.toString(),
      });
      return res.text();
    }, `${VTOP_BASE}/processViewTimeTable`, csrf, authorizedID, semesterSubId, cookieStr, VTOP_BASE);

    const $ = load(html);
    console.log("Timetable HTML length:", html.length);
    console.log("timeTableStyle rows:", $("table#timeTableStyle tr").length);

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

    const entries: any[] = [];
    let currentDay = -1;
    let isTheory = true;

    $("table#timeTableStyle tr").each((_, row) => {
      const cells = $(row).find("td");
      if (!cells.length) return;

      const firstText = $(cells[0]).text().trim().toUpperCase();
      if (DAY_MAP[firstText] !== undefined) currentDay = DAY_MAP[firstText];

      const labelText = cells.length > 1 ? $(cells[1]).text().trim().toUpperCase() : $(cells[0]).text().trim().toUpperCase();
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
              entries.push({ userId, courseCode, courseName: courseCode, courseType, slot, venue, dayOfWeek: currentDay, startTime: timeInfo.start, endTime: timeInfo.end });
            }
          }
        }
        colIdx++;
      });
    });

    const attendance = await prisma.vtopAttendance.findMany({ where: { userId } });
    const nameMap = new Map(attendance.map(a => [a.courseCode, a.courseName]));
    for (const entry of entries) {
      entry.courseName = nameMap.get(entry.courseCode) || entry.courseCode;
    }

    const seen = new Set<string>();
    const unique = entries.filter(e => {
      const key = `${e.slot}-${e.dayOfWeek}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length > 0) {
      await prisma.vtopTimetable.createMany({ data: unique });
    }

    console.log(`Timetable synced: ${unique.length} entries`);
    return unique.length;
  } catch (err) { console.error("Timetable scrape failed:", err); return 0; }
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

    const upserts: Promise<any>[] = [];

    for (const calDate of months) {
      const body = new URLSearchParams({ _csrf: csrf, calDate, semSubId: semesterSubId, classGroupId: "ALL", authorizedID, x: new Date().toUTCString() });
      const html = await fetchWithSession(page, `${VTOP_BASE}/processViewCalendar`, body, cookieStr);
      const $ = load(html);
      const headerText = $("h4").first().text().trim();
      const [monthName, yearStr] = headerText.split(" ");
      const monthIndex = MONTH_MAP[monthName?.toUpperCase()] ?? 0;
      const year = parseInt(yearStr) || currentYear;

      $("table td").each((_, td) => {
        const spans = $(td).find("span");
        if (spans.length < 2) return;
        const dateNum = parseInt($(spans[0]).text().trim());
        if (!dateNum || isNaN(dateNum)) return;
        const eventType = $(spans[1]).text().trim();
        if (!eventType) return;
        const label = spans.length >= 3 ? $(spans[2]).text().trim() : "";
        const date = new Date(year, monthIndex, dateNum);
        upserts.push(prisma.vtopAcademicEvent.upsert({
          where: { userId_date: { userId, date } },
          update: { eventType, label, syncedAt: new Date() },
          create: { userId, date, eventType, label },
        }));
      });
      await new Promise(r => setTimeout(r, 500));
    }

    await Promise.all(upserts);
    console.log(`Academic calendar synced: ${upserts.length} events`);
    return upserts.length;
  } catch (err) { console.error("Academic calendar scrape failed:", err); return 0; }
}

export async function getVtopAttendance(userId: string) {
  return prisma.vtopAttendance.findMany({ where: { userId }, orderBy: { courseCode: "asc" } });
}

export async function getVtopGrades(userId: string) {
  return prisma.vtopGrade.findMany({ where: { userId }, orderBy: { courseCode: "asc" } });
}

export async function getVtopAcademicEvents(userId: string) {
  return prisma.vtopAcademicEvent.findMany({ where: { userId }, orderBy: { date: "asc" } });
}

export async function getVtopTimetable(userId: string) {
  return prisma.vtopTimetable.findMany({ where: { userId }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
}