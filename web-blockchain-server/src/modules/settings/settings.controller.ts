import type { Request, Response } from "express";
import { z } from "zod";
import type { AppEnvironment } from "../../config/env";
import { sendSuccess } from "../../http/response";
import { FakeDataService } from "./fake-data.service";

const generateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(200),
});

export class SettingsController {
  private readonly fakeData: FakeDataService;

  constructor(environment: AppEnvironment) {
    this.fakeData = new FakeDataService(environment);
  }

  generateFakeData = async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await this.fakeData.generate(
        generateSchema.parse(request.body).quantity,
        request.auth!.userId,
      ),
      201,
    );
}
