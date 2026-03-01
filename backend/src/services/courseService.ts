import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCourseInput {
  semesterId: string;
  name: string;
  code: string;
  instructor?: string;
  description?: string;
  color?: string;
  credits: number;
}

export interface UpdateCourseInput {
  name?: string;
  code?: string;
  instructor?: string | null;
  description?: string | null;
  color?: string;
  credits?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verify the semester belongs to the user before touching a course. */
async function assertSemesterOwnership(semesterId: string, userId: string) {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId, deletedAt: null },
  });
  if (!semester) throw new AppError("Semester not found", 404);
  return semester;
}

/** Verify the course exists and belongs to the user (via its semester). */
async function assertCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      deletedAt: null,
      semester: { userId, deletedAt: null },
    },
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/courses \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"semesterId":"<id>","name":"Algorithms","code":"CS301","credits":3}'
 */
export async function createCourse(userId: string, input: CreateCourseInput) {
  await assertSemesterOwnership(input.semesterId, userId);

  const duplicate = await prisma.course.findFirst({
    where: {
      semesterId: input.semesterId,
      code: input.code,
      deletedAt: null,
    },
  });
  if (duplicate) {
    throw new AppError(
      `A course with code "${input.code}" already exists in this semester`,
      409
    );
  }

  return prisma.course.create({ data: input });
}

/*
 * curl "http://localhost:4000/api/courses?semesterId=<id>" \
 *   -H "Authorization: Bearer <token>"
 */
export async function listCourses(userId: string, semesterId?: string) {
  return prisma.course.findMany({
    where: {
      deletedAt: null,
      semester: { userId, deletedAt: null },
      ...(semesterId ? { semesterId } : {}),
    },
    orderBy: [{ semesterId: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          assignments: { where: { deletedAt: null } },
          notes: { where: { deletedAt: null } },
        },
      },
    },
  });
}

/*
 * curl http://localhost:4000/api/courses/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getCourse(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      deletedAt: null,
      semester: { userId, deletedAt: null },
    },
    include: {
      assignments: {
        where: { deletedAt: null },
        orderBy: { dueDate: "asc" },
        include: { grades: true },
      },
      notes: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
      },
      calendarEvents: {
        where: { deletedAt: null },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

/*
 * curl -X PUT http://localhost:4000/api/courses/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Advanced Algorithms","credits":4}'
 */
export async function updateCourse(
  courseId: string,
  userId: string,
  input: UpdateCourseInput
) {
  const course = await assertCourseOwnership(courseId, userId);

  if (input.code && input.code !== course.code) {
    const duplicate = await prisma.course.findFirst({
      where: {
        semesterId: course.semesterId,
        code: input.code,
        deletedAt: null,
        NOT: { id: courseId },
      },
    });
    if (duplicate) {
      throw new AppError(
        `A course with code "${input.code}" already exists in this semester`,
        409
      );
    }
  }

  return prisma.course.update({ where: { id: courseId }, data: input });
}

/*
 * curl -X DELETE http://localhost:4000/api/courses/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteCourse(courseId: string, userId: string) {
  await assertCourseOwnership(courseId, userId);

  const now = new Date();
  await prisma.$transaction([
    prisma.assignment.updateMany({
      where: { courseId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.note.updateMany({
      where: { courseId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.calendarEvent.updateMany({
      where: { courseId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: now },
    }),
  ]);
}
