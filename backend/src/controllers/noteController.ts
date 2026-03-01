import { Request, Response } from "express";
import { z } from "zod";
import * as noteService from "../services/noteService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
});

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  courseId: z.string().optional(),
  // Accept comma-separated tags: ?tags=lecture,week1
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((t) => t.trim()).filter(Boolean) : undefined)),
  search: z.string().max(200).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function createNoteHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const note = await noteService.createNote(userId, parsed.data);
    return ok(res, note, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listNotesHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, query.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const notes = await noteService.listNotes(userId, query.data);
    return ok(res, notes);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getNoteHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const note = await noteService.getNote(req.params.id, userId);
    return ok(res, note);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateNoteHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const note = await noteService.updateNote(req.params.id, userId, parsed.data);
    return ok(res, note);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteNoteHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await noteService.deleteNote(req.params.id, userId);
    return ok(res, { message: "Note deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
