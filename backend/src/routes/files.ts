import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/authenticate";
import { studentFileUpload } from "../middleware/studentFileUpload";
import {
  createFileHandler,
  listFilesHandler,
  downloadFileHandler,
  updateFileHandler,
  deleteFileHandler,
} from "../controllers/fileController";
import { fail } from "../lib/response";

export const filesRouter = Router();

filesRouter.use(authenticateToken);

filesRouter.get("/", listFilesHandler);

filesRouter.post("/", (req, res, next) => {
  studentFileUpload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return fail(res, "File too large (max 40 MB)", 400);
      }
      return fail(res, err.message, 400);
    }
    if (err) return next(err);
    next();
  });
}, createFileHandler);

filesRouter.get("/:id/download", downloadFileHandler);
filesRouter.patch("/:id", updateFileHandler);
filesRouter.delete("/:id", deleteFileHandler);
