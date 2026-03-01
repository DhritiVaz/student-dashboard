import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_USER_EMAIL = "test@student.com";

async function main() {
  // Check if seed data already exists (idempotent)
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    include: { semesters: true },
  });

  if (existingUser && existingUser.semesters.length > 0) {
    console.log("Seed data already exists. Skipping.");
    return;
  }

  let user = existingUser;

  // 1. Create test user
  if (!user) {
    process.stdout.write("Seeding user... ");
    const hashed = await bcrypt.hash("password123", 12);
    user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        password: hashed,
        name: "Test Student",
      },
    });
    console.log("done");
  } else {
    console.log("User exists, skipping user creation.");
  }

  const userId = user!.id;

  // 2. Create semesters
  process.stdout.write("Seeding semesters... ");
  const fall2024 = await prisma.semester.create({
    data: {
      userId,
      name: "Fall 2024",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-12-15"),
    },
  });
  const spring2025 = await prisma.semester.create({
    data: {
      userId,
      name: "Spring 2025",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-05-20"),
    },
  });
  console.log("done");

  // 3. Create courses per semester
  process.stdout.write("Seeding courses... ");
  const fallCourses = [
    { name: "Introduction to Programming", code: "CS101", credits: 4 },
    { name: "Calculus II", code: "MATH201", credits: 4 },
    { name: "Advanced Writing", code: "ENG301", credits: 3 },
    { name: "Introduction to Biology", code: "BIO101", credits: 4 },
  ];
  const springCourses = [
    { name: "Data Structures", code: "CS201", credits: 4 },
    { name: "Physics I", code: "PHYS101", credits: 4 },
    { name: "US History II", code: "HIST202", credits: 3 },
    { name: "General Chemistry", code: "CHEM101", credits: 4 },
  ];

  const createdCourses: { id: string; semesterId: string }[] = [];
  for (const c of fallCourses) {
    const course = await prisma.course.create({
      data: {
        semesterId: fall2024.id,
        name: c.name,
        code: c.code,
        instructor: "Dr. Smith",
        color: "#6366f1",
        credits: c.credits,
      },
    });
    createdCourses.push({ id: course.id, semesterId: fall2024.id });
  }
  for (const c of springCourses) {
    const course = await prisma.course.create({
      data: {
        semesterId: spring2025.id,
        name: c.name,
        code: c.code,
        instructor: "Dr. Johnson",
        color: "#10b981",
        credits: c.credits,
      },
    });
    createdCourses.push({ id: course.id, semesterId: spring2025.id });
  }
  console.log("done");

  // 4. Create assignments per course (weights must sum ≤ 100)
  process.stdout.write("Seeding assignments... ");
  const assignmentSpecs: { title: string; weight: number; dueOffsetDays: number; status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED" }[][] = [
    [
      { title: "Homework 1 - Variables", weight: 10, dueOffsetDays: 14, status: "GRADED" },
      { title: "Homework 2 - Loops", weight: 15, dueOffsetDays: 28, status: "GRADED" },
      { title: "Midterm Project", weight: 25, dueOffsetDays: 45, status: "GRADED" },
      { title: "Final Project", weight: 30, dueOffsetDays: 95, status: "SUBMITTED" },
      { title: "Lab Exercises", weight: 20, dueOffsetDays: 70, status: "IN_PROGRESS" },
    ],
    [
      { title: "Quiz 1 - Integration", weight: 15, dueOffsetDays: 21, status: "GRADED" },
      { title: "Quiz 2 - Series", weight: 15, dueOffsetDays: 42, status: "GRADED" },
      { title: "Midterm Exam", weight: 35, dueOffsetDays: 50, status: "GRADED" },
      { title: "Final Exam", weight: 35, dueOffsetDays: 100, status: "NOT_STARTED" },
    ],
    [
      { title: "Essay 1 - Analysis", weight: 20, dueOffsetDays: 20, status: "GRADED" },
      { title: "Research Paper Outline", weight: 15, dueOffsetDays: 45, status: "GRADED" },
      { title: "Research Paper", weight: 40, dueOffsetDays: 85, status: "IN_PROGRESS" },
      { title: "Final Reflection", weight: 25, dueOffsetDays: 100, status: "NOT_STARTED" },
    ],
    [
      { title: "Lab Report 1 - Cells", weight: 15, dueOffsetDays: 21, status: "GRADED" },
      { title: "Lab Report 2 - Genetics", weight: 15, dueOffsetDays: 50, status: "GRADED" },
      { title: "Midterm", weight: 35, dueOffsetDays: 55, status: "GRADED" },
      { title: "Final Exam", weight: 35, dueOffsetDays: 100, status: "NOT_STARTED" },
    ],
    [
      { title: "Array Exercises", weight: 15, dueOffsetDays: 21, status: "GRADED" },
      { title: "Linked List Implementation", weight: 20, dueOffsetDays: 45, status: "GRADED" },
      { title: "Tree Traversal Lab", weight: 20, dueOffsetDays: 70, status: "SUBMITTED" },
      { title: "Final Project", weight: 30, dueOffsetDays: 115, status: "NOT_STARTED" },
      { title: "Hash Table Quiz", weight: 15, dueOffsetDays: 55, status: "GRADED" },
    ],
    [
      { title: "Kinematics HW", weight: 20, dueOffsetDays: 14, status: "GRADED" },
      { title: "Dynamics Lab", weight: 15, dueOffsetDays: 35, status: "GRADED" },
      { title: "Midterm", weight: 30, dueOffsetDays: 55, status: "GRADED" },
      { title: "Final", weight: 35, dueOffsetDays: 120, status: "NOT_STARTED" },
    ],
    [
      { title: "Primary Source Analysis", weight: 25, dueOffsetDays: 30, status: "GRADED" },
      { title: "Timeline Project", weight: 25, dueOffsetDays: 60, status: "IN_PROGRESS" },
      { title: "Final Paper", weight: 50, dueOffsetDays: 110, status: "NOT_STARTED" },
    ],
    [
      { title: "Stoichiometry HW", weight: 15, dueOffsetDays: 21, status: "GRADED" },
      { title: "Lab 1 - Titration", weight: 15, dueOffsetDays: 42, status: "GRADED" },
      { title: "Midterm", weight: 35, dueOffsetDays: 60, status: "GRADED" },
      { title: "Lab 2 - Synthesis", weight: 15, dueOffsetDays: 90, status: "SUBMITTED" },
      { title: "Final Exam", weight: 20, dueOffsetDays: 120, status: "NOT_STARTED" },
    ],
  ];

  const fallStart = new Date("2024-09-01");
  const springStart = new Date("2025-01-15");
  const assignmentsCreated: { id: string; courseId: string; status: string; weight: number }[] = [];

  for (let i = 0; i < createdCourses.length; i++) {
    const course = createdCourses[i];
    const specs = assignmentSpecs[i] ?? assignmentSpecs[0];
    const start = course.semesterId === fall2024.id ? fallStart : springStart;

    for (const s of specs) {
      const due = new Date(start);
      due.setDate(due.getDate() + s.dueOffsetDays);
      const assignment = await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: s.title,
          weight: s.weight,
          dueDate: due,
          status: s.status,
          isSubmitted: s.status === "SUBMITTED" || s.status === "GRADED",
        },
      });
      assignmentsCreated.push({
        id: assignment.id,
        courseId: course.id,
        status: s.status,
        weight: s.weight,
      });
    }
  }
  console.log("done");

  // 5. Grades for submitted/graded assignments
  process.stdout.write("Seeding grades... ");
  for (const a of assignmentsCreated) {
    if (a.status === "GRADED") {
      const score = Math.round(65 + Math.random() * 30); // 65-95
      const maxScore = 100;
      await prisma.grade.create({
        data: {
          assignmentId: a.id,
          score,
          maxScore,
          feedback: score >= 90 ? "Excellent work!" : score >= 80 ? "Good job." : "Keep practicing.",
        },
      });
    }
  }
  console.log("done");

  // 6. Notes per course
  process.stdout.write("Seeding notes... ");
  const noteTemplates = [
    { title: "Lecture 1 - Key Concepts", content: "## Overview\n\n- **Main topic**: Introduced core principles\n- **Key terms**: Define these for the quiz\n- **Homework**: Due next week\n\n### Summary\nImportant points from today's class." },
    { title: "Midterm Review", content: "## Study Guide\n\n1. Chapter 1–3: Focus on definitions\n2. Practice problems: 1–20, 45–60\n3. **Format**: Multiple choice + short answer\n\n_Good luck!_" },
    { title: "Office Hours Notes", content: "Clarified:\n- Question about grading rubric\n- Extension policy: 24h max\n\nTODO: Email TA about lab access." },
  ];

  for (const course of createdCourses) {
    const count = 2 + Math.floor(Math.random() * 2); // 2-3
    for (let i = 0; i < count; i++) {
      const t = noteTemplates[i % noteTemplates.length];
      await prisma.note.create({
        data: {
          courseId: course.id,
          title: t.title,
          content: t.content,
          tags: ["lecture", "review", "notes"].slice(0, 1 + (i % 2)),
        },
      });
    }
  }
  console.log("done");

  // 7. Tasks (5–10 total)
  process.stdout.write("Seeding tasks... ");
  const taskSpecs = [
    { title: "Complete CS101 Homework 2", courseIdx: 0, priority: "HIGH" as const },
    { title: "Study for MATH Midterm", courseIdx: 1, priority: "HIGH" as const },
    { title: "Outline Research Paper", courseIdx: 2, priority: "MEDIUM" as const },
    { title: "Review biology lab notes", courseIdx: 3, priority: "LOW" as const },
    { title: "Implement linked list", courseIdx: 4, priority: "HIGH" as const },
    { title: "Physics problem set 3", courseIdx: 5, priority: "MEDIUM" as const },
    { title: "Read history chapter 5", courseIdx: 6, priority: "LOW" as const },
  ];

  const priorities: ("LOW" | "MEDIUM" | "HIGH")[] = ["LOW", "MEDIUM", "HIGH"];
  for (let i = 0; i < 8; i++) {
    const spec = taskSpecs[i % taskSpecs.length];
    const course = createdCourses[spec.courseIdx];
    await prisma.task.create({
      data: {
        userId,
        courseId: course.id,
        title: spec.title,
        priority: i < 4 ? spec.priority : priorities[i % 3],
        isCompleted: i < 3,
      },
    });
  }
  console.log("done");

  // 8. Calendar events (5–8)
  process.stdout.write("Seeding calendar events... ");
  const eventSpecs = [
    { title: "CS101 Lab Session", type: "CLASS" as const, start: "2024-09-05T10:00:00", end: "2024-09-05T11:30:00", courseIdx: 0 },
    { title: "MATH201 Midterm Exam", type: "EXAM" as const, start: "2024-10-15T14:00:00", end: "2024-10-15T16:00:00", courseIdx: 1 },
    { title: "Essay 1 Deadline", type: "DEADLINE" as const, start: "2024-09-21T23:59:00", end: "2024-09-21T23:59:00", courseIdx: 2 },
    { title: "Study Group", type: "PERSONAL" as const, start: "2024-10-10T18:00:00", end: "2024-10-10T20:00:00" },
    { title: "BIO101 Midterm", type: "EXAM" as const, start: "2024-10-25T09:00:00", end: "2024-10-25T11:00:00", courseIdx: 3 },
    { title: "Data Structures Lecture", type: "CLASS" as const, start: "2025-02-10T13:00:00", end: "2025-02-10T14:30:00", courseIdx: 4 },
    { title: "Physics Lab Due", type: "DEADLINE" as const, start: "2025-02-20T23:59:00", end: "2025-02-20T23:59:00", courseIdx: 5 },
    { title: "Spring Break", type: "PERSONAL" as const, start: "2025-03-15T00:00:00", end: "2025-03-22T23:59:00" },
  ];

  for (const e of eventSpecs) {
    await prisma.calendarEvent.create({
      data: {
        userId,
        courseId: e.courseIdx !== undefined ? createdCourses[e.courseIdx].id : null,
        title: e.title,
        type: e.type,
        startDate: new Date(e.start),
        endDate: new Date(e.end),
        isAllDay: e.type === "PERSONAL" && e.title.includes("Break"),
      },
    });
  }
  console.log("done");

  console.log("\nSeed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
