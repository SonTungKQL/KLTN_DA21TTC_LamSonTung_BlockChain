import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import type { AppEnvironment } from "./config/env";
import { errorHandler } from "./http/error";
import { sendSuccess } from "./http/response";
import {
  responseEncryption,
  requestDecryption,
} from "./middlewares/encryption.middleware";
import { openApiAdminDocument, openApiClientDocument } from "./docs/openapi";
import { authRouter } from "./modules/auth/auth.router";
import { studentRouter } from "./modules/students/student.router";
import { institutionRouter } from "./modules/institutions/institution.router";
import { certificateRouter } from "./modules/certificates/certificate.router";
import { verificationRouter } from "./modules/verification/verification.router";
import { blockchainTransactionRouter } from "./modules/blockchain/blockchain-transaction.router";
import { studentCertificateRouter } from "./modules/certificates/student-certificate.router";
import { consultationRouter } from "./modules/consultations/consultation.router";
import { academicRouter } from "./modules/academics/academic.router";
import { statisticsRouter } from "./modules/statistics/statistics.router";
import { settingsRouter } from "./modules/settings/settings.router";

export function createApp(environment: AppEnvironment) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(responseEncryption(environment));
  app.use(requestDecryption(environment));
  app.get("/api/health", (_request, response) =>
    sendSuccess(response, {
      status: "ok",
      service: "certificate-blockchain-api",
    }),
  );
  app.get("/api/openapi.admin.json", (_request, response) =>
    response.json(openApiAdminDocument),
  );
  app.get("/api/openapi.client.json", (_request, response) =>
    response.json(openApiClientDocument),
  );
  app.get("/api/openapi.json", (_request, response) =>
    response.json(openApiAdminDocument),
  );
  app.use(
    "/api/docs/admin",
    swaggerUi.serveFiles(openApiAdminDocument),
    swaggerUi.setup(openApiAdminDocument, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.use(
    "/api/docs/client",
    swaggerUi.serveFiles(openApiClientDocument),
    swaggerUi.setup(openApiClientDocument, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get("/api/docs", (_request, response) =>
    response.redirect("/api/docs/admin"),
  );
  app.use("/api/auth", authRouter(environment));
  app.use("/api/admin/students", studentRouter(environment));
  app.use("/api/admin/institutions", institutionRouter(environment));
  app.use("/api/admin/academics", academicRouter(environment));
  app.use("/api/admin/statistics", statisticsRouter(environment));
  app.use("/api/admin/settings", settingsRouter(environment));
  app.use("/api/admin/certificates", certificateRouter(environment));
  app.use(
    "/api/admin/blockchain-transactions",
    blockchainTransactionRouter(environment),
  );
  app.use("/api/student/certificates", studentCertificateRouter(environment));
  app.use("/api/consultations", consultationRouter(environment));
  app.use("/api/admin/consultations", consultationRouter(environment));
  app.use("/api/public", verificationRouter(environment));
  app.use(errorHandler);
  return app;
}
