import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
export function authRouter(environment: AppEnvironment) { const router = Router(), controller = new AuthController(new AuthService(environment)); router.post("/login", asyncHandler(controller.login)); router.post("/register", asyncHandler(controller.register)); router.get("/me", authenticate(environment), asyncHandler(controller.me)); return router; }
