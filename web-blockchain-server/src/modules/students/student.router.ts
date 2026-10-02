import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { StudentController } from "./student.controller";
export function studentRouter(environment: AppEnvironment) { const router = Router(), controller = new StudentController(); router.use(authenticate(environment), requireRole("ADMIN")); router.get("/", asyncHandler(controller.list)); router.post("/", asyncHandler(controller.create)); router.get("/:id", asyncHandler(controller.detail)); router.patch("/:id", asyncHandler(controller.update)); return router; }
