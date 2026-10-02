import { Router } from "express";
import { asyncHandler } from "../../common/async-handler";
import type { AppEnvironment } from "../../config/env";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { AcademicController } from "./academic.controller";

export function academicRouter(environment: AppEnvironment) {
  const router = Router();
  const controller = new AcademicController();
  router.use(authenticate(environment), requireRole("ADMIN"));
  router.get("/majors", asyncHandler(controller.listMajors));
  router.post("/majors", asyncHandler(controller.createMajor));
  router.patch("/majors/:id", asyncHandler(controller.updateMajor));
  router.get("/courses", asyncHandler(controller.listCourses));
  router.post("/courses", asyncHandler(controller.createCourse));
  router.patch("/courses/:id", asyncHandler(controller.updateCourse));
  router.get("/classes", asyncHandler(controller.listClasses));
  router.post("/classes", asyncHandler(controller.createClass));
  router.patch("/classes/:id", asyncHandler(controller.updateClass));
  return router;
}
