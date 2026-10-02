import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../http/error";
import { sendSuccess } from "../../http/response";
import { ConsultationService } from "./consultation.service";
const id = z.string().regex(/^[a-f\d]{24}$/i);
const createBody = z.object({ fullName: z.string().trim().min(1), phone: z.string().trim().min(5), organization: z.string().trim().min(1), interest: z.string().trim().optional(), message: z.string().trim().max(3000).optional() });
export class ConsultationController { constructor(private readonly service = new ConsultationService()) {} create = async (request: Request, response: Response) => sendSuccess(response, await this.service.create(request.auth!.userId, createBody.parse(request.body)), 201); list = async (request: Request, response: Response) => { const query = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), status: z.enum(["NEW", "CONTACTED", "CLOSED"]).optional() }).parse(request.query); return sendSuccess(response, await this.service.list(query.page, query.limit, query.status)); }; updateStatus = async (request: Request, response: Response) => { const item = await this.service.updateStatus(id.parse(request.params.id), z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) }).parse(request.body).status); if (!item) throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND"); return sendSuccess(response, item); }; }
