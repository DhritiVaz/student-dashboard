import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  syncLmsHandler,
  getLmsCoursesHandler,
  getLmsAssignmentsHandler,
  getLmsUpcomingHandler,
  getLmsModulesHandler,
  debugLmsHandler,
  debugLmsCourseHandler,
} from "../controllers/lmsController";

export const lmsRouter = Router();

lmsRouter.use(authenticateToken);

lmsRouter.post("/sync", syncLmsHandler);
lmsRouter.get("/courses", getLmsCoursesHandler);
lmsRouter.get("/assignments", getLmsAssignmentsHandler);
lmsRouter.get("/assignments/upcoming", getLmsUpcomingHandler);
lmsRouter.get("/modules", getLmsModulesHandler);
lmsRouter.post("/debug", debugLmsHandler);
lmsRouter.post("/debug/course", debugLmsCourseHandler);
