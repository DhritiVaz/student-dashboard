import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  createNoteHandler,
  listNotesHandler,
  getNoteHandler,
  updateNoteHandler,
  deleteNoteHandler,
} from "../controllers/noteController";

export const notesRouter = Router();

notesRouter.use(authenticateToken);

notesRouter.post("/", createNoteHandler);
notesRouter.get("/", listNotesHandler);
notesRouter.get("/:id", getNoteHandler);
notesRouter.put("/:id", updateNoteHandler);
notesRouter.delete("/:id", deleteNoteHandler);
