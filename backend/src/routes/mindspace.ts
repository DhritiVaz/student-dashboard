import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/authenticate";
import { mindspaceUpload } from "../middleware/mindspaceUpload";
import {
  listEntriesHandler,
  createTextHandler,
  createFileHandler,
  viewFileHandler,
  downloadFileHandler,
  deleteEntryHandler,
} from "../controllers/mindspaceController";
import { fail } from "../lib/response";

export const mindspaceRouter = Router();

mindspaceRouter.use(authenticateToken);

mindspaceRouter.get("/", listEntriesHandler);

mindspaceRouter.post("/text", createTextHandler);

mindspaceRouter.post("/file", (req, res, next) => {
  mindspaceUpload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return fail(res, "File too large (max 40 MB)", 400);
      return fail(res, err.message, 400);
    }
    if (err) return next(err);
    next();
  });
}, createFileHandler);

mindspaceRouter.get("/:id/view",     viewFileHandler);
mindspaceRouter.get("/:id/download", downloadFileHandler);
mindspaceRouter.delete("/:id",       deleteEntryHandler);
