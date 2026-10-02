import { Router } from "express";
import type { AppEnvironment } from "../../config/env";
import { asyncHandler } from "../../common/async-handler";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { BlockchainTransactionController } from "./blockchain-transaction.controller";
export function blockchainTransactionRouter(environment: AppEnvironment) { const router = Router(), controller = new BlockchainTransactionController(environment); router.use(authenticate(environment), requireRole("ADMIN")); router.get("/", asyncHandler(controller.list)); return router; }
