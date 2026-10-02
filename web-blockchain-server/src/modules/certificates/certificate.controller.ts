import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../http/response";
import { CertificateService } from "./certificate.service";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength).optional(),
  );
const issueSchema = z.object({
  studentId: id,
  institutionId: id,
  certificateName: z.string().trim().min(1).max(300),
  degreeType: optionalText(100),
  major: z.string().trim().min(1).max(200),
  classification: optionalText(100),
  issueDate: z.string().date(),
  documentUrl: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().url().max(2_000).optional(),
  ),
});
const listSchema = z.object({
  keyword: z.string().trim().optional(),
  status: z
    .enum(["PENDING", "ISSUED", "BLOCKCHAIN_FAILED", "REVOKED"])
    .optional(),
  blockchainStatus: z
    .enum(["NOT_SUBMITTED", "SUBMITTED", "CONFIRMED", "FAILED"])
    .optional(),
  studentId: id.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export class CertificateController {
  constructor(private readonly service: CertificateService) {}
  issue = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await this.service.issue(
        issueSchema.parse(request.body),
        request.auth!.userId,
      ),
      201,
    );
  list = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await this.service.list(listSchema.parse(request.query)),
    );
  detail = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await this.service.getRequired(id.parse(request.params.id)),
    );
  verificationQr = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      this.service.verificationQr(
        await this.service.getRequired(id.parse(request.params.id)),
      ),
    );
  retry = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await this.service.retry(id.parse(request.params.id)),
    );
  revoke = async (request: Request, response: Response) => {
    const { reason } = z
      .object({ reason: z.string().trim().min(1).max(1000) })
      .parse(request.body);
    return sendSuccess(
      response,
      await this.service.revoke(id.parse(request.params.id), reason),
    );
  };
}
