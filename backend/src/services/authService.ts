import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { User } from "@prisma/client";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function signAccessToken(userId: string): string {
  return jwt.sign(
    { userId, jti: crypto.randomUUID() },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, jti: crypto.randomUUID() },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );
}

export function verifyAccessToken(token: string): { userId: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as {
    userId: string;
  };
}

// ─── Service methods ──────────────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error("Email already in use"), { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("Login email:", email);
  console.log("Found user:", user);
  if (!user || user.deletedAt) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
}

export async function refresh(
  incomingToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify JWT signature first (throws if expired/invalid)
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(incomingToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), {
      status: 401,
    });
  }

  // Then check it exists in the DB (allows logout invalidation)
  const stored = await prisma.refreshToken.findUnique({
    where: { token: incomingToken },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error("Refresh token not found or expired"), {
      status: 401,
    });
  }

  // Rotate: delete old, issue new pair
  await prisma.refreshToken.delete({ where: { token: incomingToken } });

  const accessToken = signAccessToken(payload.userId);
  const newRefreshToken = signRefreshToken(payload.userId);
  await storeRefreshToken(payload.userId, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
  // Silently ignore unknown tokens — idempotent logout
  await prisma.refreshToken
    .delete({ where: { token } })
    .catch(() => undefined);
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function storeRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}
