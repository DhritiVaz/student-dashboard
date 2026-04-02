import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "mindspace");
const MAX_BYTES = 40 * 1024 * 1024; // 40 MB

export function getMindspaceUploadRoot() {
  return UPLOAD_ROOT;
}

export async function ensureMindspaceUploadRoot() {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
}

export function mindspaceFileDir(userId: string) {
  return path.join(UPLOAD_ROOT, userId);
}

export function absolutePathForMindspaceFile(userId: string, storedName: string) {
  return path.join(mindspaceFileDir(userId), storedName);
}

export async function listMindspaceEntries(userId: string) {
  return prisma.mindspaceEntry.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTextEntry(userId: string, body: string, title?: string | null) {
  if (!body.trim()) throw new AppError("Body cannot be empty", 400);
  return prisma.mindspaceEntry.create({
    data: { userId, type: "text", body, title: title ?? null },
  });
}

export async function createFileEntry(
  userId: string,
  input: {
    storedName: string;
    originalName: string;
    mimeType: string | null;
    sizeBytes: number;
    title?: string | null;
  }
) {
  if (input.sizeBytes > MAX_BYTES) throw new AppError("File too large (max 40 MB)", 400);
  return prisma.mindspaceEntry.create({
    data: {
      userId,
      type: "file",
      storedName: input.storedName,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      title: input.title ?? null,
    },
  });
}

export async function readMindspaceFileBuffer(id: string, userId: string) {
  const entry = await prisma.mindspaceEntry.findFirst({
    where: { id, userId, type: "file", deletedAt: null },
  });
  if (!entry || !entry.storedName) throw new AppError("Entry not found", 404);
  const filePath = absolutePathForMindspaceFile(userId, entry.storedName);
  const buffer = await fs.readFile(filePath).catch(() => {
    throw new AppError("File data not found on disk", 404);
  });
  return { entry, buffer };
}

export async function deleteMindspaceEntry(id: string, userId: string) {
  const entry = await prisma.mindspaceEntry.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!entry) throw new AppError("Entry not found", 404);

  // Soft-delete in DB
  await prisma.mindspaceEntry.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Delete file from disk if present
  if (entry.storedName) {
    const filePath = absolutePathForMindspaceFile(userId, entry.storedName);
    await fs.unlink(filePath).catch(() => { /* ok if already gone */ });
  }
}
