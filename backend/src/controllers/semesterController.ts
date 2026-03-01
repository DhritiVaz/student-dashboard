import { Request, Response } from "express";
import { z } from "zod";
import * as semesterService from "../services/semesterService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((d) => d.endDate > d.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate > d.startDate,
  { message: "endDate must be after startDate", path: ["endDate"] }
);

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function createSemesterHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const semester = await semesterService.createSemester(userId, parsed.data);
    return ok(res, semester, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listSemestersHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const semesters = await semesterService.listSemesters(userId);
    return ok(res, semesters);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getSemesterHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const semester = await semesterService.getSemester(req.params.id, userId);
    return ok(res, semester);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateSemesterHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const semester = await semesterService.updateSemester(
      req.params.id,
      userId,
      parsed.data
    );
    return ok(res, semester);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteSemesterHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await semesterService.deleteSemester(req.params.id, userId);
    return ok(res, { message: "Semester deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
