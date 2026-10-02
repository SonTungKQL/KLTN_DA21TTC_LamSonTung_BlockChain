import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { ConsultationController } from "./consultation.controller";
export function consultationRouter(environment: AppEnvironment) { const router = Router(), controller = new ConsultationController(); router.use(authenticate(environment)); router.post("/", asyncHandler(controller.create)); router.use(requireRole("ADMIN")); router.get("/", asyncHandler(controller.list)); router.patch("/:id", asyncHandler(controller.updateStatus)); return router; }
