import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateNoteInput {
  courseId: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface ListNotesFilter {
  courseId?: string;
  tags?: string[];   // any note containing ALL of these tags
  search?: string;   // title or content substring
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve courseId → userId. A note must always live under a course the user owns. */
async function assertCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null, semester: { userId, deletedAt: null } },
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

async function assertNoteOwnership(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      deletedAt: null,
      course: { deletedAt: null, semester: { userId, deletedAt: null } },
    },
  });
  if (!note) throw new AppError("Note not found", 404);
  return note;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/notes \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"courseId":"<id>","title":"Lecture 1","content":"## Intro\n...","tags":["lecture","week1"]}'
 */
export async function createNote(userId: string, input: CreateNoteInput) {
  await assertCourseOwnership(input.courseId, userId);
  return prisma.note.create({
    data: { ...input, tags: input.tags ?? [] },
  });
}

/*
 * curl "http://localhost:4000/api/notes?courseId=<id>&tags=lecture,week1" \
 *   -H "Authorization: Bearer <token>"
 *
 * curl "http://localhost:4000/api/notes?search=binary+tree" \
 *   -H "Authorization: Bearer <token>"
 */
export async function listNotes(userId: string, filter: ListNotesFilter) {
  // Build where clause; all conditions are ANDed together.
  const where: Prisma.NoteWhereInput = {
    deletedAt: null,
    course: { deletedAt: null, semester: { userId, deletedAt: null } },
    ...(filter.courseId ? { courseId: filter.courseId } : {}),
    // Prisma array filter: every tag in the filter must appear in the note's tags array
    ...(filter.tags?.length
      ? { tags: { hasEvery: filter.tags } }
      : {}),
    // Full-text-like: case-insensitive substring on title OR content in one query
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" } },
            { content: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.note.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    // Include course name + code so the client doesn't need a second round-trip
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
}

/*
 * curl http://localhost:4000/api/notes/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getNote(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      deletedAt: null,
      course: { deletedAt: null, semester: { userId, deletedAt: null } },
    },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
  if (!note) throw new AppError("Note not found", 404);
  return note;
}

/*
 * curl -X PUT http://localhost:4000/api/notes/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"tags":["lecture","week1","important"]}'
 */
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
) {
  await assertNoteOwnership(noteId, userId);
  return prisma.note.update({
    where: { id: noteId },
    data: input,
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/notes/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteNote(noteId: string, userId: string) {
  await assertNoteOwnership(noteId, userId);
  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
}
