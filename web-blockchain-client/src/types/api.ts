export type Role = "ADMIN" | "STUDENT";
export type CertificateStatus = "PENDING" | "ISSUED" | "BLOCKCHAIN_FAILED" | "REVOKED";
export type BlockchainStatus = "NOT_SUBMITTED" | "SUBMITTED" | "CONFIRMED" | "FAILED";
export interface ApiResponse<T> { success: true; data: T; }
export interface PageResult<T> { items: T[]; meta: { page: number; limit: number; total: number; totalPages: number; }; }
export interface Student { _id: string; studentCode: string; fullName: string; institutionId?: string; majorId?: string; courseId?: string; classId?: string; major: string; className?: string; course?: string; dateOfBirth?: string; }
export interface Institution { _id: string; name: string; code: string; address?: string; blockchainIssuerAddress?: string; issuerAuthorizedAt?: string; issuerAuthorizationTransactionHash?: string; }
export interface Major { _id: string; institutionId: string; code: string; name: string; }
export interface Course { _id: string; institutionId: string; code: string; name: string; startYear?: number; }
export interface TrainingClass { _id: string; institutionId: string; majorId: string; courseId: string; code: string; name: string; }
export interface Consultation { _id: string; fullName: string; email: string; phone: string; organization: string; interest?: string; message?: string; status: "NEW" | "CONTACTED" | "CLOSED"; createdAt: string; userId?: { fullName: string; email: string; role: Role }; }
export interface Certificate { _id: string; certificateCode: string; certificateName: string; degreeType?: string; major: string; classification?: string; issueDate: string; documentHash: string; transactionHash?: string; blockNumber?: number; revocationTransactionHash?: string; revocationBlockNumber?: number; revocationConfirmedAt?: string; blockchainStatus: BlockchainStatus; status: CertificateStatus; blockchainError?: string; retryCount: number; revokedAt?: string; revokeReason?: string; studentId: Student; institutionId: Institution; createdAt: string; }
export interface CertificateVerificationQr { certificateCode: string; verificationUrl: string; verificationMethod: "QR"; status: "ISSUED" | "REVOKED"; }
export interface Transaction { _id: string; certificateId: string; action: "ISSUE_CERTIFICATE" | "REVOKE_CERTIFICATE"; transactionHash?: string; network: string; chainId: number; status: "CREATED" | "SUBMITTED" | "CONFIRMED" | "FAILED"; blockNumber?: number; errorMessage?: string; createdAt: string; }
export interface StatisticCount { key: string; count: number; }
export interface StatisticsOverview { summary: { students: number; institutions: number; majors: number; courses: number; classes: number; certificates: number; }; certificateStatus: StatisticCount[]; blockchainStatus: StatisticCount[]; consultationStatus: StatisticCount[]; transactionStatus: StatisticCount[]; issueTrend: { month: string; total: number; issued: number; revoked: number; }[]; byInstitution: { name: string; count: number; }[]; byMajor: { name: string; count: number; }[]; recentTransactions: Pick<Transaction, "_id" | "action" | "transactionHash" | "status" | "blockNumber" | "createdAt">[]; }
