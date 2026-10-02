import { AppError } from "../../http/error";
import type { AppEnvironment } from "../../config/env";
import { StudentService } from "../students/student.service";
import { InstitutionService } from "../institutions/institution.service";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BlockchainTransactionService } from "../blockchain/blockchain-transaction.service";
import { CertificateHashService } from "./certificate-hash.service";
import { CertificateCodeService } from "./certificate-code.service";
import { CertificateRepository } from "./certificate.repository";
export class CertificateService {
  private readonly blockchain: BlockchainService;
  private readonly transactions: BlockchainTransactionService;
  constructor(
    private readonly environment: AppEnvironment,
    private readonly repository = new CertificateRepository(),
    private readonly students = new StudentService(),
    private readonly institutions = new InstitutionService(),
    private readonly hashes = new CertificateHashService(),
    private readonly codes = new CertificateCodeService(),
  ) {
    this.blockchain = new BlockchainService(environment);
    this.transactions = new BlockchainTransactionService(environment);
  }
  private hashFor(certificate: any) {
    const student = certificate.studentId;
    const institution = certificate.institutionId;
    if (!student?.studentCode || !institution?.code)
      throw new AppError(
        "Certificate relations are incomplete",
        500,
        "DATA_INTEGRITY_ERROR",
      );
    return this.hashes.create({
      certificateCode: certificate.certificateCode,
      studentCode: student.studentCode,
      studentName: student.fullName,
      certificateName: certificate.certificateName,
      major: certificate.major,
      issueDate: new Date(certificate.issueDate).toISOString().slice(0, 10),
      institutionCode: institution.code,
    });
  }
  async issue(
    input: {
      studentId: string;
      institutionId: string;
      certificateName: string;
      degreeType?: string;
      major: string;
      classification?: string;
      issueDate: string;
      documentUrl?: string;
    },
    createdBy: string,
  ) {
    const student = await this.students.getRequired(input.studentId);
    const institution = await this.institutions.getRequired(
      input.institutionId,
    );
    await this.blockchain.assertInstitutionSigner(
      institution.code,
      institution.blockchainIssuerAddress ?? undefined,
    );
    const certificateCode = await this.codes.create(
      institution.code,
      input.issueDate,
    );
    const documentHash = this.hashes.create({
      certificateCode,
      studentCode: student.studentCode,
      studentName: student.fullName,
      certificateName: input.certificateName,
      major: input.major,
      issueDate: input.issueDate,
      institutionCode: institution.code,
    });
    let certificate;
    try {
      certificate = await this.repository.create({
        ...input,
        certificateCode,
        issueDate: new Date(input.issueDate),
        documentHash,
        createdBy,
        status: "PENDING",
        blockchainStatus: "NOT_SUBMITTED",
        retryCount: 0,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      )
        throw new AppError(
          "Certificate code already exists",
          409,
          "CERTIFICATE_CODE_EXISTS",
        );
      throw error;
    }
    return this.submitIssue(
      certificate._id.toString(),
      false,
      institution.code,
    );
  }
  private async submitIssue(
    certificateId: string,
    retry = false,
    institutionCode?: string,
  ) {
    const raw = await this.repository.findRawById(certificateId);
    if (!raw)
      throw new AppError("Certificate not found", 404, "CERTIFICATE_NOT_FOUND");
    const institution = institutionCode
      ? undefined
      : await this.institutions.getRequired(raw.institutionId.toString());
    const issuerCode = institutionCode ?? institution!.code;
    const attempt = await this.transactions.create(
      certificateId,
      "ISSUE_CERTIFICATE",
    );
    try {
      const tx = await this.blockchain.issueCertificate(
        raw.certificateCode,
        raw.documentHash,
        issuerCode,
      );
      await this.transactions.submitted(attempt._id.toString(), tx.hash);
      await this.repository.update(certificateId, {
        transactionHash: tx.hash,
        blockchainStatus: "SUBMITTED",
      });
      const receipt = await this.blockchain.waitForTransaction(tx);
      await this.transactions.confirmed(
        attempt._id.toString(),
        receipt.blockNumber,
      );
      return this.repository.update(certificateId, {
        status: "ISSUED",
        blockchainStatus: "CONFIRMED",
        blockNumber: receipt.blockNumber,
        issuedAt: new Date(),
        confirmedAt: new Date(),
        blockchainError: undefined,
        ...(retry ? { retryCount: raw.retryCount + 1 } : {}),
      });
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError(
              "Blockchain issue failed",
              502,
              "BLOCKCHAIN_ISSUE_FAILED",
            );
      await this.transactions.failed(attempt._id.toString(), {
        code: appError.code,
        message: appError.message,
      });
      return this.repository.update(certificateId, {
        status: "BLOCKCHAIN_FAILED",
        blockchainStatus: "FAILED",
        blockchainError: appError.message,
        failedAt: new Date(),
        ...(retry ? { retryCount: raw.retryCount + 1 } : {}),
      });
    }
  }
  async getRequired(id: string) {
    const item = await this.repository.findById(id);
    if (!item)
      throw new AppError("Certificate not found", 404, "CERTIFICATE_NOT_FOUND");
    return item;
  }
  verificationQr(certificate: any) {
    if (certificate.status !== "ISSUED" && certificate.status !== "REVOKED")
      throw new AppError(
        "QR verification is available only after the certificate is issued",
        409,
        "QR_NOT_AVAILABLE",
      );
    const clientUrl = this.environment.CLIENT_URL.endsWith("/")
      ? this.environment.CLIENT_URL
      : `${this.environment.CLIENT_URL}/`;
    const verificationUrl = new URL(
      `verify/${encodeURIComponent(certificate.certificateCode)}?source=qr`,
      clientUrl,
    ).toString();
    return {
      certificateCode: certificate.certificateCode,
      verificationUrl,
      verificationMethod: "QR" as const,
      status: certificate.status,
    };
  }
  async findByCode(code: string) {
    return this.repository.findByCode(code);
  }
  async findByVerificationIdentifier(identifier: string) {
    return (
      (await this.repository.findByCode(identifier)) ??
      this.repository.findByBlockchainIdentifier(identifier)
    );
  }
  async list(query: {
    keyword?: string;
    status?: string;
    blockchainStatus?: string;
    studentId?: string;
    page: number;
    limit: number;
  }) {
    const filter: Record<string, unknown> = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.blockchainStatus
        ? { blockchainStatus: query.blockchainStatus }
        : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
    };
    if (query.keyword)
      filter.$or = [
        { certificateCode: new RegExp(query.keyword, "i") },
        { certificateName: new RegExp(query.keyword, "i") },
      ];
    const total = await this.repository.count(filter);
    return {
      items: await this.repository.list(
        filter,
        (query.page - 1) * query.limit,
        query.limit,
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async retry(id: string) {
    let certificateCode: string | undefined;
    try {
      const certificate = await this.getRequired(id);
      certificateCode = certificate.certificateCode;
      if (certificate.status !== "BLOCKCHAIN_FAILED")
        throw new AppError(
          "Only failed certificates can be retried",
          409,
          "INVALID_CERTIFICATE_STATE",
        );
      const onChain = await this.blockchain.getCertificate(
        certificate.certificateCode,
      );
      if (onChain.exists) {
        if (
          onChain.documentHash.toLowerCase() !==
          certificate.documentHash.toLowerCase()
        )
          throw new AppError(
            "On-chain certificate hash conflicts with database",
            409,
            "BLOCKCHAIN_HASH_CONFLICT",
          );
        return this.repository.update(id, {
          status: "ISSUED",
          blockchainStatus: "CONFIRMED",
          confirmedAt: new Date(),
          issuedAt: new Date(),
          blockchainError: undefined,
        });
      }
      const populatedInstitution = certificate.institutionId as any;
      const institutionId =
        populatedInstitution?._id?.toString() ??
        populatedInstitution.toString();
      const institution = await this.institutions.getRequired(institutionId);
      await this.blockchain.assertInstitutionSigner(
        institution.code,
        institution.blockchainIssuerAddress ?? undefined,
      );
      return this.submitIssue(id, true, institution.code);
    } catch (error) {
      const errorDetails =
        error instanceof AppError
          ? { code: error.code, message: error.message, stack: error.stack }
          : error;
      console.error("[certificate.retry] Retry blockchain failed", {
        certificateId: id,
        certificateCode,
        error: errorDetails,
      });
      throw error;
    }
  }
  async revoke(id: string, reason: string) {
    const certificate = await this.getRequired(id);
    if (certificate.status !== "ISSUED")
      throw new AppError(
        "Only issued certificates can be revoked",
        409,
        "INVALID_CERTIFICATE_STATE",
      );
    const onChain = await this.blockchain.getCertificate(
      certificate.certificateCode,
    );
    if (onChain.revoked)
      return this.repository.update(id, {
        status: "REVOKED",
        revokedAt: new Date(),
        revokeReason: reason,
        revocationConfirmedAt: new Date(),
      });
    const attempt = await this.transactions.create(id, "REVOKE_CERTIFICATE");
    try {
      const tx = await this.blockchain.revokeCertificate(
        certificate.certificateCode,
      );
      await this.transactions.submitted(attempt._id.toString(), tx.hash);
      await this.repository.update(id, { revocationTransactionHash: tx.hash });
      const receipt = await this.blockchain.waitForTransaction(tx);
      await this.transactions.confirmed(
        attempt._id.toString(),
        receipt.blockNumber,
      );
      return this.repository.update(id, {
        status: "REVOKED",
        revokedAt: new Date(),
        revokeReason: reason,
        revocationTransactionHash: tx.hash,
        revocationBlockNumber: receipt.blockNumber,
        revocationConfirmedAt: new Date(),
      });
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError(
              "Blockchain revoke failed",
              502,
              "BLOCKCHAIN_ISSUE_FAILED",
            );
      await this.transactions.failed(attempt._id.toString(), {
        code: appError.code,
        message: appError.message,
      });
      throw appError;
    }
  }
  rebuildHash(certificate: any) {
    return this.hashFor(certificate);
  }
}
