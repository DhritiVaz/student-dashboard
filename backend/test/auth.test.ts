import request from "supertest";
import app from "../src/app";
import { createTestUser, getAuthToken, registerAndGetTokens } from "./helpers";

describe("Auth API", () => {
  const validUser = {
    email: "auth-test@example.com",
    password: "password123",
    name: "Auth Test User",
  };

  beforeEach(async () => {
    // Ensure we start with a clean slate for auth tests
    const { prisma } = await import("../src/lib/prisma");
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: validUser.email } });
  });

  describe("POST /api/auth/register", () => {
    it("register with valid data → 201, tokens returned", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(validUser)
        .expect(201);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toMatchObject({
        user: {
          id: expect.any(String),
          email: validUser.email,
          name: validUser.name,
        },
      });
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.refreshToken).toBeDefined();
      expect(typeof res.body.data.refreshToken).toBe("string");
    });

    it("register with duplicate email → 409", async () => {
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      const res = await request(app)
        .post("/api/auth/register")
        .send(validUser)
        .expect(409);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("already in use");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(validUser);
    });

    it("login with correct credentials → 200, tokens returned", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

      expect(res.body.data).toMatchObject({
        user: {
          email: validUser.email,
          name: validUser.name,
        },
      });
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("login with wrong password → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: validUser.email, password: "wrongpassword" })
        .expect(401);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Protected route", () => {
    it("access protected route with valid token → 200", async () => {
      const { accessToken } = await registerAndGetTokens(app, validUser);

      await request(app)
        .get("/api/semesters")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });

    it("access protected route without token → 401", async () => {
      await request(app).get("/api/semesters").expect(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("refresh token → new access token returned", async () => {
      const { refreshToken, accessToken: oldAccess } = await registerAndGetTokens(
        app,
        validUser
      );

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(oldAccess);
    });
  });
});
