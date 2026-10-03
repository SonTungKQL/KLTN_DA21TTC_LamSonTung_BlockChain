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

type BlockchainOperation =
  | "read"
  | "issue"
  | "revoke"
  | "authorize"
  | "transaction"
  | "unknown";

interface EthersLikeError {
  code?: string;
  message?: string;
  shortMessage?: string;
  reason?: string;
  action?: string;
  data?: unknown;
  transaction?: unknown;
  info?: unknown;

  error?: {
    code?: string;
    message?: string;
    data?: unknown;
  };
}

export class BlockchainService {
  private readonly provider: JsonRpcProvider;

  constructor(private readonly environment: AppEnvironment) {
    this.provider = new JsonRpcProvider(
      environment.BLOCKCHAIN_RPC_URL,
      environment.BLOCKCHAIN_CHAIN_ID,
    );
  }

  // =========================================================
  // CONTRACT READ
  // =========================================================

  private readContract() {
    const contractAddress = this.environment.CERTIFICATE_CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new AppError(
        "Certificate contract is not configured",
        503,
        "BLOCKCHAIN_NOT_CONFIGURED",
      );
    }

    if (!isAddress(contractAddress)) {
      throw new AppError(
        `Certificate contract address is invalid: ${contractAddress}`,
        500,
        "BLOCKCHAIN_INVALID_CONTRACT_ADDRESS",
      );
    }

    return new Contract(contractAddress, abi, this.provider);
  }

  // =========================================================
  // ISSUER KEYS
  // =========================================================

  private issuerKeys() {
    if (!this.environment.BLOCKCHAIN_ISSUER_PRIVATE_KEYS) {
      return {} as Record<string, string>;
    }

    try {
      const parsed = JSON.parse(
        this.environment.BLOCKCHAIN_ISSUER_PRIVATE_KEYS,
      ) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("not an object");
      }

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

    if (!selected) {
      throw new AppError(
        "Blockchain signer is not configured",
        503,
        "BLOCKCHAIN_NOT_CONFIGURED",
      );
    }

    return selected;
  }

  // =========================================================
  // WRITE CONTRACT
  // =========================================================

  private writeContract(institutionCode?: string) {
    const wallet = new Wallet(this.signingKey(institutionCode), this.provider);

    return this.readContract().connect(wallet) as Contract;
  }

  // =========================================================
  // CHECK CONTRACT / NETWORK
  // =========================================================

  private async assertContractReady() {
    const contractAddress = this.environment.CERTIFICATE_CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new AppError(
        "Certificate contract is not configured",
        503,
        "BLOCKCHAIN_NOT_CONFIGURED",
      );
    }

    if (!isAddress(contractAddress)) {
      throw new AppError(
        `Certificate contract address is invalid: ${contractAddress}`,
        500,
        "BLOCKCHAIN_INVALID_CONTRACT_ADDRESS",
      );
    }

    try {
      const network = await this.provider.getNetwork();

      const actualChainId = Number(network.chainId);

      const expectedChainId = Number(this.environment.BLOCKCHAIN_CHAIN_ID);

      console.log("========== BLOCKCHAIN NETWORK ==========");

      console.log({
        rpc: this.environment.BLOCKCHAIN_RPC_URL,

        expectedChainId,

        actualChainId,

        contractAddress,
      });

      console.log("========================================");

      if (expectedChainId && expectedChainId !== actualChainId) {
        throw new AppError(
          `Sai blockchain network. Expected chainId=${expectedChainId}, actual chainId=${actualChainId}.`,
          503,
          "BLOCKCHAIN_CHAIN_ID_MISMATCH",
        );
      }

      const code = await this.provider.getCode(contractAddress);

      console.log("========== BLOCKCHAIN CONTRACT ==========");

      console.log({
        contractAddress,
        hasCode: code !== "0x",
        codeLength: code.length,
        codePreview: code === "0x" ? "0x" : `${code.substring(0, 40)}...`,
      });

      console.log("=========================================");

      if (!code || code === "0x") {
        throw new AppError(
          `Không tìm thấy Smart Contract tại địa chỉ ${contractAddress} trên chain ${actualChainId}. Có thể contract chưa deploy, Ganache đã reset hoặc .env đang giữ address cũ.`,
          503,
          "BLOCKCHAIN_CONTRACT_NOT_FOUND",
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw this.normalize(error, "read");
    }
  }

  // =========================================================
  // ASSERT INSTITUTION SIGNER
  // =========================================================

  async assertInstitutionSigner(
    institutionCode: string,
    issuerAddress?: string,
  ) {
    if (!issuerAddress) {
      return;
    }

    if (!isAddress(issuerAddress)) {
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    }

    const signer = new Wallet(this.signingKey(institutionCode)).address;

    if (signer.toLowerCase() !== issuerAddress.toLowerCase()) {
      throw new AppError(
        "Configured issuer key does not match the institution issuer address",
        409,
        "INSTITUTION_ISSUER_MISMATCH",
      );
    }
  }

  // =========================================================
  // GET CERTIFICATE
  // =========================================================

  async getCertificate(certificateCode: string): Promise<OnChainCertificate> {
    try {
      await this.assertContractReady();

      const contract = this.readContract();

      const network = await this.provider.getNetwork();

      const contractAddress = this.environment.CERTIFICATE_CONTRACT_ADDRESS!;

      const contractCode = await this.provider.getCode(contractAddress);

      console.log("========== CHAIN READ ==========");

      console.log({
        rpc: this.environment.BLOCKCHAIN_RPC_URL,

        expectedChainId: this.environment.BLOCKCHAIN_CHAIN_ID,

        actualChainId: network.chainId.toString(),

        contractAddress,

        contractCode:
          contractCode === "0x"
            ? "NO CONTRACT"
            : `${contractCode.substring(0, 30)}...`,

        certificateCode,
      });

      console.log("================================");

      const result = await contract.getCertificate(certificateCode);

      console.log("[getCertificate result]", result);

      return {
        documentHash: result[0],
        issuedAt: result[1],
        issuer: result[2],
        exists: result[3],
        revoked: result[4],
      };
    } catch (error) {
      throw this.normalize(error, "read");
    }
  }

  // =========================================================
  // CHECK ISSUER AUTHORIZATION
  // =========================================================

  async isIssuerAuthorized(address: string) {
    if (!isAddress(address)) {
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    }

    try {
      await this.assertContractReady();

      const result = await this.readContract().authorizedIssuers(address);

      console.log("[isIssuerAuthorized]", {
        address,
        authorized: Boolean(result),
      });

      return Boolean(result);
    } catch (error) {
      throw this.normalize(error, "authorize");
    }
  }

  // =========================================================
  // SET ISSUER AUTHORIZATION
  // =========================================================

  async setIssuerAuthorization(address: string, authorized: boolean) {
    if (!isAddress(address)) {
      throw new AppError(
        "Institution issuer address is invalid",
        422,
        "INVALID_ISSUER_ADDRESS",
      );
    }

    try {
      await this.assertContractReady();

      console.log("========== SET ISSUER AUTHORIZATION ==========");

      console.log({
        address,
        authorized,
      });

      console.log("==============================================");

      const transaction = await (
        this.writeContract() as any
      ).setIssuerAuthorization(address, authorized);

      console.log("[setIssuerAuthorization tx]", {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
      });

      return transaction;
    } catch (error) {
      throw this.normalize(error, "authorize");
    }
  }

  // =========================================================
  // ISSUE CERTIFICATE
  // =========================================================

  async issueCertificate(
    certificateCode: string,
    documentHash: string,
    institutionCode?: string,
  ) {
    try {
      await this.assertContractReady();

      const privateKey = this.signingKey(institutionCode);

      const wallet = new Wallet(privateKey, this.provider);

      const network = await this.provider.getNetwork();

      const balance = await this.provider.getBalance(wallet.address);

      console.log("========== ISSUE CERTIFICATE ==========");

      console.log({
        certificateCode,

        documentHash,

        institutionCode,

        rpc: this.environment.BLOCKCHAIN_RPC_URL,

        chainId: network.chainId.toString(),

        contract: this.environment.CERTIFICATE_CONTRACT_ADDRESS,

        signer: wallet.address,

        signerBalanceWei: balance.toString(),
      });

      console.log("=======================================");

      const contract = this.writeContract(institutionCode);

      const transaction = await (contract as any).issueCertificate(
        certificateCode,
        documentHash,
      );

      console.log("[issueCertificate tx]", {
        hash: transaction.hash,

        from: transaction.from,

        to: transaction.to,

        nonce: transaction.nonce,
      });

      return transaction;
    } catch (error) {
      throw this.normalize(error, "issue");
    }
  }

  // =========================================================
  // REVOKE CERTIFICATE
  // =========================================================

  async revokeCertificate(certificateCode: string) {
    try {
      await this.assertContractReady();

      console.log("========== REVOKE CERTIFICATE ==========");

      console.log({
        certificateCode,
      });

      console.log("========================================");

      const transaction = await (this.writeContract() as any).revokeCertificate(
        certificateCode,
      );

      console.log("[revokeCertificate tx]", {
        certificateCode,

        hash: transaction.hash,

        from: transaction.from,

        to: transaction.to,
      });

      return transaction;
    } catch (error) {
      throw this.normalize(error, "revoke");
    }
  }

  // =========================================================
  // WAIT TRANSACTION
  // =========================================================

  async waitForTransaction(transaction: {
    hash?: string;

    wait: () => Promise<{
      status: number | null;

      blockNumber: number;
    } | null>;
  }) {
    try {
      console.log("[blockchain] waiting transaction:", transaction.hash);

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new AppError(
          "Không nhận được transaction receipt từ blockchain.",
          502,
          "BLOCKCHAIN_RECEIPT_NOT_FOUND",
        );
      }

      if (receipt.status !== 1) {
        throw new AppError(
          `Blockchain transaction reverted tại block ${receipt.blockNumber}.`,
          502,
          "BLOCKCHAIN_TRANSACTION_REVERTED",
        );
      }

      console.log("[blockchain transaction confirmed]", {
        hash: transaction.hash,

        blockNumber: receipt.blockNumber,

        status: receipt.status,
      });

      return receipt;
    } catch (error) {
      throw this.normalize(error, "transaction");
    }
  }

  // =========================================================
  // NORMALIZE ERROR
  // =========================================================

  private normalize(
    error: unknown,
    operation: BlockchainOperation = "unknown",
  ) {
    // AppError do chính hệ thống throw thì giữ nguyên
    if (error instanceof AppError) {
      return error;
    }

    const ethersError = error as EthersLikeError;

    const ethersCode = String(
      ethersError?.code ?? ethersError?.error?.code ?? "",
    ).toUpperCase();

    const message =
      ethersError?.shortMessage ||
      ethersError?.reason ||
      ethersError?.message ||
      ethersError?.error?.message ||
      "Blockchain operation failed";

    const lower = message.toLowerCase();

    console.error("========== BLOCKCHAIN ERROR ==========");

    console.error("Operation:", operation);

    console.error("Ethers code:", ethersCode);

    console.error("Message:", message);

    console.error("Action:", ethersError?.action);

    console.error("Data:", ethersError?.data);

    console.error("Transaction:", ethersError?.transaction);

    console.error("Info:", ethersError?.info);

    console.error("Raw error:", error);

    console.error("======================================");

    // =====================================================
    // CONTRACT / ABI MISMATCH
    // =====================================================

    if (
      ethersCode === "BAD_DATA" ||
      lower.includes("could not decode result data") ||
      lower.includes("invalid length for result data") ||
      lower.includes("insufficient data length")
    ) {
      return new AppError(
        "Không thể giải mã dữ liệu trả về từ Smart Contract. Có thể địa chỉ contract không đúng, ABI không khớp với contract đã deploy hoặc backend đang kết nối sai blockchain network.",
        502,
        "BLOCKCHAIN_CONTRACT_MISMATCH",
      );
    }

    // =====================================================
    // CALL EXCEPTION / REVERT
    // =====================================================

    if (
      ethersCode === "CALL_EXCEPTION" ||
      lower.includes("execution reverted") ||
      lower.includes("reverted")
    ) {
      const reason =
        ethersError?.reason ||
        ethersError?.shortMessage ||
        ethersError?.message;

      return new AppError(
        reason
          ? `Smart Contract từ chối giao dịch: ${reason}`
          : "Smart Contract từ chối giao dịch.",
        422,
        "BLOCKCHAIN_TRANSACTION_REVERTED",
      );
    }

    // =====================================================
    // INSUFFICIENT FUNDS
    // =====================================================

    if (
      ethersCode === "INSUFFICIENT_FUNDS" ||
      lower.includes("insufficient funds")
    ) {
      return new AppError(
        "Ví blockchain không đủ ETH để thanh toán gas.",
        502,
        "BLOCKCHAIN_INSUFFICIENT_FUNDS",
      );
    }

    // =====================================================
    // NONCE EXPIRED
    // =====================================================

    if (ethersCode === "NONCE_EXPIRED" || lower.includes("nonce too low")) {
      return new AppError(
        "Nonce của ví blockchain đã hết hạn hoặc thấp hơn nonce hiện tại.",
        409,
        "BLOCKCHAIN_NONCE_EXPIRED",
      );
    }

    // =====================================================
    // REPLACEMENT UNDERPRICED
    // =====================================================

    if (
      ethersCode === "REPLACEMENT_UNDERPRICED" ||
      lower.includes("replacement transaction underpriced")
    ) {
      return new AppError(
        "Giao dịch thay thế có gas fee quá thấp.",
        409,
        "BLOCKCHAIN_REPLACEMENT_UNDERPRICED",
      );
    }

    // =====================================================
    // NETWORK ERROR
    // =====================================================

    if (
      ethersCode === "NETWORK_ERROR" ||
      lower.includes("network error") ||
      lower.includes("failed to detect network") ||
      lower.includes("could not detect network")
    ) {
      return new AppError(
        "Không thể kết nối tới blockchain network.",
        503,
        "BLOCKCHAIN_NETWORK_ERROR",
      );
    }

    // =====================================================
    // RPC CONNECTION REFUSED
    // =====================================================

    if (
      lower.includes("econnrefused") ||
      lower.includes("connection refused") ||
      lower.includes("connect econnrefused") ||
      lower.includes("socket hang up")
    ) {
      return new AppError(
        `Không thể kết nối tới Blockchain RPC (${this.environment.BLOCKCHAIN_RPC_URL}). Hãy kiểm tra Ganache hoặc Hardhat node có đang chạy hay không.`,
        503,
        "BLOCKCHAIN_RPC_UNAVAILABLE",
      );
    }

    // =====================================================
    // TIMEOUT
    // =====================================================

    if (
      ethersCode === "TIMEOUT" ||
      lower.includes("timeout") ||
      lower.includes("timed out")
    ) {
      return new AppError(
        "Blockchain RPC phản hồi quá thời gian cho phép.",
        504,
        "BLOCKCHAIN_TIMEOUT",
      );
    }

    // =====================================================
    // INVALID ARGUMENT
    // =====================================================

    if (
      ethersCode === "INVALID_ARGUMENT" ||
      lower.includes("invalid argument")
    ) {
      return new AppError(
        `Tham số gửi tới blockchain không hợp lệ: ${message}`,
        422,
        "BLOCKCHAIN_INVALID_ARGUMENT",
      );
    }

    // =====================================================
    // ACTION REJECTED
    // =====================================================

    if (ethersCode === "ACTION_REJECTED") {
      return new AppError(
        "Giao dịch blockchain đã bị từ chối.",
        400,
        "BLOCKCHAIN_ACTION_REJECTED",
      );
    }

    // =====================================================
    // SERVER / RPC ERROR
    // =====================================================

    if (ethersCode === "SERVER_ERROR") {
      return new AppError(
        `Blockchain RPC trả về lỗi server: ${message}`,
        502,
        "BLOCKCHAIN_RPC_ERROR",
      );
    }

    // =====================================================
    // UNKNOWN ERROR
    // =====================================================

    const fallbackCode =
      operation === "issue"
        ? "BLOCKCHAIN_ISSUE_FAILED"
        : operation === "revoke"
        ? "BLOCKCHAIN_REVOKE_FAILED"
        : operation === "read"
        ? "BLOCKCHAIN_READ_FAILED"
        : operation === "authorize"
        ? "BLOCKCHAIN_AUTHORIZATION_FAILED"
        : operation === "transaction"
        ? "BLOCKCHAIN_TRANSACTION_FAILED"
        : "BLOCKCHAIN_OPERATION_FAILED";

    return new AppError(message, 502, fallbackCode);
  }
}
