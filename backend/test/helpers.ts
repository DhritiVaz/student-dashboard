import request from "supertest";
import type { Express } from "express";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Create a test user in the database and return { userId, email, password, name }.
 */
export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = overrides?.email ?? `test-${Date.now()}@example.com`;
  const password = overrides?.password ?? "password123";
  const name = overrides?.name ?? "Test User";

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  return { userId: user.id, email, password, name };
}

/**
 * Register via API and return the access token.
 */
export async function getAuthToken(
  app: Express,
  email: string,
  password: string
): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  const data = res.body.data;
  if (!data?.accessToken) {
    throw new Error("No accessToken in login response");
  }
  return data.accessToken;
}

/**
 * Register via API, return { accessToken, refreshToken, user }.
 */
export async function registerAndGetTokens(
  app: Express,
  payload: { email: string; password: string; name: string }
) {
  const res = await request(app)
    .post("/api/auth/register")
    .send(payload)
    .expect(201);

  const data = res.body.data;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}
