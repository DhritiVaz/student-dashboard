import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import { searchHandler } from "../controllers/searchController";

export const searchRouter = Router();

searchRouter.use(authenticateToken);
searchRouter.get("/", searchHandler as any);
