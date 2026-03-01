import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createSemesterHandler,
  listSemestersHandler,
  getSemesterHandler,
  updateSemesterHandler,
  deleteSemesterHandler,
} from "../controllers/semesterController";

export const semestersRouter = Router();

// All semester routes require authentication
semestersRouter.use(authenticateToken);

semestersRouter.post("/", createSemesterHandler);
semestersRouter.get("/", listSemestersHandler);
semestersRouter.get("/:id", getSemesterHandler);
semestersRouter.put("/:id", updateSemesterHandler);
semestersRouter.delete("/:id", deleteSemesterHandler);
