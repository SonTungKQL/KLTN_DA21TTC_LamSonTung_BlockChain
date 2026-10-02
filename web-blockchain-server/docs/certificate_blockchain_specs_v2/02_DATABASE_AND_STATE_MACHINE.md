# 02 — DATABASE & STATE MACHINE

## Collections

### users

```ts
{
  email: string;
  passwordHash: string;
  fullName: string;
  role: "ADMIN" | "STUDENT";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}
```

### students

```ts
{
  userId?: ObjectId;
  studentCode: string;
  fullName: string;
  dateOfBirth?: Date;
  major: string;
  className?: string;
  course?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Index:
- `studentCode UNIQUE`

### institutions

```ts
{
  name: string;
  code: string;
  address?: string;
  blockchainIssuerAddress?: string;
}
```

### certificates

```ts
{
  certificateCode: string;
  studentId: ObjectId;
  institutionId: ObjectId;

  certificateName: string;
  degreeType?: string;
  major: string;
  classification?: string;
  issueDate: Date;

  documentUrl?: string;
  documentHash: string;

  transactionHash?: string;
  blockNumber?: number;

  blockchainStatus:
    | "NOT_SUBMITTED"
    | "SUBMITTED"
    | "CONFIRMED"
    | "FAILED";

  status:
    | "PENDING"
    | "ISSUED"
    | "BLOCKCHAIN_FAILED"
    | "REVOKED";

  blockchainError?: string;
  retryCount: number;

  issuedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;

  revokedAt?: Date;
  revokeReason?: string;

  createdBy: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:
- `certificateCode UNIQUE`
- `documentHash`
- `transactionHash sparse`
- `studentId`
- `status`

### blockchain_transactions

Mỗi lần issue/retry/revoke là một attempt riêng.

```ts
{
  certificateId: ObjectId;
  action: "ISSUE_CERTIFICATE" | "REVOKE_CERTIFICATE";

  transactionHash?: string;

  network: string;
  chainId: number;
  contractAddress: string;

  status:
    | "CREATED"
    | "SUBMITTED"
    | "CONFIRMED"
    | "FAILED";

  blockNumber?: number;

  errorCode?: string;
  errorMessage?: string;

  submittedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### verification_logs

```ts
{
  certificateId?: ObjectId;
  certificateCode?: string;
  method: "QR" | "CODE" | "HASH";
  result: "VALID" | "INVALID" | "REVOKED" | "NOT_FOUND";
  requestIp?: string;
  userAgent?: string;
  createdAt: Date;
}
```

## Certificate State Machine

```text
PENDING
  ├─ blockchain success → ISSUED
  └─ blockchain failed  → BLOCKCHAIN_FAILED

BLOCKCHAIN_FAILED
  ├─ retry success → ISSUED
  └─ retry failed  → BLOCKCHAIN_FAILED

ISSUED
  └─ revoke success → REVOKED
```

Không cho phép:
- `ISSUED → PENDING`
- `REVOKED → ISSUED`

## Blockchain Status

```text
NOT_SUBMITTED
→ SUBMITTED
→ CONFIRMED

hoặc

NOT_SUBMITTED / SUBMITTED
→ FAILED
```

## Rule quan trọng

Database record phải tồn tại ngay cả khi Blockchain thất bại.

Không rollback/delete Certificate khi Blockchain error.
