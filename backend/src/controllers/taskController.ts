import { Request, Response } from "express";
import { z } from "zod";
import * as taskService from "../services/taskService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: priorityEnum.optional().default("MEDIUM"),
  courseId: z.string().optional(),
  assignmentId: z.string().optional(),
});

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    priority: priorityEnum.optional(),
    isCompleted: z.boolean().optional(),
    courseId: z.string().nullable().optional(),
    assignmentId: z.string().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  courseId:     z.string().optional(),
  assignmentId: z.string().optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  priority: priorityEnum.optional(),
  sortBy: z.enum(["dueDate", "priority", "createdAt", "title"]).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function createTaskHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const task = await taskService.createTask(userId, parsed.data);
    return ok(res, task, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listTasksHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, query.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const tasks = await taskService.listTasks(userId, query.data);
    return ok(res, tasks);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getTaskHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const task = await taskService.getTask(req.params.id, userId);
    return ok(res, task);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateTaskHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.flatten().fieldErrors as unknown as string, 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const task = await taskService.updateTask(req.params.id, userId, parsed.data);
    return ok(res, task);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteTaskHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await taskService.deleteTask(req.params.id, userId);
    return ok(res, { message: "Task deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
