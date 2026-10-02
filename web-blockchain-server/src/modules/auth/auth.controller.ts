import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../http/response";
import { AuthService } from "./auth.service";
const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().trim().min(1), studentCode: z.string().trim().min(1), major: z.string().trim().min(1), className: z.string().trim().optional(), course: z.string().trim().optional(), dateOfBirth: z.string().date().optional() });
export class AuthController { constructor(private readonly service: AuthService) {} login = async (request: Request, response: Response) => { const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body); return sendSuccess(response, await this.service.login(input.email, input.password)); }; register = async (request: Request, response: Response) => sendSuccess(response, await this.service.register(registerSchema.parse(request.body)), 201); me = async (request: Request, response: Response) => sendSuccess(response, await this.service.me(request.auth!.userId)); }
