# 04 — BACKEND CERTIFICATE ISSUE FLOW

## API

```http
POST /api/admin/certificates
```

Role:
`ADMIN`

## Request

```json
{
  "studentId": "...",
  "certificateName": "Kỹ sư Công nghệ thông tin",
  "major": "Công nghệ thông tin",
  "classification": "Khá",
  "issueDate": "2026-09-15",
  "institutionId": "..."
}
```

## Flow

```text
Admin submit
↓
Authenticate + authorize
↓
Validate DTO
↓
Check student
↓
Check institution
↓
Generate certificateCode automatically:
`{INSTITUTION_CODE}-{ISSUE_YEAR}-{SEQUENCE}`
↓
Create Certificate
status=PENDING
blockchainStatus=NOT_SUBMITTED
↓
Generate deterministic hash
↓
Save documentHash
↓
Create blockchain_transactions attempt
status=CREATED
↓
call issueCertificate()
↓
nhận tx.hash
↓
save tx.hash ngay
Certificate.blockchainStatus=SUBMITTED
Transaction.status=SUBMITTED
↓
await tx.wait()
↓
SUCCESS / FAILED
```

## SUCCESS

Chỉ thành công khi receipt xác nhận.

```ts
receipt.status === 1
```

Update Certificate:

```text
status=ISSUED
blockchainStatus=CONFIRMED
transactionHash
blockNumber
issuedAt
confirmedAt
blockchainError=null
```

Update BlockchainTransaction:

```text
status=CONFIRMED
blockNumber
confirmedAt
```

## FAILED

Không delete DB.

Update Certificate:

```text
status=BLOCKCHAIN_FAILED
blockchainStatus=FAILED
blockchainError
failedAt
```

Update BlockchainTransaction:

```text
status=FAILED
errorCode
errorMessage
failedAt
```

## Hash Service

Tạo `CertificateHashService`.

Canonical payload:

```ts
{
  certificateCode,
  studentCode,
  studentName,
  certificateName,
  major,
  issueDate,
  institutionCode
}
```

Rules:
- trim string
- issueDate = YYYY-MM-DD
- serialize deterministic
- keccak256

Không hash raw Mongoose document.

## BlockchainService

Tách riêng:

```ts
issueCertificate()
getCertificate()
verifyCertificate()
revokeCertificate()
waitForTransaction()
```

Không viết Ethers trực tiếp trong controller.

## Error normalization

Map lỗi về code ứng dụng:

```text
BLOCKCHAIN_NETWORK_ERROR
BLOCKCHAIN_TIMEOUT
BLOCKCHAIN_TRANSACTION_REVERTED
BLOCKCHAIN_INSUFFICIENT_FUNDS
BLOCKCHAIN_ISSUE_FAILED
```

Không expose private key.

## Env

```env
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_PRIVATE_KEY=
BLOCKCHAIN_CHAIN_ID=
CERTIFICATE_CONTRACT_ADDRESS=
CLIENT_URL=
```
