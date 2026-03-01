import { Request, Response } from "express";
import { z } from "zod";
import * as assignmentService from "../services/assignmentService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const statusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "GRADED"]);

const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  weight: z.number().min(0).max(100),
  isSubmitted: z.boolean().optional().default(false),
  status: statusEnum.optional().default("NOT_STARTED"),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  weight: z.number().min(0).max(100).optional(),
  isSubmitted: z.boolean().optional(),
  status: statusEnum.optional(),
});

const listQuerySchema = z.object({
  courseId: z.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function createAssignmentHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const assignment = await assignmentService.createAssignment(userId, parsed.data);
    return ok(res, assignment, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listAssignmentsHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, "Invalid query parameters", 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const assignments = await assignmentService.listAssignments(
      userId,
      query.data.courseId
    );
    return ok(res, assignments);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getAssignmentHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const assignment = await assignmentService.getAssignment(req.params.id, userId);
    return ok(res, assignment);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateAssignmentHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const assignment = await assignmentService.updateAssignment(
      req.params.id,
      userId,
      parsed.data
    );
    return ok(res, assignment);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteAssignmentHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await assignmentService.deleteAssignment(req.params.id, userId);
    return ok(res, { message: "Assignment deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
