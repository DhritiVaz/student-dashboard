import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createCourseHandler,
  listCoursesHandler,
  getCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from "../controllers/courseController";
import { getCourseGpaHandler } from "../controllers/gradeController";

export const coursesRouter = Router();

// All course routes require authentication
coursesRouter.use(authenticateToken);

coursesRouter.post("/", createCourseHandler);
coursesRouter.get("/", listCoursesHandler);
coursesRouter.get("/:id", getCourseHandler);
coursesRouter.get("/:id/gpa", getCourseGpaHandler);
coursesRouter.put("/:id", updateCourseHandler);
coursesRouter.delete("/:id", deleteCourseHandler);
