import { Router } from "express";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import type { AppEnvironment } from "../../config/env";
import { InstitutionController } from "./institution.controller";
export function institutionRouter(environment: AppEnvironment) { const router = Router(), controller = new InstitutionController(environment); router.use(authenticate(environment), requireRole("ADMIN")); router.get("/", asyncHandler(controller.list)); router.post("/", asyncHandler(controller.create)); router.patch("/:id", asyncHandler(controller.update)); router.post("/:id/authorize-issuer", asyncHandler(controller.authorizeIssuer)); return router; }
