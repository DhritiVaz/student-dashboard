import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  updateEventHandler,
  deleteEventHandler,
} from "../controllers/eventController";

export const eventsRouter = Router();

eventsRouter.use(authenticateToken);

eventsRouter.post("/", createEventHandler);
eventsRouter.get("/", listEventsHandler);
eventsRouter.get("/:id", getEventHandler);
eventsRouter.put("/:id", updateEventHandler);
eventsRouter.delete("/:id", deleteEventHandler);
