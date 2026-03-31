import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  getCaptchaHandler,
  syncVtopHandler,
  getAttendanceHandler,
  getGradesHandler,
  getAcademicEventsHandler,
  getTimetableHandler,
} from "../controllers/vtopController";

export const vtopRouter = Router();

vtopRouter.use(authenticateToken);

vtopRouter.get("/captcha", getCaptchaHandler);
vtopRouter.post("/sync", syncVtopHandler);
vtopRouter.get("/attendance", getAttendanceHandler);
vtopRouter.get("/grades", getGradesHandler);
vtopRouter.get("/academic-events", getAcademicEventsHandler);
vtopRouter.get("/timetable", getTimetableHandler);