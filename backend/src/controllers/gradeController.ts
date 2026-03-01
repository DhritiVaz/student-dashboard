import { Request, Response } from "express";
import { z } from "zod";
import * as gradeService from "../services/gradeService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  assignmentId: z.string().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(0.01),
  feedback: z.string().max(2000).optional(),
});

const updateSchema = z
  .object({
    score: z.number().min(0).optional(),
    maxScore: z.number().min(0.01).optional(),
    feedback: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  assignmentId: z.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function createGradeHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const grade = await gradeService.createGrade(userId, parsed.data);
    return ok(res, grade, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listGradesHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, "Invalid query parameters", 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const grades = await gradeService.listGrades(userId, query.data.assignmentId);
    return ok(res, grades);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateGradeHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const grade = await gradeService.updateGrade(req.params.id, userId, parsed.data);
    return ok(res, grade);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteGradeHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await gradeService.deleteGrade(req.params.id, userId);
    return ok(res, { message: "Grade deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getCourseGpaHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const result = await gradeService.calculateCourseGpa(req.params.id, userId);
    return ok(res, result);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
