import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type SortBy = "dueDate" | "priority" | "createdAt" | "title";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: Priority;
  courseId?: string;
  assignmentId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: Priority;
  isCompleted?: boolean;
  courseId?: string | null;
  assignmentId?: string | null;
}

export interface ListTasksFilter {
  courseId?: string;
  assignmentId?: string;
  isCompleted?: boolean;
  priority?: Priority;
  sortBy?: SortBy;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });
  if (!task) throw new AppError("Task not found", 404);
  return task;
}

async function assertCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null, semester: { userId, deletedAt: null } },
  });
  if (!course) throw new AppError("Course not found", 404);
}

async function assertAssignmentOwnership(
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
}

/**
 * Priority has natural ordering for sorting: HIGH > MEDIUM > LOW.
 * Postgres doesn't know this, so we map to an integer via a CASE expression.
 * With Prisma's raw orderBy we replicate this by requesting multiple sort keys
 * in the right order.
 */
function buildOrderBy(sortBy: SortBy): Prisma.TaskOrderByWithRelationInput[] {
  switch (sortBy) {
    case "dueDate":
      // nulls last — put tasks without a due date at the bottom
      return [{ dueDate: "asc" }, { createdAt: "desc" }];
    case "priority":
      // Prisma enum sort is alphabetical (HIGH < LOW < MEDIUM), so we add
      // a secondary createdAt sort for stability and handle ordering in the
      // service by fetching all and sorting in JS (only done when explicitly
      // requested — avoids N+1 and keeps the query simple).
      return [{ priority: "desc" }, { createdAt: "desc" }];
    case "title":
      return [{ title: "asc" }];
    case "createdAt":
    default:
      return [{ createdAt: "desc" }];
  }
}

/** Sort HIGH > MEDIUM > LOW in application code after DB fetch. */
const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/tasks \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"title":"Review notes","priority":"HIGH","dueDate":"2025-10-01","courseId":"<id>"}'
 */
export async function createTask(userId: string, input: CreateTaskInput) {
  if (input.courseId) await assertCourseOwnership(input.courseId, userId);
  if (input.assignmentId) await assertAssignmentOwnership(input.assignmentId, userId);

  return prisma.task.create({
    data: { ...input, userId },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
      assignment: { select: { id: true, title: true, dueDate: true } },
    },
  });
}

/*
 * curl "http://localhost:4000/api/tasks?isCompleted=false&priority=HIGH&sortBy=dueDate" \
 *   -H "Authorization: Bearer <token>"
 *
 * curl "http://localhost:4000/api/tasks?courseId=<id>&sortBy=priority" \
 *   -H "Authorization: Bearer <token>"
 */
export async function listTasks(userId: string, filter: ListTasksFilter) {
  const where: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    ...(filter.courseId ? { courseId: filter.courseId } : {}),
    ...(filter.assignmentId ? { assignmentId: filter.assignmentId } : {}),
    ...(filter.isCompleted !== undefined
      ? { isCompleted: filter.isCompleted }
      : {}),
    ...(filter.priority ? { priority: filter.priority } : {}),
  };

  const orderBy = buildOrderBy(filter.sortBy ?? "createdAt");

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
      assignment: { select: { id: true, title: true, dueDate: true } },
    },
  });

  if (filter.sortBy === "priority") {
    tasks.sort(
      (a, b) =>
        PRIORITY_ORDER[b.priority as Priority] -
        PRIORITY_ORDER[a.priority as Priority]
    );
  }

  return tasks;
}

/*
 * curl http://localhost:4000/api/tasks/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
      assignment: { select: { id: true, title: true, dueDate: true } },
    },
  });
  if (!task) throw new AppError("Task not found", 404);
  return task;
}

/*
 * curl -X PUT http://localhost:4000/api/tasks/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"isCompleted":true}'
 */
export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput
) {
  await assertTaskOwnership(taskId, userId);
  if (input.courseId) await assertCourseOwnership(input.courseId, userId);
  if (input.assignmentId)
    await assertAssignmentOwnership(input.assignmentId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: input,
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
      assignment: { select: { id: true, title: true, dueDate: true } },
    },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/tasks/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteTask(taskId: string, userId: string) {
  await assertTaskOwnership(taskId, userId);
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
}
