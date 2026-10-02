import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { SettingsController } from "./settings.controller";

export function settingsRouter(environment: AppEnvironment) {
  const router = Router();
  const controller = new SettingsController(environment);
  router.use(authenticate(environment), requireRole("ADMIN"));
  router.post("/fake-data", asyncHandler(controller.generateFakeData));
  return router;
}
