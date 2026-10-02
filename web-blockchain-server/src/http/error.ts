import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(message: string, public readonly statusCode = 500, public readonly code = "INTERNAL_ERROR") {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.flatten() } });
  }
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
  }
  console.error(error);
  return response.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } });
};
