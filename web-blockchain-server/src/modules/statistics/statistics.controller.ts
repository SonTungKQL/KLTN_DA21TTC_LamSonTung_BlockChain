import type { Request, Response } from "express";
import { sendSuccess } from "../../http/response";
import { StatisticsService } from "./statistics.service";

export class StatisticsController {
  constructor(private readonly service = new StatisticsService()) {}
  overview = async (_request: Request, response: Response) => sendSuccess(response, await this.service.overview());
}
