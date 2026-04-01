import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  getCaptchaHandler,
  syncVtopHandler,
  getAttendanceHandler,
  getGradesHandler,
  getGradesSummaryHandler,
  getCgpaHandler,
  getSemesterGradesHandler,
  getMarksHandler,
  getAcademicEventsHandler,
  getTimetableHandler,
} from "../controllers/vtopController";

export const vtopRouter = Router();

vtopRouter.use(authenticateToken);

vtopRouter.get("/captcha", getCaptchaHandler);
vtopRouter.post("/sync", syncVtopHandler);
vtopRouter.get("/attendance", getAttendanceHandler);
vtopRouter.get("/grades", getGradesHandler);
vtopRouter.get("/grades/summary", getGradesSummaryHandler);
vtopRouter.get("/cgpa", getCgpaHandler);
vtopRouter.get("/semester-grades", getSemesterGradesHandler);
vtopRouter.get("/marks", getMarksHandler);
vtopRouter.get("/academic-events", getAcademicEventsHandler);
vtopRouter.get("/timetable", getTimetableHandler);