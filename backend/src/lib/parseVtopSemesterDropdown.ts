import { load } from "cheerio";

export type VtopSemesterOption = { value: string; label: string };

/**
 * Extract semester `<select>` options from VTOP CC grade history or timetable HTML.
 */
export function parseSemesterSelectOptions(html: string): VtopSemesterOption[] {
  const $ = load(html);
  const out: VtopSemesterOption[] = [];
  const seen = new Set<string>();

  const addFrom = ($s: ReturnType<typeof $>) => {
    $s.find("option").each((_, opt) => {
      const value = $(opt).attr("value")?.trim() ?? "";
      const label = $(opt).text().replace(/\s+/g, " ").trim();
      if (!value) return;
      const low = label.toLowerCase();
      if (/^select\b|^choose\b|^--/.test(low)) return;
      if (seen.has(value)) return;
      seen.add(value);
      out.push({ value, label: label || value });
    });
  };

  const selectors = [
    'select[name="semesterSubId"]',
    'select[name="semSubId"]',
    'select#semesterSubId',
    'select[name*="semester" i]',
  ];
  for (const sel of selectors) {
    const $s = $(sel).first();
    if ($s.length && $s.find("option").length >= 2) {
      addFrom($s);
      if (out.length) return out;
    }
  }

  $("select").each((_, el) => {
    const $s = $(el);
    let chLike = 0;
    $s.find("option").each((__, o) => {
      const v = ($(o).attr("value") ?? "").trim();
      if (/^CH\d{4,}/i.test(v) || /^VL\d{4,}/i.test(v)) chLike++;
    });
    if (chLike >= 2) {
      seen.clear();
      out.length = 0;
      addFrom($s);
      return false;
    }
  });

  return out;
}
