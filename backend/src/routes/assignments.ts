import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createAssignmentHandler,
  listAssignmentsHandler,
  getAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from "../controllers/assignmentController";

export const assignmentsRouter = Router();

assignmentsRouter.use(authenticateToken);

assignmentsRouter.post("/", createAssignmentHandler);
assignmentsRouter.get("/", listAssignmentsHandler);
assignmentsRouter.get("/:id", getAssignmentHandler);
assignmentsRouter.put("/:id", updateAssignmentHandler);
assignmentsRouter.delete("/:id", deleteAssignmentHandler);
