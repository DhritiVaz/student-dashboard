import request from "supertest";
import app from "../src/app";
import { createTestUser, getAuthToken } from "./helpers";

describe("Semesters API", () => {
  let tokenA: string;
  let tokenB: string;
  let userIdA: string;
  let userIdB: string;

  beforeAll(async () => {
    const userA = await createTestUser({
      email: "sem-user-a@example.com",
      password: "pass123",
      name: "User A",
    });
    const userB = await createTestUser({
      email: "sem-user-b@example.com",
      password: "pass123",
      name: "User B",
    });
    userIdA = userA.userId;
    userIdB = userB.userId;
    tokenA = await getAuthToken(app, userA.email, userA.password);
    tokenB = await getAuthToken(app, userB.email, userB.password);
  }, 25000);

  describe("POST /api/semesters", () => {
    it("create semester → 201", async () => {
      const res = await request(app)
        .post("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Fall 2025",
          startDate: "2025-08-25",
          endDate: "2025-12-15",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: "Fall 2025",
        userId: userIdA,
      });
      expect(res.body.data.id).toBeDefined();
    });
  });

  describe("GET /api/semesters", () => {
    it("only returns own semesters", async () => {
      // User A creates a semester
      const createRes = await request(app)
        .post("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Spring 2026",
          startDate: "2026-01-15",
          endDate: "2026-05-20",
        })
        .expect(201);

      const semesterId = createRes.body.data.id;

      // User B should not see User A's semester
      const listB = await request(app)
        .get("/api/semesters")
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(200);

      const bIds = (listB.body.data || []).map((s: { id: string }) => s.id);
      expect(bIds).not.toContain(semesterId);

      // User A should see it
      const listA = await request(app)
        .get("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      const aIds = (listA.body.data || []).map((s: { id: string }) => s.id);
      expect(aIds).toContain(semesterId);
    });
  });

  describe("PUT /api/semesters/:id", () => {
    it("update semester → 200", async () => {
      const createRes = await request(app)
        .post("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Winter 2025",
          startDate: "2025-01-06",
          endDate: "2025-04-30",
        })
        .expect(201);

      const id = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/semesters/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "Winter 2025 Updated" })
        .expect(200);

      expect(res.body.data.name).toBe("Winter 2025 Updated");
    });
  });

  describe("DELETE /api/semesters/:id", () => {
    it("delete semester (soft) → excluded from future GET", async () => {
      const createRes = await request(app)
        .post("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Summer 2025",
          startDate: "2025-05-15",
          endDate: "2025-08-10",
        })
        .expect(201);

      const id = createRes.body.data.id;

      await request(app)
        .delete(`/api/semesters/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      const listRes = await request(app)
        .get("/api/semesters")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      const ids = (listRes.body.data || []).map((s: { id: string }) => s.id);
      expect(ids).not.toContain(id);
    });
  });
});
