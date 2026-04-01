import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "student-files");
const MAX_BYTES = 40 * 1024 * 1024; // 40 MB

export function getUploadRoot() {
  return UPLOAD_ROOT;
}

export async function ensureUploadRoot() {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
}

function fileDir(userId: string) {
  return path.join(UPLOAD_ROOT, userId);
}

export function absolutePathForFile(userId: string, storedName: string) {
  return path.join(fileDir(userId), storedName);
}

export async function assertCourseOwned(userId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null, semester: { userId, deletedAt: null } },
    select: { id: true },
  });
  if (!course) throw new AppError("Course not found", 404);
}

export async function createStudentFile(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    courseId?: string | null;
    category?: string | null;
    storedName: string;
    originalName: string;
    mimeType?: string | null;
    sizeBytes: number;
  }
) {
  if (input.sizeBytes > MAX_BYTES) {
    throw new AppError("File too large (max 40 MB)", 400);
  }
  if (input.courseId) {
    await assertCourseOwned(userId, input.courseId);
  }
  return prisma.studentFile.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      courseId: input.courseId || null,
      category: input.category?.trim() || null,
      storedName: input.storedName,
      originalName: input.originalName.slice(0, 500),
      mimeType: input.mimeType || null,
      sizeBytes: input.sizeBytes,
    },
    include: {
      course: { select: { id: true, name: true, code: true } },
    },
  });
}

const listInclude = { course: { select: { id: true, name: true, code: true } } } as const;

export async function listStudentFiles(userId: string, courseId?: string) {
  return prisma.studentFile.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(courseId ? { courseId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: listInclude,
  });
}

export async function getStudentFileForUser(id: string, userId: string) {
  const row = await prisma.studentFile.findFirst({
    where: { id, userId, deletedAt: null },
    include: listInclude,
  });
  if (!row) throw new AppError("File not found", 404);
  return row;
}

export async function updateStudentFile(
  id: string,
  userId: string,
  data: { title?: string; description?: string | null; courseId?: string | null; category?: string | null }
) {
  await getStudentFileForUser(id, userId);
  if (data.courseId) {
    await assertCourseOwned(userId, data.courseId);
  }
  return prisma.studentFile.update({
    where: { id },
    data: {
      ...(data.title != null ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.courseId !== undefined ? { courseId: data.courseId || null } : {}),
      ...(data.category !== undefined ? { category: data.category?.trim() || null } : {}),
    },
    include: listInclude,
  });
}

export async function deleteStudentFile(id: string, userId: string) {
  const row = await prisma.studentFile.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!row) throw new AppError("File not found", 404);

  const abs = absolutePathForFile(userId, row.storedName);
  await prisma.studentFile.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await fs.unlink(abs).catch(() => {});
}

export async function readFileBuffer(id: string, userId: string) {
  const row = await getStudentFileForUser(id, userId);
  const abs = absolutePathForFile(userId, row.storedName);
  try {
    const buf = await fs.readFile(abs);
    return { row, buffer: buf };
  } catch {
    throw new AppError("File missing on disk", 404);
  }
}
