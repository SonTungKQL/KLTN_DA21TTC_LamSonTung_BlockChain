import type { Request, Response } from "express";
import type { AppEnvironment } from "../../config/env";
import { AppError } from "../../http/error";
import { sendSuccess } from "../../http/response";
import { BlockchainService } from "../blockchain/blockchain.service";
import { InstitutionService } from "./institution.service";

export class InstitutionController {
  private readonly blockchain: BlockchainService;

  constructor(
    environment: AppEnvironment,
    private readonly service = new InstitutionService(),
  ) {
    this.blockchain = new BlockchainService(environment);
  }

  list = async (_request: Request, response: Response) =>
    sendSuccess(response, await this.service.list());

  create = async (request: Request, response: Response) =>
    sendSuccess(response, await this.service.create(request.body), 201);

  update = async (request: Request, response: Response) => {
    const institutionId = String(request.params.id);

    return sendSuccess(
      response,
      await this.service.update(institutionId, request.body),
    );
  };

  authorizeIssuer = async (request: Request, response: Response) => {
    const institutionId = String(request.params.id);

    const institution = await this.service.getRequired(institutionId);

    if (!institution.blockchainIssuerAddress) {
      throw new AppError(
        "Institution issuer address is required",
        422,
        "ISSUER_ADDRESS_REQUIRED",
      );
    }

    const alreadyAuthorized = await this.blockchain.isIssuerAuthorized(
      institution.blockchainIssuerAddress,
    );

    if (alreadyAuthorized) {
      return sendSuccess(
        response,
        await this.service.markIssuerAuthorized(institution._id.toString()),
      );
    }

    const transaction = await this.blockchain.setIssuerAuthorization(
      institution.blockchainIssuerAddress,
      true,
    );

    const receipt = await this.blockchain.waitForTransaction(transaction);

    const updatedInstitution = await this.service.markIssuerAuthorized(
      institution._id.toString(),
      transaction.hash,
    );

    return sendSuccess(response, {
      institution: updatedInstitution,
      blockNumber: receipt.blockNumber,
    });
  };
}
