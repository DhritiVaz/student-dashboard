import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  getCaptchaHandler,
  syncVtopHandler,
  quickSyncHandler,
  getAttendanceHandler,
  getGradesHandler,
  getGradesSummaryHandler,
  getCgpaHandler,
  getSemesterGradesHandler,
  getMarksHandler,
  getAcademicEventsHandler,
  getTimetableHandler,
  storeCredentialsHandler,
  getCredentialsHandler,
  deleteCredentialsHandler,
} from "../controllers/vtopController";

export const vtopRouter = Router();

vtopRouter.use(authenticateToken);

// Captcha & Sync
vtopRouter.get("/captcha", getCaptchaHandler);
vtopRouter.post("/sync", syncVtopHandler);
vtopRouter.post("/sync-quick", quickSyncHandler);

// Credentials
vtopRouter.get("/credentials", getCredentialsHandler);
vtopRouter.put("/credentials", storeCredentialsHandler);
vtopRouter.delete("/credentials", deleteCredentialsHandler);

// Data
vtopRouter.get("/attendance", getAttendanceHandler);
vtopRouter.get("/grades", getGradesHandler);
vtopRouter.get("/grades/summary", getGradesSummaryHandler);
vtopRouter.get("/cgpa", getCgpaHandler);
vtopRouter.get("/semester-grades", getSemesterGradesHandler);
vtopRouter.get("/marks", getMarksHandler);
vtopRouter.get("/academic-events", getAcademicEventsHandler);
vtopRouter.get("/timetable", getTimetableHandler);