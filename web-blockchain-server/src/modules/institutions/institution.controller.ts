import type { Request, Response } from "express";
import { z } from "zod";
import type { AppEnvironment } from "../../config/env";
import { AppError } from "../../http/error";
import { sendSuccess } from "../../http/response";
import { BlockchainService } from "../blockchain/blockchain.service";
import { InstitutionService } from "./institution.service";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const schema = z.object({ name: z.string().trim().min(1), code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9]+$/, "Institution code must contain only letters and numbers").transform((value) => value.toUpperCase()), address: z.string().trim().optional(), blockchainIssuerAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid issuer address").optional() });
const updateSchema = schema.omit({ code: true });

export class InstitutionController {
  private readonly blockchain: BlockchainService;

  constructor(environment: AppEnvironment, private readonly service = new InstitutionService()) {
    this.blockchain = new BlockchainService(environment);
  }

  list = async (_request: Request, response: Response) => sendSuccess(response, await this.service.list());
  create = async (request: Request, response: Response) => sendSuccess(response, await this.service.create(schema.parse(request.body)), 201);
  update = async (request: Request, response: Response) => sendSuccess(response, await this.service.update(id.parse(request.params.id), updateSchema.parse(request.body)));

  authorizeIssuer = async (request: Request, response: Response) => {
    const institution = await this.service.getRequired(id.parse(request.params.id));
    if (!institution.blockchainIssuerAddress) throw new AppError("Institution issuer address is required", 422, "ISSUER_ADDRESS_REQUIRED");
    const alreadyAuthorized = await this.blockchain.isIssuerAuthorized(institution.blockchainIssuerAddress);
    if (alreadyAuthorized) return sendSuccess(response, await this.service.markIssuerAuthorized(institution._id.toString()));
    const transaction = await this.blockchain.setIssuerAuthorization(institution.blockchainIssuerAddress, true);
    const receipt = await this.blockchain.waitForTransaction(transaction);
    const updatedInstitution = await this.service.markIssuerAuthorized(institution._id.toString(), transaction.hash);
    return sendSuccess(response, { institution: updatedInstitution, blockNumber: receipt.blockNumber });
  };
}
