import { Request, Response } from "express";
import { z } from "zod";
import * as courseService from "../services/courseService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail, zodFieldErrorsToMessage } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  semesterId: z.string().min(1),
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  instructor: z.string().max(100).optional(),
  professor: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code e.g. #3B82F6")
    .optional(),
  credits: z.number().min(0).max(10),
});

const updateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),
  instructor: z.string().max(100).optional(),
  professor: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code e.g. #3B82F6")
    .optional(),
  credits: z.number().min(0).max(10).optional(),
});

const listQuerySchema = z.object({
  semesterId: z.string().optional(),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function createCourseHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  const { professor, ...rest } = parsed.data;
  const instructor = (rest.instructor ?? professor)?.trim();
  const description = rest.description?.trim();
  const data = {
    ...rest,
    instructor: instructor || undefined,
    description: description || undefined, // empty string → undefined, stored as null by Prisma
  };
  try {
    const { userId } = req as AuthenticatedRequest;
    const course = await courseService.createCourse(userId, data);
    return ok(res, course, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listCoursesHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, "Invalid query parameters", 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const courses = await courseService.listCourses(userId, query.data.semesterId);
    return ok(res, courses);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getCourseHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const course = await courseService.getCourse(req.params.id, userId);
    return ok(res, course);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateCourseHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  const { professor, ...rest } = parsed.data;
  const instructor = (rest.instructor ?? professor)?.trim();
  const description = rest.description?.trim();
  const data = {
    ...rest,
    instructor: instructor ? instructor : null,
    description: description ? description : null,
  };
  try {
    const { userId } = req as AuthenticatedRequest;
    const course = await courseService.updateCourse(
      req.params.id,
      userId,
      data
    );
    return ok(res, course);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteCourseHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await courseService.deleteCourse(req.params.id, userId);
    return ok(res, { message: "Course deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
