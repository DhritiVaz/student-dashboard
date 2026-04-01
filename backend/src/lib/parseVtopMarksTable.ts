import { load } from "cheerio";

/** Parsed mark row from a generic VTOP-style HTML table (used by tests and scraper). */
export interface ParsedMarkRow {
  courseCode: string;
  component: string;
  scored: number;
  maxScore: number;
}

const CODE_RE = /^[A-Z]{2,6}\d{2,}[A-Z0-9]*$/i;

/**
 * Best-effort extraction of course / component / score rows.
 * Conservative: skips rows without a plausible course code.
 */
export function parseVtopMarksTableHtml(html: string): ParsedMarkRow[] {
  const $ = load(html);
  const out: ParsedMarkRow[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
    if (cells.length < 3) return;
    let courseIdx = -1;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i].replace(/\s/g, "");
      if (CODE_RE.test(c)) {
        courseIdx = i;
        break;
      }
    }
    if (courseIdx < 0) return;
    const courseCode = cells[courseIdx].replace(/\s/g, "").toUpperCase();
    const component = cells[0] && cells[0].length < 80 ? cells[0] : "Component";
    const nums = cells
      .map((x) => parseFloat(x.replace(/[^\d.-]/g, "")))
      .filter((n) => !Number.isNaN(n));
    if (nums.length < 1) return;
    const maxScore = nums.length >= 2 ? nums[nums.length - 1] : 100;
    const scored = nums.length >= 2 ? nums[nums.length - 2] : nums[nums.length - 1];
    out.push({ courseCode, component, scored, maxScore });
  });

  return out;
}
