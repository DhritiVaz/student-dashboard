import { Request, Response } from "express";
import { z } from "zod";
import * as fileService from "../services/fileService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

const listQuerySchema = z.object({
  courseId: z.string().optional(),
});

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    courseId: z.string().nullable().optional(),
    category: z.string().max(80).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

function parseMultipartField(s: unknown): string | undefined {
  if (s == null) return undefined;
  if (Array.isArray(s)) return parseMultipartField(s[0]);
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

export async function createFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return fail(res, "File is required", 400);
    }
    const title =
      parseMultipartField(req.body?.title) ??
      (file.originalname.replace(/\.[^.]+$/, "") || "Untitled");
    const description = parseMultipartField(req.body?.description);
    const courseIdRaw = parseMultipartField(req.body?.courseId);
    const category = parseMultipartField(req.body?.category);

    const row = await fileService.createStudentFile(userId, {
      title,
      description: description ?? null,
      courseId: courseIdRaw ?? null,
      category: category ?? null,
      storedName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    return ok(res, row, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listFilesHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, query.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const rows = await fileService.listStudentFiles(userId, query.data.courseId);
    return ok(res, rows);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function downloadFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { row, buffer } = await fileService.readFileBuffer(req.params.id, userId);
    const mime = row.mimeType || "application/octet-stream";
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", String(buffer.length));
    const safe = row.originalName.replace(/["\r\n]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(row.originalName)}`);
    return res.send(buffer);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateFileHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const row = await fileService.updateStudentFile(req.params.id, userId, {
      title: parsed.data.title,
      description: parsed.data.description,
      courseId: parsed.data.courseId,
      category: parsed.data.category,
    });
    return ok(res, row);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await fileService.deleteStudentFile(req.params.id, userId);
    return ok(res, { message: "File removed" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
