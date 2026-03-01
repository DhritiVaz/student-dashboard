import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createTaskHandler,
  listTasksHandler,
  getTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from "../controllers/taskController";

export const tasksRouter = Router();

tasksRouter.use(authenticateToken);

tasksRouter.post("/", createTaskHandler);
tasksRouter.get("/", listTasksHandler);
tasksRouter.get("/:id", getTaskHandler);
tasksRouter.put("/:id", updateTaskHandler);
tasksRouter.delete("/:id", deleteTaskHandler);
