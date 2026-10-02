import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../http/response";
import { BlockchainTransactionService } from "./blockchain-transaction.service";
import type { AppEnvironment } from "../../config/env";
export class BlockchainTransactionController {
  private readonly service: BlockchainTransactionService;
  constructor(environment: AppEnvironment) {
    this.service = new BlockchainTransactionService(environment);
  }
  list = async (request: Request, response: Response) => {
    const query = z
      .object({
        status: z
          .enum(["CREATED", "SUBMITTED", "CONFIRMED", "FAILED"])
          .optional(),
        action: z.enum(["ISSUE_CERTIFICATE", "REVOKE_CERTIFICATE"]).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      })
      .parse(request.query);
    return sendSuccess(response, await this.service.list(query));
  };
}
