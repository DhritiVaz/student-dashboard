import { Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";

export const usersRouter = Router();

// GET /api/users/me — protected route to verify token works
usersRouter.get("/me", authenticateToken, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ data: user });
});
