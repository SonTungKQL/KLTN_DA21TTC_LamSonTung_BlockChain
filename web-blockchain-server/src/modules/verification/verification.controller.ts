import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../http/response";
import { VerificationService } from "./verification.service";
export class VerificationController { constructor(private readonly service: VerificationService) {} verify = async (request: Request, response: Response) => { const method = z.enum(["QR", "CODE", "HASH"]).default("CODE").parse(request.query.method); return sendSuccess(response, await this.service.verify(Array.isArray(request.params.certificateCode) ? request.params.certificateCode[0] : request.params.certificateCode, method, request.ip, request.header("user-agent") ?? undefined)); }; }
