import { Router } from "express";
import { authenticateToken } from "../middleware/authenticate";
import {
  getMeHandler,
  patchMeHandler,
  changePasswordHandler,
  logoutAllHandler,
} from "../controllers/userController";

export const usersRouter = Router();

usersRouter.use(authenticateToken);

usersRouter.get("/me", getMeHandler);
usersRouter.patch("/me", patchMeHandler);
usersRouter.post("/me/password", changePasswordHandler);
usersRouter.post("/me/logout-all", logoutAllHandler);
