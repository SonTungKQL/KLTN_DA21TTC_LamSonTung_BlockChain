import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { CertificateController } from "./certificate.controller";
import { CertificateService } from "./certificate.service";
export function certificateRouter(environment: AppEnvironment) {
  const router = Router(),
    controller = new CertificateController(new CertificateService(environment));
  router.use(authenticate(environment), requireRole("ADMIN"));
  router.get("/", asyncHandler(controller.list));
  router.post("/", asyncHandler(controller.issue));
  router.get("/:id/verification-qr", asyncHandler(controller.verificationQr));
  router.get("/:id", asyncHandler(controller.detail));
  router.post("/:id/retry-blockchain", asyncHandler(controller.retry));
  router.post("/:id/revoke", asyncHandler(controller.revoke));
  return router;
}
