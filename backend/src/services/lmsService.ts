import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { load } from "cheerio";
import { prisma } from "../lib/prisma";

puppeteerExtra.use(StealthPlugin());

const LMS_BASE = "https://lms.vit.ac.in";
const TIMEOUT = 60000;

export interface LmsSyncResult {
  courses: number;
  assignments: number;
  modules: number;
  message: string;
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

export async function syncLmsData(
  userId: string,
  username: string,
  password: string
): Promise<LmsSyncResult> {
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // ── 1. Login ──────────────────────────────────────────────────────────────
    await page.goto(`${LMS_BASE}/login/index.php`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#username", { visible: true });
    // Use evaluate to set values directly — avoids special-char mistyping (e.g. @)
    await page.evaluate(
      (u: string, p: string) => {
        (document.querySelector("#username") as HTMLInputElement).value = u;
        (document.querySelector("#password") as HTMLInputElement).value = p;
      },
      username,
      password
    );
    await Promise.all([
      page.click("#loginbtn"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    if (page.url().includes("login/index.php")) {
      const errorEl = await page.$(".loginerrors, #loginerrormessage, .alert-danger");
      const msg = errorEl
        ? await page.evaluate((el: Element) => el.textContent?.trim(), errorEl)
        : "Invalid username or password.";
      throw new Error(msg ?? "LMS login failed.");
    }

    // ── 2. Wipe stale dom_ placeholder records from previous broken syncs ────
    // These were created before course ID extraction was fixed.
    // Must delete assignments first (FK constraint), then courses.
    const staleCourses = await prisma.lmsCourse.findMany({
      where: { userId, lmsCourseId: { startsWith: "dom_" } },
      select: { lmsCourseId: true },
    });
    if (staleCourses.length > 0) {
      const staleIds = staleCourses.map((c) => c.lmsCourseId);
      await prisma.lmsAssignment.deleteMany({ where: { userId, lmsCourseId: { in: staleIds } } });
      await prisma.lmsCourse.deleteMany({ where: { userId, lmsCourseId: { in: staleIds } } });
    }

    // ── 3. Go to the calendar upcoming page — events are visible here ─────────
    await page.goto(`${LMS_BASE}/calendar/view.php?view=upcoming`, { waitUntil: "networkidle2" });
    // Wait for any deferred JS rendering (timeline block is Vue-rendered in Moodle 4.x)
    await new Promise((r) => setTimeout(r, 4000));

    // ── 3. Everything runs inside page.evaluate — browser session + cookies are live ─
    // NOTE: no named inner functions — tsx injects __name() for them which breaks in browser context
    const scraped = await page.evaluate(async (base: string) => {
      // ── Sesskey (inlined) ─────────────────────────────────────────────────
      let sesskey: string = (window as any).M?.cfg?.sesskey ?? "";
      if (!sesskey) {
        const inp = document.querySelector<HTMLInputElement>('input[name="sesskey"]');
        if (inp?.value) sesskey = inp.value;
      }
      if (!sesskey) {
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='sesskey=']"));
        for (const a of links) {
          const m = a.href.match(/sesskey=([a-zA-Z0-9]+)/);
          if (m) { sesskey = m[1]; break; }
        }
      }
      if (!sesskey) {
        const m = document.documentElement.outerHTML.match(/"sesskey":"([^"]+)"/);
        if (m) sesskey = m[1];
      }

      // ── AJAX: enrolled courses ─────────────────────────────────────────────
      let courses: any[] = [];
      if (sesskey) {
        try {
          const r = await fetch(`${base}/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ index: 0, methodname: "core_course_get_enrolled_courses_by_timeline_classification", args: { offset: 0, limit: 0, classification: "all", sort: "fullname", customfieldname: "", customfieldvalue: "" } }]),
          });
          const d = JSON.parse(await r.text());
          if (Array.isArray(d) && d[0]?.data?.courses) courses = d[0].data.courses;
        } catch { /* ignore */ }
      }

      // ── AJAX: calendar events ─────────────────────────────────────────────
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const from = Math.floor(todayStart.getTime() / 1000);
      const to = from + 365 * 24 * 60 * 60;
      let events: any[] = [];

      if (sesskey) {
        // Minimal params only — this Moodle version rejects extra fields like aftereventid/limitskip
        try {
          const r1 = await fetch(`${base}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ index: 0, methodname: "core_calendar_get_action_events_by_timesort", args: { timesortfrom: from, timesortto: to, limitnum: 50 } }]),
          });
          const d1 = JSON.parse(await r1.text());
          if (Array.isArray(d1) && !d1[0]?.error && d1[0]?.data?.events) events.push(...d1[0].data.events);
        } catch { /* ignore */ }

        try {
          const r2 = await fetch(`${base}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_upcoming_view`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ index: 0, methodname: "core_calendar_get_upcoming_view", args: { courseid: 0, categoryid: 0 } }]),
          });
          const d2 = JSON.parse(await r2.text());
          if (Array.isArray(d2) && !d2[0]?.error) {
            if (d2[0]?.data?.events) events.push(...d2[0].data.events);
            if (d2[0]?.data?.upcomingview?.events) events.push(...d2[0].data.upcomingview.events);
          }
        } catch { /* ignore */ }
      }

      // ── DOM scrape — always run ───────────────────────────────────────────
      const domEvents: any[] = [];
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-event-id]"));
      for (const el of els) {
        const id = el.getAttribute("data-event-id") ?? "";
        if (!id) continue;

        // Name: <h3 class="name d-inline-block">X is due</h3>
        const nameEl = el.querySelector<HTMLElement>("h3.name");
        const name = (nameEl?.textContent?.trim() ?? "").replace(/\s+is due$/i, "").trim();
        if (!name) continue;

        // Course: <a href="/course/view.php?id=1437">Computer Networks Lab...</a>
        const courseLink = el.querySelector<HTMLAnchorElement>("a[href*='course/view.php']");
        const courseIdMatch = courseLink?.href.match(/[?&]id=(\d+)/);
        const courseId = courseIdMatch?.[1] ?? "";
        const courseName = courseLink?.textContent?.trim() ?? "";

        // Date: the day-link has ?view=day&time=UNIXTIMESTAMP — perfectly precise
        // e.g. <a href="/calendar/view.php?view=day&time=1775124000">Today</a>, 3:30 PM
        const dayLink = el.querySelector<HTMLAnchorElement>("a[href*='view=day']");
        const tsMatch = dayLink?.href.match(/[?&]time=(\d+)/);
        const unixTs = tsMatch ? parseInt(tsMatch[1], 10) : 0;

        // The time text (", 3:30 PM") is a text node right after the day link
        // Get it from the parent col-11 div's full text, strip the link text
        const whenDiv = el.querySelector<HTMLElement>(".col-11");
        const whenText = (whenDiv?.textContent?.trim() ?? "").replace(/\s+/g, " ");
        // whenText: "Today, 3:30 PM" or "Sunday, 5 April, 11:59 PM"
        // Extract time part after last comma
        const timeMatch = whenText.match(/,\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*$/i);
        const timePart = timeMatch?.[1]?.trim() ?? "";

        // Build final timestamp: use unix base date + parse time part for accuracy
        let unixFinal = unixTs;
        if (unixTs && timePart) {
          const base = new Date(unixTs * 1000);
          const isPM = /pm/i.test(timePart);
          const isAM = /am/i.test(timePart);
          const [hStr, mStr] = timePart.replace(/\s*(AM|PM)/i, "").split(":");
          let h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          if (isPM && h !== 12) h += 12;
          if (isAM && h === 12) h = 0;
          if (!isNaN(h) && !isNaN(m)) {
            base.setHours(h, m, 0, 0);
            unixFinal = Math.floor(base.getTime() / 1000);
          }
        }

        domEvents.push({ id, name, courseId, courseName, unixTs: unixFinal });
      }

      return { sesskey, courses, events, domEvents };
    }, LMS_BASE);

    // ── 4. Merge events ───────────────────────────────────────────────────────
    // domEvents are raw DOM scraped objects, events are Moodle API objects
    const now_dt = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    // Parse DOM date strings like "2 April 2026, 3:30 PM" or "Sunday, 5 April 2026, 11:59 PM"
    function parseDomDate(text: string): Date | null {
      if (!text) return null;
      // Strip leading weekday if present
      const stripped = text.replace(/^[A-Za-z]+,\s*/, "").trim();
      const d = new Date(stripped);
      if (!isNaN(d.getTime())) return d;
      return null;
    }

    // ── 5. Upsert courses ────────────────────────────────────────────────────
    let rawCourses: any[] = scraped.courses;

    // If AJAX gave no courses, scrape course links from dashboard HTML
    if (rawCourses.length === 0) {
      await page.goto(`${LMS_BASE}/my/`, { waitUntil: "networkidle2" });
      const html = await page.content();
      const $ = load(html);
      $("a[href*='/course/view.php?id=']").each((_: number, el: any) => {
        const href = $(el).attr("href") ?? "";
        const m = href.match(/id=(\d+)/);
        if (!m) return;
        const id = m[1];
        if (!rawCourses.find((c: any) => String(c.id) === id)) {
          rawCourses.push({ id, fullname: $(el).text().trim() || `Course ${id}`, shortname: null, coursecategory: null });
        }
      });
    }

    for (const c of rawCourses) {
      await prisma.lmsCourse.upsert({
        where: { userId_lmsCourseId: { userId, lmsCourseId: String(c.id) } },
        create: {
          userId, lmsCourseId: String(c.id),
          fullName: c.fullname ?? c.displayname ?? "Unknown",
          shortName: c.shortname ?? null,
          category: c.coursecategory ?? null,
          syncedAt: now_dt,
        },
        update: {
          fullName: c.fullname ?? c.displayname ?? "Unknown",
          shortName: c.shortname ?? null,
          category: c.coursecategory ?? null,
          syncedAt: now_dt,
        },
      });
    }

    // ── 6. Upsert AJAX events ────────────────────────────────────────────────
    let totalAssignments = 0;
    const seenIds = new Set<string>();

    for (const ev of scraped.events) {
      const key = String(ev.id);
      if (seenIds.has(key)) continue;
      seenIds.add(key);

      const courseId = String(ev.course?.id ?? ev.courseid ?? "0");
      if (courseId === "0") continue;

      const dueDate = ev.timesort ? new Date(ev.timesort * 1000) : null;
      const submitted = ev.action != null && ev.action.actionable === false;

      await prisma.lmsCourse.upsert({
        where: { userId_lmsCourseId: { userId, lmsCourseId: courseId } },
        create: {
          userId, lmsCourseId: courseId,
          fullName: ev.course?.fullname ?? ev.course?.displayname ?? "Unknown",
          shortName: ev.course?.shortname ?? null,
          syncedAt: now_dt,
        },
        update: {
          fullName: ev.course?.fullname ?? ev.course?.displayname ?? "Unknown",
          shortName: ev.course?.shortname ?? null,
          syncedAt: now_dt,
        },
      });

      // Use activityname (clean) if available, fall back to name (has "is due" suffix)
      const cleanName = (ev.activityname ?? ev.name ?? "Untitled").replace(/\s+is due$/i, "").trim();

      await prisma.lmsAssignment.upsert({
        where: { userId_lmsAssignmentId: { userId, lmsAssignmentId: key } },
        create: {
          userId, lmsCourseId: courseId, lmsAssignmentId: key,
          name: cleanName,
          dueDate, cutOffDate: null, allowSubmissions: true,
          submitted, description: null, syncedAt: now_dt,
        },
        update: { name: cleanName, dueDate, submitted, syncedAt: now_dt },
      });

      totalAssignments++;
    }

    // ── 7. Upsert DOM-scraped events ─────────────────────────────────────────
    for (const ev of scraped.domEvents) {
      const key = `dom_${ev.id}`;
      if (seenIds.has(key)) continue;
      seenIds.add(key);

      const dueDate: Date | null = ev.unixTs ? new Date(ev.unixTs * 1000) : null;

      const courseId: string = ev.courseId || `dom_${ev.id}`;
      const courseName: string = ev.courseName || "Unknown Course";

      console.log(`[LMS] DOM event ${ev.id}: name="${ev.name}" courseId="${courseId}" courseName="${courseName}" dueDate="${dueDate?.toISOString()}"`);

      // Upsert course — always update fullName so stale "Unknown Course" gets fixed
      await prisma.lmsCourse.upsert({
        where: { userId_lmsCourseId: { userId, lmsCourseId: courseId } },
        create: { userId, lmsCourseId: courseId, fullName: courseName, syncedAt: now_dt },
        update: { fullName: courseName, syncedAt: now_dt },
      });

      await prisma.lmsAssignment.upsert({
        where: { userId_lmsAssignmentId: { userId, lmsAssignmentId: key } },
        create: {
          userId, lmsCourseId: courseId, lmsAssignmentId: key,
          name: ev.name, dueDate, cutOffDate: null,
          allowSubmissions: true, submitted: false,
          description: null, syncedAt: now_dt,
        },
        update: { name: ev.name, dueDate, lmsCourseId: courseId, syncedAt: now_dt },
      });

      totalAssignments++;
    }

    // ── 8. Scrape each course page for all modules ────────────────────────────
    // Types we care about: assign, quiz, resource, folder, url, page
    const SKIP_TYPES = new Set(["forum", "label", "feedback"]);
    let totalModules = 0;

    for (const c of rawCourses) {
      const courseId = String(c.id);
      try {
        await page.goto(`${LMS_BASE}/course/view.php?id=${courseId}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const modules: { moduleId: string; modtype: string; name: string; href: string; accessible: boolean }[] =
          await page.evaluate(() => {
            const results: { moduleId: string; modtype: string; name: string; href: string; accessible: boolean }[] = [];
            const els = Array.from(document.querySelectorAll<HTMLElement>(".activity"));
            for (const el of els) {
              const modtype = (el.className.match(/modtype_(\w+)/) ?? [])[1] ?? "";
              if (!modtype) continue;
              const nameEl = el.querySelector<HTMLElement>("[data-activityname], .instancename, .activitytitle .media-body");
              const name = el.getAttribute("data-activityname")
                ?? el.querySelector<HTMLElement>(".activitytitle .media-body, .instancename")?.childNodes[0]?.textContent?.trim()
                ?? nameEl?.textContent?.trim()
                ?? "";
              if (!name) continue;
              const link = el.querySelector<HTMLAnchorElement>("a[href*='/mod/']");
              const href = link?.href ?? "";
              const idMatch = href.match(/[?&]id=(\d+)/);
              const moduleId = idMatch ? idMatch[1] : (el.getAttribute("id") ?? "");
              if (!moduleId) continue;
              const accessible = !!idMatch;
              results.push({ moduleId, modtype, name, href, accessible });
            }
            return results;
          });

        for (const mod of modules) {
          if (SKIP_TYPES.has(mod.modtype)) continue;
          await prisma.lmsModule.upsert({
            where: { userId_lmsCourseId_moduleId: { userId, lmsCourseId: courseId, moduleId: mod.moduleId } },
            create: {
              userId, lmsCourseId: courseId, moduleId: mod.moduleId,
              modtype: mod.modtype, name: mod.name,
              href: mod.href || null, accessible: mod.accessible, syncedAt: now_dt,
            },
            update: {
              modtype: mod.modtype, name: mod.name,
              href: mod.href || null, accessible: mod.accessible, syncedAt: now_dt,
            },
          });
          totalModules++;
        }
      } catch {
        // Skip courses that fail (e.g. restricted access) and continue
      }
    }

    return {
      courses: rawCourses.length,
      assignments: totalAssignments,
      modules: totalModules,
      message: `Synced ${rawCourses.length} courses, ${totalAssignments} calendar events, ${totalModules} course modules.`,
    };
  } finally {
    await browser.close();
  }
}

// ─── Debug: tells us exactly what the browser sees ────────────────────────────

export async function debugLmsSync(userId: string, username: string, password: string) {
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Login
    await page.goto(`${LMS_BASE}/login/index.php`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#username", { visible: true });
    await page.evaluate(
      (u: string, p: string) => {
        (document.querySelector("#username") as HTMLInputElement).value = u;
        (document.querySelector("#password") as HTMLInputElement).value = p;
      },
      username,
      password
    );
    await Promise.all([page.click("#loginbtn"), page.waitForNavigation({ waitUntil: "networkidle2" })]);

    if (page.url().includes("login/index.php")) throw new Error("Login failed");

    // Go to calendar upcoming page
    await page.goto(`${LMS_BASE}/calendar/view.php?view=upcoming`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));

    const debug = await page.evaluate(async (base: string) => {
      // Sesskey (no named functions — tsx __name issue)
      let sesskey: string = (window as any).M?.cfg?.sesskey ?? "";
      if (!sesskey) {
        const inp = document.querySelector<HTMLInputElement>('input[name="sesskey"]');
        if (inp?.value) sesskey = inp.value;
      }
      if (!sesskey) {
        for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='sesskey=']"))) {
          const m = a.href.match(/sesskey=([a-zA-Z0-9]+)/);
          if (m) { sesskey = m[1]; break; }
        }
      }
      if (!sesskey) {
        const m = document.documentElement.outerHTML.match(/"sesskey":"([^"]+)"/);
        if (m) sesskey = m[1];
      }

      // What data-event-id elements exist?
      const eventIds = Array.from(document.querySelectorAll("[data-event-id],[data-eventid]"))
        .map((el) => el.getAttribute("data-event-id") ?? el.getAttribute("data-eventid"));

      // What assign links exist on the page?
      const assignLinks = Array.from(document.querySelectorAll("a[href*='mod/assign']"))
        .map((a) => ({ text: (a as HTMLAnchorElement).textContent?.trim(), href: (a as HTMLAnchorElement).href }))
        .slice(0, 20);

      // DOM event details — dump full innerHTML of first card so we can see exact structure
      const domEventDetails = Array.from(document.querySelectorAll<HTMLElement>("[data-event-id]")).map((el) => {
        const id = el.getAttribute("data-event-id");
        const refLink = el.querySelector<HTMLAnchorElement>("a[href*='course/view.php']");
        const courseIdMatch = refLink?.href.match(/[?&]id=(\d+)/);
        const allLinks = Array.from(el.querySelectorAll<HTMLAnchorElement>("a")).map((a) => ({ text: a.textContent?.trim(), href: a.href }));
        const fullText = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        return {
          id,
          courseIdFromHref: courseIdMatch?.[1],
          courseLinkText: refLink?.textContent?.trim(),
          allLinks,
          fullText: fullText.slice(0, 400),
          fullHTML: el.innerHTML.slice(0, 1500),
        };
      });

      // Try AJAX with sesskey
      let ajaxResult: any = { error: "no sesskey" };
      if (sesskey) {
        try {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const from = Math.floor(todayStart.getTime() / 1000);
          const to = from + 365 * 24 * 60 * 60;
          const r = await fetch(`${base}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ index: 0, methodname: "core_calendar_get_action_events_by_timesort", args: { timesortfrom: from, timesortto: to, limitnum: 50 } }]),
          });
          const text = await r.text();
          ajaxResult = { status: r.status, preview: text.slice(0, 500) };
        } catch (e: any) { ajaxResult = { error: e.message }; }
      }

      // First 300 chars of body text
      const bodyText = document.body.innerText.slice(0, 500);

      return { sesskey: sesskey ? sesskey.slice(0, 10) + "..." : "(none)", eventIds, assignLinks, ajaxResult, domEventDetails, bodyText, url: window.location.href, courseIds: Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='course/view.php']")).map(a => ({ text: a.textContent?.trim(), href: a.href })).slice(0, 5) };
    }, LMS_BASE);

    return debug;
  } finally {
    await browser.close();
  }
}

// ─── Debug: scrape a single course page to see module structure ───────────────

export async function debugLmsCourse(userId: string, username: string, password: string, courseId: string) {
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(`${LMS_BASE}/login/index.php`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#username", { visible: true });
    await page.evaluate((u: string, p: string) => {
      (document.querySelector("#username") as HTMLInputElement).value = u;
      (document.querySelector("#password") as HTMLInputElement).value = p;
    }, username, password);
    await Promise.all([page.click("#loginbtn"), page.waitForNavigation({ waitUntil: "networkidle2" })]);
    if (page.url().includes("login/index.php")) throw new Error("Login failed");

    await page.goto(`${LMS_BASE}/course/view.php?id=${courseId}`, { waitUntil: "networkidle2" });

    const result = await page.evaluate(() => {
      // All activity modules on this course page
      const modules = Array.from(document.querySelectorAll<HTMLElement>(".activity")).map((el) => {
        const modtype = el.classList.toString().match(/modtype_(\w+)/)?.[1] ?? "";
        const nameEl = el.querySelector<HTMLElement>(".instancename, .activityinstance .instancename, h3");
        const name = nameEl?.childNodes[0]?.textContent?.trim() ?? nameEl?.textContent?.trim() ?? "";
        const link = el.querySelector<HTMLAnchorElement>("a");
        const href = link?.href ?? "";
        const id = href.match(/[?&]id=(\d+)/)?.[1] ?? el.getAttribute("id") ?? "";
        return { modtype, name, href, id };
      });

      // Full raw HTML of first 3 modules so we can inspect structure
      const moduleHTMLSamples = Array.from(document.querySelectorAll<HTMLElement>(".activity")).slice(0, 5).map((el) => ({
        classList: el.className,
        innerHTML: el.innerHTML.slice(0, 600),
      }));

      // Section names
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".section-name, .sectionname, h3.section-title")).map(el => el.textContent?.trim());

      return { modules, moduleHTMLSamples, sections, url: window.location.href };
    });

    return result;
  } finally {
    await browser.close();
  }
}

// ─── DB read helpers ──────────────────────────────────────────────────────────

export async function getLmsCourses(userId: string) {
  return prisma.lmsCourse.findMany({
    where: { userId },
    orderBy: { fullName: "asc" },
    include: { assignments: { orderBy: { dueDate: "asc" } } },
  });
}

export async function getLmsAssignments(userId: string) {
  return prisma.lmsAssignment.findMany({
    where: { userId },
    orderBy: { dueDate: "asc" },
    include: { course: { select: { fullName: true, shortName: true } } },
  });
}

export async function getLmsModules(userId: string, lmsCourseId?: string) {
  return prisma.lmsModule.findMany({
    where: { userId, ...(lmsCourseId ? { lmsCourseId } : {}) },
    orderBy: [{ modtype: "asc" }, { name: "asc" }],
    include: { course: { select: { fullName: true, shortName: true } } },
  });
}

export async function getLmsUpcoming(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return prisma.lmsAssignment.findMany({
    where: {
      userId,
      submitted: false,
      OR: [
        { dueDate: { gte: todayStart } },
        { dueDate: null },
      ],
    },
    orderBy: [{ dueDate: "asc" }],
    include: { course: { select: { fullName: true, shortName: true } } },
  });
}
