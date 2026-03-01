import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAssignmentInput {
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  weight: number;
  isSubmitted?: boolean;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  weight?: number;
  isSubmitted?: boolean;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve courseId → userId ownership chain. */
async function assertCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null, semester: { userId, deletedAt: null } },
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

/** Resolve assignmentId → courseId → userId ownership chain. */
export async function assertAssignmentOwnership(
  assignmentId: string,
  userId: string
) {
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      deletedAt: null,
      course: { deletedAt: null, semester: { userId, deletedAt: null } },
    },
  });
  if (!assignment) throw new AppError("Assignment not found", 404);
  return assignment;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/assignments \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"courseId":"<id>","title":"Midterm","dueDate":"2025-10-15","weight":30}'
 */
export async function createAssignment(
  userId: string,
  input: CreateAssignmentInput
) {
  await assertCourseOwnership(input.courseId, userId);
  await validateWeightBudget(input.courseId, input.weight);

  return prisma.assignment.create({ data: input });
}

/*
 * curl "http://localhost:4000/api/assignments?courseId=<id>" \
 *   -H "Authorization: Bearer <token>"
 */
export async function listAssignments(userId: string, courseId?: string) {
  const where: Prisma.AssignmentWhereInput = {
    deletedAt: null,
    course: { deletedAt: null, semester: { userId, deletedAt: null } },
    ...(courseId ? { courseId } : {}),
  };

  return prisma.assignment.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: { grades: true },
  });
}

/*
 * curl http://localhost:4000/api/assignments/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getAssignment(assignmentId: string, userId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      deletedAt: null,
      course: { deletedAt: null, semester: { userId, deletedAt: null } },
    },
    include: { grades: true },
  });
  if (!assignment) throw new AppError("Assignment not found", 404);
  return assignment;
}

/*
 * curl -X PUT http://localhost:4000/api/assignments/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"weight":25,"isSubmitted":true,"status":"SUBMITTED"}'
 */
export async function updateAssignment(
  assignmentId: string,
  userId: string,
  input: UpdateAssignmentInput
) {
  const assignment = await assertAssignmentOwnership(assignmentId, userId);

  if (input.weight !== undefined && input.weight !== assignment.weight) {
    await validateWeightBudget(assignment.courseId, input.weight, assignmentId);
  }

  return prisma.assignment.update({
    where: { id: assignmentId },
    data: input,
    include: { grades: true },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/assignments/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteAssignment(assignmentId: string, userId: string) {
  await assertAssignmentOwnership(assignmentId, userId);
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { deletedAt: new Date() },
  });
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/**
 * Ensure total assignment weights for a course don't exceed 100.
 * excludeId lets an update skip its own current weight in the sum.
 */
async function validateWeightBudget(
  courseId: string,
  newWeight: number,
  excludeId?: string
) {
  const existing = await prisma.assignment.findMany({
    where: { courseId, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { weight: true },
  });
  const totalUsed = existing.reduce((sum, a) => sum + a.weight, 0);
  if (totalUsed + newWeight > 100) {
    throw new AppError(
      `Weight budget exceeded: ${totalUsed}% already allocated, adding ${newWeight}% would exceed 100%`,
      400
    );
  }
}
