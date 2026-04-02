import { Request, Response } from "express";
import { z } from "zod";
import * as mindspaceService from "../services/mindspaceService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

const textSchema = z.object({
  body:  z.string().min(1).max(50000),
  title: z.string().max(300).optional().nullable(),
});

export async function listEntriesHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const entries = await mindspaceService.listMindspaceEntries(userId);
    return ok(res, entries);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function createTextHandler(req: Request, res: Response) {
  const parsed = textSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat().join(" ") || "Invalid input";
    return fail(res, msg, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const entry = await mindspaceService.createTextEntry(userId, parsed.data.body, parsed.data.title);
    return ok(res, entry, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function createFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) return fail(res, "File is required", 400);

    function parseField(s: unknown): string | undefined {
      if (typeof s === "string" && s.trim()) return s.trim();
      return undefined;
    }

    const title = parseField(req.body?.title) ?? (file.originalname.replace(/\.[^.]+$/, "") || undefined);
    const entry = await mindspaceService.createFileEntry(userId, {
      storedName:   file.filename,
      originalName: file.originalname,
      mimeType:     file.mimetype ?? null,
      sizeBytes:    file.size,
      title:        title ?? null,
    });
    return ok(res, entry, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function viewFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { entry, buffer } = await mindspaceService.readMindspaceFileBuffer(req.params.id, userId);
    const mime = entry.mimeType || "application/octet-stream";
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", String(buffer.length));
    // inline so images render in-browser; non-images fall back to download
    const safe = (entry.originalName ?? "file").replace(/["\r\n]/g, "_");
    res.setHeader("Content-Disposition", `inline; filename="${safe}"`);
    return res.send(buffer);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function downloadFileHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { entry, buffer } = await mindspaceService.readMindspaceFileBuffer(req.params.id, userId);
    const mime = entry.mimeType || "application/octet-stream";
    const safe = (entry.originalName ?? "file").replace(/["\r\n]/g, "_");
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Content-Disposition", `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(entry.originalName ?? "file")}`);
    return res.send(buffer);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteEntryHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await mindspaceService.deleteMindspaceEntry(req.params.id, userId);
    return ok(res, { message: "Deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
