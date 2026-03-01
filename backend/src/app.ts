import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { semestersRouter } from "./routes/semesters";
import { coursesRouter } from "./routes/courses";
import { assignmentsRouter } from "./routes/assignments";
import { gradesRouter } from "./routes/grades";
import { notesRouter } from "./routes/notes";
import { tasksRouter } from "./routes/tasks";
import { eventsRouter } from "./routes/events";
import { searchRouter } from "./routes/search";

const app = express();

app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/semesters", semestersRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/grades", gradesRouter);
app.use("/api/notes", notesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/search", searchRouter);

export default app;
