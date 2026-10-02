import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { StudentCertificateController } from "./student-certificate.controller";
export function studentCertificateRouter(environment: AppEnvironment) { const router = Router(), controller = new StudentCertificateController(environment); router.use(authenticate(environment), requireRole("STUDENT")); router.get("/", asyncHandler(controller.list)); router.get("/:id/verification-qr", asyncHandler(controller.verificationQr)); router.get("/:id", asyncHandler(controller.detail)); return router; }
