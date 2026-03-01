import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSemesterInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateSemesterInput {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertOwnership(semesterId: string, userId: string) {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId, deletedAt: null },
  });
  if (!semester) throw new AppError("Semester not found", 404);
  return semester;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/semesters \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Fall 2025","startDate":"2025-08-25","endDate":"2025-12-15"}'
 */
export async function createSemester(
  userId: string,
  input: CreateSemesterInput
) {
  const duplicate = await prisma.semester.findFirst({
    where: { userId, name: input.name, deletedAt: null },
  });
  if (duplicate) {
    throw new AppError(
      `You already have a semester named "${input.name}"`,
      409
    );
  }

  return prisma.semester.create({
    data: { userId, ...input },
  });
}

/*
 * curl http://localhost:4000/api/semesters \
 *   -H "Authorization: Bearer <token>"
 */
export async function listSemesters(userId: string) {
  return prisma.semester.findMany({
    where: { userId, deletedAt: null },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { courses: { where: { deletedAt: null } } } } },
  });
}

/*
 * curl http://localhost:4000/api/semesters/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getSemester(semesterId: string, userId: string) {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId, deletedAt: null },
    include: {
      courses: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!semester) throw new AppError("Semester not found", 404);
  return semester;
}

/*
 * curl -X PUT http://localhost:4000/api/semesters/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Spring 2026"}'
 */
export async function updateSemester(
  semesterId: string,
  userId: string,
  input: UpdateSemesterInput
) {
  await assertOwnership(semesterId, userId);

  if (input.name) {
    const duplicate = await prisma.semester.findFirst({
      where: { userId, name: input.name, deletedAt: null, NOT: { id: semesterId } },
    });
    if (duplicate) {
      throw new AppError(
        `You already have a semester named "${input.name}"`,
        409
      );
    }
  }

  return prisma.semester.update({
    where: { id: semesterId },
    data: { ...input },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/semesters/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteSemester(semesterId: string, userId: string) {
  await assertOwnership(semesterId, userId);

  const now = new Date();
  // Soft-delete the semester and all its courses in a transaction
  await prisma.$transaction([
    prisma.course.updateMany({
      where: { semesterId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.semester.update({
      where: { id: semesterId },
      data: { deletedAt: now },
    }),
  ]);
}
