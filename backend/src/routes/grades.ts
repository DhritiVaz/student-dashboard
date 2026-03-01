import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createGradeHandler,
  listGradesHandler,
  updateGradeHandler,
  deleteGradeHandler,
} from "../controllers/gradeController";

export const gradesRouter = Router();

gradesRouter.use(authenticateToken);

gradesRouter.post("/", createGradeHandler);
gradesRouter.get("/", listGradesHandler);
gradesRouter.put("/:id", updateGradeHandler);
gradesRouter.delete("/:id", deleteGradeHandler);
