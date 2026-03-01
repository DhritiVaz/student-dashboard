import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType = "CLASS" | "EXAM" | "DEADLINE" | "PERSONAL";

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  color?: string;
  type: EventType;
  courseId?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  color?: string | null;
  type?: EventType;
  courseId?: string | null;
}

export interface ListEventsFilter {
  startDate?: Date;  // gte — events that start on/after this date
  endDate?: Date;    // lte — events that start on/before this date
  courseId?: string;
  type?: EventType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null, semester: { userId, deletedAt: null } },
  });
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

async function assertEventOwnership(eventId: string, userId: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not found", 404);
  return event;
}

function validateDateRange(startDate: Date, endDate: Date) {
  if (endDate < startDate) {
    throw new AppError("endDate must be greater than or equal to startDate", 400);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/*
 * curl -X POST http://localhost:4000/api/events \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"title":"Midterm Exam","startDate":"2025-10-15T09:00:00Z","endDate":"2025-10-15T11:00:00Z","type":"EXAM","courseId":"<id>"}'
 */
export async function createEvent(userId: string, input: CreateEventInput) {
  validateDateRange(input.startDate, input.endDate);
  if (input.courseId) await assertCourseOwnership(input.courseId, userId);

  return prisma.calendarEvent.create({
    data: { ...input, userId, isAllDay: input.isAllDay ?? false },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
}

/*
 * curl "http://localhost:4000/api/events?startDate=2025-10-01&endDate=2025-10-31" \
 *   -H "Authorization: Bearer <token>"
 *
 * curl "http://localhost:4000/api/events?type=EXAM&courseId=<id>" \
 *   -H "Authorization: Bearer <token>"
 *
 * Range semantics: returns events whose startDate falls within [startDate, endDate].
 * This is the most intuitive behaviour for a calendar month-view query.
 */
export async function listEvents(userId: string, filter: ListEventsFilter) {
  // Build the date-range filter on startDate using indexed gte/lte operators.
  // Prisma translates these directly to: WHERE "startDate" >= $1 AND "startDate" <= $2
  // which hits the @@index([startDate]) we added to the schema.
  const dateFilter: Prisma.DateTimeFilter<"CalendarEvent"> = {};
  if (filter.startDate) dateFilter.gte = filter.startDate;
  if (filter.endDate) dateFilter.lte = filter.endDate;

  const where: Prisma.CalendarEventWhereInput = {
    userId,
    deletedAt: null,
    ...(Object.keys(dateFilter).length ? { startDate: dateFilter } : {}),
    ...(filter.courseId ? { courseId: filter.courseId } : {}),
    ...(filter.type ? { type: filter.type } : {}),
  };

  return prisma.calendarEvent.findMany({
    where,
    orderBy: [{ startDate: "asc" }, { isAllDay: "desc" }],
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
}

/*
 * curl http://localhost:4000/api/events/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function getEvent(eventId: string, userId: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId, deletedAt: null },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
  if (!event) throw new AppError("Event not found", 404);
  return event;
}

/*
 * curl -X PUT http://localhost:4000/api/events/:id \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"title":"Midterm (rescheduled)","startDate":"2025-10-20T09:00:00Z","endDate":"2025-10-20T11:00:00Z"}'
 */
export async function updateEvent(
  eventId: string,
  userId: string,
  input: UpdateEventInput
) {
  const existing = await assertEventOwnership(eventId, userId);

  const newStart = input.startDate ?? existing.startDate;
  const newEnd = input.endDate ?? existing.endDate;
  validateDateRange(newStart, newEnd);

  if (input.courseId) await assertCourseOwnership(input.courseId, userId);

  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: input,
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  });
}

/*
 * curl -X DELETE http://localhost:4000/api/events/:id \
 *   -H "Authorization: Bearer <token>"
 */
export async function deleteEvent(eventId: string, userId: string) {
  await assertEventOwnership(eventId, userId);
  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });
}
