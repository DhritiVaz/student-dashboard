import { Request, Response } from "express";
import { z } from "zod";
import * as eventService from "../services/eventService";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail, zodFieldErrorsToMessage } from "../lib/response";
import { toAppError } from "../lib/AppError";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const eventTypeEnum = z.enum(["CLASS", "EXAM", "DEADLINE", "PERSONAL"]);
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a 6-digit hex code e.g. #FF5733")
  .optional();

const createSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isAllDay: z.boolean().optional().default(false),
    color: hexColorSchema,
    type: eventTypeEnum,
    courseId: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "endDate must be >= startDate",
    path: ["endDate"],
  });

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isAllDay: z.boolean().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a 6-digit hex code e.g. #FF5733")
      .nullable()
      .optional(),
    type: eventTypeEnum.optional(),
    courseId: z.string().nullable().optional(),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    { message: "endDate must be >= startDate", path: ["endDate"] }
  )
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const listQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  courseId: z.string().optional(),
  type: eventTypeEnum.optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function createEventHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const event = await eventService.createEvent(userId, parsed.data);
    return ok(res, event, 201);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function listEventsHandler(req: Request, res: Response) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    return fail(res, zodFieldErrorsToMessage(query.error), 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const events = await eventService.listEvents(userId, query.data);
    return ok(res, events);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function getEventHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    const event = await eventService.getEvent(req.params.id, userId);
    return ok(res, event);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function updateEventHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const event = await eventService.updateEvent(
      req.params.id,
      userId,
      parsed.data
    );
    return ok(res, event);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function deleteEventHandler(req: Request, res: Response) {
  try {
    const { userId } = req as AuthenticatedRequest;
    await eventService.deleteEvent(req.params.id, userId);
    return ok(res, { message: "Event deleted" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}
