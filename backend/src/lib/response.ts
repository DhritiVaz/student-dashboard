import { Response } from "express";
import type { ZodError } from "zod";

/** Convert Zod field errors to a single string for API responses. */
export function zodFieldErrorsToMessage(err: ZodError): string {
  const fieldErrors = err.flatten().fieldErrors;
  const messages = Object.values(fieldErrors).flat().filter((m): m is string => typeof m === "string");
  return messages.length ? messages.join(" ") : "Validation failed.";
}

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function fail(
  res: Response,
  error: string,
  statusCode: 400 | 401 | 403 | 404 | 409 | 500 = 500
) {
  return res.status(statusCode).json({ success: false, error, statusCode });
}
