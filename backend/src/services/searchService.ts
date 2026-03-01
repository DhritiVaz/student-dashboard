import { prisma } from "../lib/prisma";

const LIMIT = 3;
const mode  = "insensitive" as const;

export async function searchAll(q: string, userId: string) {
  if (!q.trim()) {
    return { courses: [], assignments: [], notes: [], tasks: [] };
  }

  const [courses, assignments, notes, tasks] = await Promise.all([
    // Courses: search name OR code
    prisma.course.findMany({
      where: {
        deletedAt: null,
        semester: { userId, deletedAt: null },
        OR: [
          { name: { contains: q, mode } },
          { code: { contains: q, mode } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        semester: { select: { id: true, name: true } },
      },
      take: LIMIT,
    }),

    // Assignments: search title
    prisma.assignment.findMany({
      where: {
        deletedAt: null,
        title: { contains: q, mode },
        course: {
          deletedAt: null,
          semester: { userId, deletedAt: null },
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        isSubmitted: true,
        course: { select: { id: true, name: true, code: true } },
      },
      take: LIMIT,
    }),

    // Notes: search title
    prisma.note.findMany({
      where: {
        deletedAt: null,
        title: { contains: q, mode },
        course: {
          deletedAt: null,
          semester: { userId, deletedAt: null },
        },
      },
      select: {
        id: true,
        title: true,
        course: { select: { id: true, name: true, code: true } },
      },
      take: LIMIT,
    }),

    // Tasks: search title (tasks have direct userId)
    prisma.task.findMany({
      where: {
        deletedAt: null,
        userId,
        title: { contains: q, mode },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        isCompleted: true,
      },
      take: LIMIT,
    }),
  ]);

  return { courses, assignments, notes, tasks };
}
