import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/authService";

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const { user, accessToken, refreshToken } = await authService.register(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name
    );

    return res.status(201).json({
      data: { user: safeUser(user), accessToken, refreshToken },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message: string };
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const { user, accessToken, refreshToken } = await authService.login(
      parsed.data.email,
      parsed.data.password
    );

    return res.json({
      data: { user: safeUser(user), accessToken, refreshToken },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message: string };
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(
      parsed.data.refreshToken
    );
    return res.json({ data: { accessToken, refreshToken } });
  } catch (err: unknown) {
    const e = err as { status?: number; message: string };
    return res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  await authService.logout(parsed.data.refreshToken);
  return res.json({ data: { message: "Logged out successfully" } });
}
