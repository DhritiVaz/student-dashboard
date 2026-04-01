import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  googleHandler,
} from "../controllers/authController";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in a minute." },
});

// Public auth routes
authRouter.post("/register", registerHandler);
authRouter.post("/login", loginLimiter, loginHandler);
authRouter.post("/google", loginLimiter, googleHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
