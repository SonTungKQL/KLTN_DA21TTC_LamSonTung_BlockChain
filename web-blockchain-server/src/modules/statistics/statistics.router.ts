import { Router } from "express";
import { asyncHandler } from "../../common/async-handler";
import type { AppEnvironment } from "../../config/env";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { StatisticsController } from "./statistics.controller";

export function statisticsRouter(environment: AppEnvironment) {
  const router = Router();
  const controller = new StatisticsController();
  router.use(authenticate(environment), requireRole("ADMIN"));
  router.get("/overview", asyncHandler(controller.overview));
  return router;
}
