import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { assertAssignmentOwnership } from "./assignmentService";
import type { GpaBreakdownItem, GpaResult } from "@student-dashboard/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateGradeInput {
  assignmentId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface UpdateGradeInput {
  score?: number;
  maxScore?: number;
  feedback?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertGradeOwnership(gradeId: string, userId: string) {
  const grade = await prisma.grade.findFirst({
    where: {
      id: gradeId,
      assignment: {
        deletedAt: null,
        course: { deletedAt: null, semester: { userId, deletedAt: null } },
      },
    },
  });
  if (!grade) throw new AppError("Grade not found", 404);
  return grade;
}

function validateScoreAgainstMax(score: number, maxScore: number) {
  if (score > maxScore) {
    throw new AppError(
      `score (${score}) cannot exceed maxScore (${maxScore})`,
      400
    );
  }
  if (maxScore <= 0) {
    throw new AppError("maxScore must be greater than 0", 400);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/grades \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"assignmentId":"<id>","score":87,"maxScore":100,"feedback":"Good work!"}'
 */
export async function createGrade(userId: string, input: CreateGradeInput) {
  await assertAssignmentOwnership(input.assignmentId, userId);
  validateScoreAgainstMax(input.score, input.maxScore);

  const existing = await prisma.grade.findUnique({
    where: { assignmentId: input.assignmentId },
  });
  if (existing) {
    throw new AppError(
      "A grade already exists for this assignment. Use PUT to update it.",
      409
    );
  }

  // Auto-advance assignment status to GRADED
  const [grade] = await prisma.$transaction([
    prisma.grade.create({ data: input }),
    prisma.assignment.update({
      where: { id: input.assignmentId },
      data: { status: "GRADED", isSubmitted: true },
    }),
  ]);
  return grade;
}

/*
 * curl "http://localhost:4000/api/grades?assignmentId=<id>" \
 *   -H "Authorization: Bearer <token>"
 */
export async function listGrades(userId: string, assignmentId?: string) {
  return prisma.grade.findMany({
    where: {
      assignment: {
        deletedAt: null,
        course: { deletedAt: null, semester: { userId, deletedAt: null } },
      },
      ...(assignmentId ? { assignmentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assignment: { select: { title: true, weight: true, courseId: true } },
    },
  });
}

/*
 * curl -X PUT http://localhost:4000/api/grades/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"score":92}'
 */
export async function updateGrade(
  gradeId: string,
  userId: string,
  input: UpdateGradeInput
) {
  const existing = await assertGradeOwnership(gradeId, userId);

  const newScore = input.score ?? existing.score;
  const newMaxScore = input.maxScore ?? existing.maxScore;
  validateScoreAgainstMax(newScore, newMaxScore);

  return prisma.grade.update({
    where: { id: gradeId },
    data: input,
    include: {
      assignment: { select: { title: true, weight: true, courseId: true } },
    },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/grades/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteGrade(gradeId: string, userId: string) {
  const grade = await assertGradeOwnership(gradeId, userId);

  await prisma.$transaction([
    prisma.grade.delete({ where: { id: gradeId } }),
    // Revert assignment status when the grade is removed
    prisma.assignment.update({
      where: { id: grade.assignmentId },
      data: { status: "SUBMITTED" },
    }),
  ]);
}

// ─── GPA Calculation ──────────────────────────────────────────────────────────

/*
 * curl http://localhost:4000/api/courses/:id/gpa \
 *   -H "Authorization: Bearer <token>"
 *
 * Formula: gpa = sum(percentage * weight) / sum(graded weights)
 * where percentage = (score / maxScore) * 100
 */
export async function calculateCourseGpa(
  courseId: string,
  userId: string
): Promise<GpaResult> {
  // Verify course ownership
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      deletedAt: null,
      semester: { userId, deletedAt: null },
    },
  });
  if (!course) throw new AppError("Course not found", 404);

  const assignments = await prisma.assignment.findMany({
    where: { courseId, deletedAt: null },
    include: { grades: true },
    orderBy: { dueDate: "asc" },
  });

  const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

  const breakdown: GpaBreakdownItem[] = [];
  let weightedScoreSum = 0;
  let gradedWeightSum = 0;

  for (const assignment of assignments) {
    const grade = assignment.grades[0] ?? null;
    if (!grade) continue;

    const percentage = (grade.score / grade.maxScore) * 100;
    const weightedContribution = (percentage * assignment.weight) / 100;

    breakdown.push({
      assignmentId: assignment.id,
      title: assignment.title,
      weight: assignment.weight,
      score: grade.score,
      maxScore: grade.maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weightedContribution: Math.round(weightedContribution * 100) / 100,
    });

    weightedScoreSum += weightedContribution;
    gradedWeightSum += assignment.weight;
  }

  // GPA is null when no graded assignments exist yet
  const gpa =
    gradedWeightSum > 0
      ? Math.round((weightedScoreSum / gradedWeightSum) * 10000) / 100
      : null;

  return { courseId, gpa, totalWeight, gradedWeight: gradedWeightSum, breakdown };
}
