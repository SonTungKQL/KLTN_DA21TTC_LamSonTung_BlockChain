import { Contract, JsonRpcProvider, Wallet, isAddress } from "ethers";
import type { AppEnvironment } from "../../config/env";
import { AppError } from "../../http/error";
import abi from "../../blockchain/certificate-registry.abi.json";

export interface OnChainCertificate {
  documentHash: string;
  issuedAt: bigint;
  issuer: string;
  exists: boolean;
  revoked: boolean;
}

export class BlockchainService {
  private readonly provider: JsonRpcProvider;

  constructor(private readonly environment: AppEnvironment) {
    this.provider = new JsonRpcProvider(
      environment.BLOCKCHAIN_RPC_URL,
      environment.BLOCKCHAIN_CHAIN_ID,
    );
  }

  private readContract() {
    if (!this.environment.CERTIFICATE_CONTRACT_ADDRESS)
      throw new AppError(
        "Certificate contract is not configured",
        503,
        "BLOCKCHAIN_NOT_CONFIGURED",
      );
    return new Contract(
      this.environment.CERTIFICATE_CONTRACT_ADDRESS,
      abi,
      this.provider,
    );
  }

  private issuerKeys() {
    if (!this.environment.BLOCKCHAIN_ISSUER_PRIVATE_KEYS)
      return {} as Record<string, string>;
    try {
      const parsed = JSON.parse(
        this.environment.BLOCKCHAIN_ISSUER_PRIVATE_KEYS,
      ) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("not an object");
      return Object.fromEntries(
        Object.entries(parsed)
          .filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          )
          .map(([code, key]) => [code.trim().toUpperCase(), key]),
      );
    } catch {
      throw new AppError(
        "BLOCKCHAIN_ISSUER_PRIVATE_KEYS must be a JSON object",
        500,
        "BLOCKCHAIN_CONFIGURATION_ERROR",
      );
    }
  }

  private signingKey(institutionCode?: string) {
    const key = institutionCode
      ? this.issuerKeys()[institutionCode.trim().toUpperCase()]
      : undefined;
    const selected = key ?? this.environment.BLOCKCHAIN_PRIVATE_KEY;
    if (!selected)
      throw new AppError(
        "Blockchain signer is not configured",
        503,
        "BLOCKCHAIN_NOT_CONFIGURED",
      );
    return selected;
  }

  private writeContract(institutionCode?: string) {
    return this.readContract().connect(
      new Wallet(this.signingKey(institutionCode), this.provider),
    ) as Contract;
  }

  async assertInstitutionSigner(
    institutionCode: string,
    issuerAddress?: string,
  ) {
    if (!issuerAddress) return;
    if (!isAddress(issuerAddress))
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    const signer = new Wallet(this.signingKey(institutionCode)).address;
    if (signer.toLowerCase() !== issuerAddress.toLowerCase())
      throw new AppError(
        "Configured issuer key does not match the institution issuer address",
        409,
        "INSTITUTION_ISSUER_MISMATCH",
      );
  }

  async getCertificate(certificateCode: string): Promise<OnChainCertificate> {
    try {
      const result = await this.readContract().getCertificate(certificateCode);
      return {
        documentHash: result[0],
        issuedAt: result[1],
        issuer: result[2],
        exists: result[3],
        revoked: result[4],
      };
    } catch (error) {
      throw this.normalize(error);
    }
  }

  async isIssuerAuthorized(address: string) {
    if (!isAddress(address))
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    try {
      return Boolean(await this.readContract().authorizedIssuers(address));
    } catch (error) {
      throw this.normalize(error);
    }
  }

  async setIssuerAuthorization(address: string, authorized: boolean) {
    if (!isAddress(address))
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    try {
      return await (this.writeContract() as any).setIssuerAuthorization(
        address,
        authorized,
      );
    } catch (error) {
      throw this.normalize(error);
    }
  }

  async issueCertificate(
    certificateCode: string,
    documentHash: string,
    institutionCode?: string,
  ) {
    try {
      return await (
        this.writeContract(institutionCode) as any
      ).issueCertificate(certificateCode, documentHash);
    } catch (error) {
      throw this.normalize(error);
    }
  }

  async revokeCertificate(certificateCode: string) {
    try {
      return await (this.writeContract() as any).revokeCertificate(
        certificateCode,
      );
    } catch (error) {
      throw this.normalize(error);
    }
  }

  async waitForTransaction(transaction: {
    wait: () => Promise<{ status: number | null; blockNumber: number } | null>;
  }) {
    try {
      const receipt = await transaction.wait();
      if (!receipt || receipt.status !== 1)
        throw new AppError(
          "Blockchain transaction reverted",
          502,
          "BLOCKCHAIN_TRANSACTION_REVERTED",
        );
      return receipt;
    } catch (error) {
      throw error instanceof AppError ? error : this.normalize(error);
    }
  }

  private normalize(error: unknown) {
    console.log("blockchan.serrvices");
    const message =
      error instanceof Error ? error.message : "Blockchain operation failed";
    const lower = message.toLowerCase();
    const code = lower.includes("insufficient funds")
      ? "BLOCKCHAIN_INSUFFICIENT_FUNDS"
      : lower.includes("timeout")
      ? "BLOCKCHAIN_TIMEOUT"
      : lower.includes("network") || lower.includes("connect")
      ? "BLOCKCHAIN_NETWORK_ERROR"
      : lower.includes("revert")
      ? "BLOCKCHAIN_TRANSACTION_REVERTED"
      : "BLOCKCHAIN_ISSUE_FAILED";
    return new AppError(message, 502, code);
  }
}
