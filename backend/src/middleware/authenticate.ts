import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";
import { fail } from "../lib/response";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Missing Authorization header", 401);
  }

  const token = header.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    (req as AuthenticatedRequest).userId = userId;
    return next();
  } catch {
    return fail(res, "Invalid or expired access token", 401);
  }
}
