/**
 * VIT-style letter grades → grade points (10-point scale).
 * Used when VTOP shows a letter but omits numeric grade point, or to validate rows.
 */
const LETTER_GP: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 4,
  F: 0,
  N: 0,
  U: 0,
  P: 10, // pass / completed
  W: -1, // exclude from GPA
  I: -1,
  AB: -1,
  MP: -1,
};

/** Marks row as non-counting for credit-weighted GPA (withdrawn / incomplete). */
export function isExcludedFromGpa(grade: string | null | undefined): boolean {
  if (!grade) return false;
  const u = grade.replace(/\s/g, "").toUpperCase();
  return u === "W" || u === "I" || u === "AB" || u === "MP" || u === "-" || u === "—";
}

export function letterGradeToGradePoint(grade: string | null | undefined): number | null {
  if (grade == null) return null;
  const raw = String(grade).trim();
  if (!raw) return null;
  const u = raw.replace(/\s/g, "").toUpperCase();
  if (LETTER_GP[u] !== undefined) {
    const v = LETTER_GP[u];
    return v < 0 ? null : v;
  }
  const n = parseFloat(raw.replace(",", "."));
  if (Number.isFinite(n) && n >= 0 && n <= 10) return n;
  return null;
}

/** Prefer stored grade point; else map letter grade. */
export function effectiveGradePoint(
  grade: string | null | undefined,
  gradePoint: number | null | undefined
): number | null {
  if (gradePoint != null && Number.isFinite(gradePoint)) return gradePoint;
  return letterGradeToGradePoint(grade);
}
