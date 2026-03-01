import request from "supertest";
import app from "../src/app";
import { createTestUser, getAuthToken } from "./helpers";
import { prisma } from "../src/lib/prisma";

describe("Assignments & Grades API", () => {
  let token: string;
  let userId: string;
  let semesterId: string;
  let courseId: string;
  let assignmentId: string;

  beforeAll(async () => {
    const user = await createTestUser({
      email: "assign-test@example.com",
      password: "pass123",
      name: "Assign Test",
    });
    userId = user.userId;
    token = await getAuthToken(app, user.email, user.password);

    const semRes = await request(app)
      .post("/api/semesters")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Fall 2025",
        startDate: "2025-08-25",
        endDate: "2025-12-15",
      })
      .expect(201);
    semesterId = semRes.body.data.id;

    const courseRes = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        semesterId,
        name: "Intro to CS",
        code: "CS101",
        credits: 3,
      })
      .expect(201);
    courseId = courseRes.body.data.id;
  });

  describe("POST /api/assignments", () => {
    it("create assignment → 201", async () => {
      const res = await request(app)
        .post("/api/assignments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          courseId,
          title: "Homework 1",
          weight: 20,
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        title: "Homework 1",
        courseId,
        weight: 20,
      });
      assignmentId = res.body.data.id;
    });
  });

  describe("POST /api/grades", () => {
    it("submit grade → 200 (or 201)", async () => {
      const createRes = await request(app)
        .post("/api/assignments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          courseId,
          title: "Homework 2",
          weight: 30,
        })
        .expect(201);

      const aid = createRes.body.data.id;

      const res = await request(app)
        .post("/api/grades")
        .set("Authorization", `Bearer ${token}`)
        .send({
          assignmentId: aid,
          score: 85,
          maxScore: 100,
          feedback: "Good work!",
        })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) throw new Error(`Got ${res.status}`);
        });

      expect(res.body.data).toMatchObject({
        assignmentId: aid,
        score: 85,
        maxScore: 100,
        feedback: "Good work!",
      });
    });

    it("score > maxScore → 400", async () => {
      const createRes = await request(app)
        .post("/api/assignments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          courseId,
          title: "Homework 3",
          weight: 25,
        })
        .expect(201);

      const aid = createRes.body.data.id;

      const res = await request(app)
        .post("/api/grades")
        .set("Authorization", `Bearer ${token}`)
        .send({
          assignmentId: aid,
          score: 105,
          maxScore: 100,
        })
        .expect(400);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/cannot exceed|exceed/i);
    });
  });

  describe("GET /api/courses/:id/gpa", () => {
    it("GPA calculation returns correct weighted average", async () => {
      // Use a fresh course to stay within 100% weight budget
      const semRes2 = await request(app)
        .post("/api/semesters")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Spring 2026",
          startDate: "2026-01-15",
          endDate: "2026-05-20",
        })
        .expect(201);
      const courseRes2 = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          semesterId: semRes2.body.data.id,
          name: "Math 101",
          code: "MATH101",
          credits: 3,
        })
        .expect(201);
      const gpaCourseId = courseRes2.body.data.id;

      const a1Res = await request(app)
        .post("/api/assignments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          courseId: gpaCourseId,
          title: "Quiz 1",
          weight: 10,
        })
        .expect(201);
      const a1Id = a1Res.body.data.id;

      const a2Res = await request(app)
        .post("/api/assignments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          courseId: gpaCourseId,
          title: "Quiz 2",
          weight: 20,
        })
        .expect(201);
      const a2Id = a2Res.body.data.id;

      await request(app)
        .post("/api/grades")
        .set("Authorization", `Bearer ${token}`)
        .send({ assignmentId: a1Id, score: 90, maxScore: 100 })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) throw new Error(`Got ${res.status}`);
        });

      await request(app)
        .post("/api/grades")
        .set("Authorization", `Bearer ${token}`)
        .send({ assignmentId: a2Id, score: 80, maxScore: 100 })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) throw new Error(`Got ${res.status}`);
        });

      const res = await request(app)
        .get(`/api/courses/${gpaCourseId}/gpa`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        courseId: gpaCourseId,
        totalWeight: 30,
        gradedWeight: 30,
      });

      // Weighted: (90*10 + 80*20) / 30 = (900 + 1600) / 30 = 83.33...
      const gpa = res.body.data.gpa;
      expect(typeof gpa).toBe("number");
      expect(gpa).toBeGreaterThanOrEqual(83);
      expect(gpa).toBeLessThanOrEqual(84);
    });
  });
});
