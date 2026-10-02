import type { NextFunction, Request, Response } from "express";
import type { AppEnvironment } from "../config/env";
import { verifyToken } from "../common/jwt";
import { AppError } from "../http/error";

declare global { namespace Express { interface Request { auth?: { userId: string; role: "ADMIN" | "STUDENT" } } } }

export function authenticate(environment: AppEnvironment) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new AppError("Authentication is required", 401, "UNAUTHORIZED"));
    try { const payload = verifyToken(token, environment); request.auth = { userId: payload.sub, role: payload.role }; next(); } catch (error) { next(error); }
  };
}
export function requireRole(...roles: Array<"ADMIN" | "STUDENT">) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) return next(new AppError("Authentication is required", 401, "UNAUTHORIZED"));
    if (!roles.includes(request.auth.role)) return next(new AppError("Insufficient permission", 403, "FORBIDDEN"));
    next();
  };
}
