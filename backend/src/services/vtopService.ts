import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";
import { load } from "cheerio";

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();
const VTOP_BASE = "https://vtopcc.vit.ac.in/vtop";
const TIMEOUT = 60000;

interface VtopSession {
  browser: any;
  page: any;
  createdAt: number;
}
const sessions = new Map<string, VtopSession>();

function clearSession(userId: string) {
  const session = sessions.get(userId);
  if (session) {
    session.browser.close().catch(() => {});
    sessions.delete(userId);
  }
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
  let page: any;
  let browser: any;

  if (session) {
    page = session.page;
    browser = session.browser;
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

    const attendanceCount = await scrapeAttendance(page, userId, username, "CH20252605");
    const gradesCount = await scrapeGrades(page, userId, username);
    const coursesCount = await syncCoursesFromAttendance(userId);
    const academicEventsCount = await scrapeAcademicCalendar(page, userId, username);

    return {
      attendance: attendanceCount,
      grades: gradesCount,
      courses: coursesCount,
      academicEvents: academicEventsCount,
      message: `Synced ${attendanceCount} attendance, ${gradesCount} grades, ${coursesCount} courses, ${academicEventsCount} calendar events`,
    };
  } finally {
    clearSession(userId);
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

async function scrapeAcademicCalendar(page: any, userId: string, authorizedID: string): Promise<number> {
  try {
    const { csrf, cookieStr } = await getCsrfAndCookies(page);

    const MONTH_MAP: Record<string, number> = {
      JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4,
      JUNE: 5, JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
    };

    const months = ["01-JAN-2026", "01-FEB-2026", "01-MAR-2026", "01-APR-2026", "01-MAY-2026"];
    const upserts: Promise<any>[] = [];

    for (const calDate of months) {
      const body = new URLSearchParams({
        _csrf: csrf,
        calDate,
        semSubId: "CH20252605",
        classGroupId: "ALL",
        authorizedID,
        x: new Date().toUTCString(),
      });

      const html = await fetchWithSession(page, `${VTOP_BASE}/processViewCalendar`, body, cookieStr);
      const $ = load(html);
      console.log("Calendar HTML length:", html.length, "for", calDate);
      console.log("h4 text:", $("h4").first().text().trim());
      console.log("td count:", $("table td").length);

      // Get month/year from h4: "JANUARY 2026"
      const headerText = $("h4").first().text().trim();
      const [monthName, yearStr] = headerText.split(" ");
      const monthIndex = MONTH_MAP[monthName?.toUpperCase()] ?? 0;
      const year = parseInt(yearStr) || 2026;

      $("table td").each((_, td) => {
        const spans = $(td).find("span");
        if (spans.length < 2) return;

        const dateNum = parseInt($(spans[0]).text().trim());
        if (!dateNum || isNaN(dateNum)) return;

        const eventType = $(spans[1]).text().trim();
        if (!eventType) return;

        const label = spans.length >= 3 ? $(spans[2]).text().trim() : "";
        const date = new Date(year, monthIndex, dateNum);

        upserts.push(
          prisma.vtopAcademicEvent.upsert({
            where: { userId_date: { userId, date } },
            update: { eventType, label, syncedAt: new Date() },
            create: { userId, date, eventType, label },
          })
        );
      });

      await new Promise(r => setTimeout(r, 500));
    }

    await Promise.all(upserts);
    console.log(`Academic calendar: synced ${upserts.length} events`);
    return upserts.length;
  } catch (err) {
    console.error("Academic calendar scrape failed:", err);
    return 0;
  }
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