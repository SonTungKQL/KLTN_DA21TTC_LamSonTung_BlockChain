import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
export function verificationRouter(environment: AppEnvironment) { const router = Router(), controller = new VerificationController(new VerificationService(environment)); router.get("/certificates/verify/:certificateCode", asyncHandler(controller.verify)); return router; }
