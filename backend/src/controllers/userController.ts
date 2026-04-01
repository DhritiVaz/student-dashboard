import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ok, fail, zodFieldErrorsToMessage } from "../lib/response";
import { toAppError } from "../lib/AppError";
import * as userService from "../services/userService";
import * as authService from "../services/authService";

const patchMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function getMeHandler(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
  if (!user) return fail(res, "User not found", 404);
  return ok(res, user);
}

export async function patchMeHandler(req: Request, res: Response) {
  const parsed = patchMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  if (!parsed.data.name && !parsed.data.email) {
    return fail(res, "Nothing to update", 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const user = await userService.updateProfile(userId, parsed.data);
    return ok(res, user);
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, zodFieldErrorsToMessage(parsed.error), 400);
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    await userService.changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    return ok(res, { message: "Password updated" });
  } catch (err) {
    const e = toAppError(err);
    return fail(res, e.message, e.statusCode);
  }
}

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export async function logoutAllHandler(req: Request, res: Response) {
  const parsed = refreshBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "refreshToken is required", 400);
  }
  try {
    const payload = authService.verifyRefreshToken(parsed.data.refreshToken);
    const { userId } = req as AuthenticatedRequest;
    if (payload.userId !== userId) {
      return fail(res, "Invalid refresh token for this session", 403);
    }
    await authService.logoutOtherSessions(userId, parsed.data.refreshToken);
    return ok(res, { message: "Signed out other sessions" });
  } catch {
    return fail(res, "Invalid refresh token", 401);
  }
}
