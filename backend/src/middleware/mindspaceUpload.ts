import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { getMindspaceUploadRoot } from "../services/mindspaceService";
import type { AuthenticatedRequest } from "./authenticate";

const MAX_BYTES = 40 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const userId = (req as AuthenticatedRequest).userId;
    const dir = path.join(getMindspaceUploadRoot(), userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const mindspaceUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
});
