import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export function sendSuccess<T>(
  response: Response,
  data: T,
  status = 200,
): Response<ApiSuccess<T>> {
  return response.status(status).json({ success: true, data });
}
