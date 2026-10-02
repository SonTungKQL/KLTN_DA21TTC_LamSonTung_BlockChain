# ĐẶC TẢ LUỒNG CẤP VĂN BẰNG + BLOCKCHAIN

## 1. Mục tiêu

Tài liệu này mô tả đầy đủ luồng **cấp văn bằng điện tử**, trong đó dữ liệu nghiệp vụ được lưu trong Database và mã hash của văn bằng được ghi lên Blockchain thông qua Smart Contract.

Thiết kế ưu tiên:

- Không rollback bản ghi Database nếu Blockchain thất bại.
- Database tạo trước với trạng thái `PENDING`.
- Blockchain thành công thì chuyển sang `ISSUED`.
- Blockchain thất bại thì chuyển sang `BLOCKCHAIN_FAILED`.
- Cho phép retry giao dịch Blockchain an toàn.
- Chống cấp trùng văn bằng và chống ghi Blockchain trùng.
- Lưu đầy đủ `transactionHash`, `blockNumber`, lỗi Blockchain và thời điểm xử lý để phục vụ kiểm tra, debug và báo cáo khóa luận.

---

# 2. Luồng tổng quát

```text
User/Admin bấm "Cấp văn bằng"
        ↓
Frontend gửi request
        ↓
Backend xác thực + phân quyền
        ↓
Backend validate dữ liệu
        ↓
Kiểm tra văn bằng đã tồn tại hay chưa
        ↓
DB create Certificate
status = PENDING
        ↓
Chuẩn hóa dữ liệu dùng để hash
        ↓
Tạo documentHash
        ↓
Gọi Smart Contract
        ↓
Nhận transactionHash
        ↓
DB lưu transactionHash
        ↓
Chờ transaction receipt
        ↓
   ┌───────────────────────┐
   │                       │
 SUCCESS                  FAILED
   │                       │
   ↓                       ↓
DB update              DB update
ISSUED                 BLOCKCHAIN_FAILED
   │                       │
   ↓                       ↓
Lưu blockNumber        Lưu blockchainError
issuedAt               failureReason
confirmedAt            failedAt
```

---

# 3. Nguyên tắc thiết kế

## 3.1. Database là nơi quản lý trạng thái nghiệp vụ

Blockchain không thay thế Database.

Database lưu:

- thông tin sinh viên;
- thông tin văn bằng;
- trạng thái xử lý;
- mã hash;
- transaction hash;
- block number;
- lỗi giao dịch;
- lịch sử retry.

Blockchain chỉ lưu dữ liệu cần đảm bảo tính toàn vẹn, ví dụ:

```text
certificateCode
documentHash
issuedAt
issuer
revoked
```

---

## 3.2. Không rollback Certificate khi Blockchain thất bại

Không nên làm:

```text
Create DB
→ gọi Blockchain
→ Blockchain fail
→ delete Certificate
```

Thay vào đó:

```text
Create Certificate = PENDING
→ Blockchain fail
→ Certificate = BLOCKCHAIN_FAILED
```

Lý do:

1. Blockchain và Database không nằm trong cùng một ACID transaction.
2. Không thể rollback một transaction Blockchain đã broadcast giống rollback SQL.
3. Nếu xóa record DB khi Blockchain lỗi sẽ mất dấu vết xử lý.
4. Cần giữ record để admin biết văn bằng nào cần retry.
5. Dễ audit, logging và trình bày trong khóa luận.

---

# 4. State Machine của Certificate

## 4.1. Các trạng thái

```text
PENDING
ISSUED
BLOCKCHAIN_FAILED
REVOKED
```

Có thể mở rộng:

```text
DRAFT
PENDING
BLOCKCHAIN_PROCESSING
ISSUED
BLOCKCHAIN_FAILED
REVOKE_PENDING
REVOKED
REVOKE_FAILED
```

Đối với KLTN sinh viên, phiên bản gọn nên sử dụng:

```text
PENDING
ISSUED
BLOCKCHAIN_FAILED
REVOKED
```

---

## 4.2. State transition

```text
             +-----------------------+
             |                       |
             v                       |
        PENDING                      |
          |                          |
          | Blockchain success       |
          v                          |
        ISSUED --------------------> REVOKED
          ^
          |
          | Retry success
          |
 BLOCKCHAIN_FAILED
          ^
          |
          | Blockchain failed
          |
        PENDING
```

Các transition hợp lệ:

| From | Event | To |
|---|---|---|
| `PENDING` | Blockchain success | `ISSUED` |
| `PENDING` | Blockchain failed | `BLOCKCHAIN_FAILED` |
| `BLOCKCHAIN_FAILED` | Retry success | `ISSUED` |
| `BLOCKCHAIN_FAILED` | Retry failed | `BLOCKCHAIN_FAILED` |
| `ISSUED` | Revoke success | `REVOKED` |

Không cho phép:

```text
ISSUED → PENDING
REVOKED → ISSUED
```

trừ khi nghiệp vụ có quy định riêng.

---

# 5. Collection đề xuất

## 5.1. `users`

```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  fullName: string,
  role: "ADMIN" | "STUDENT",
  status: "ACTIVE" | "INACTIVE",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.2. `students`

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  studentCode: string,
  fullName: string,
  dateOfBirth?: Date,
  major: string,
  course?: string,
  className?: string,
  createdAt: Date,
  updatedAt: Date
}
```

Unique:

```text
studentCode
```

---

## 5.3. `institutions`

```ts
{
  _id: ObjectId,
  name: string,
  code: string,
  address?: string,
  blockchainIssuerAddress?: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.4. `certificates`

Đây là collection quan trọng nhất.

```ts
{
  _id: ObjectId,

  certificateCode: string,
  studentId: ObjectId,
  institutionId: ObjectId,

  certificateName: string,
  degreeType?: string,
  major: string,
  classification?: string,

  issueDate: Date,

  documentUrl?: string,

  // Blockchain verification
  documentHash: string,

  transactionHash?: string,
  blockNumber?: number,

  blockchainStatus:
    | "NOT_SUBMITTED"
    | "SUBMITTED"
    | "CONFIRMED"
    | "FAILED",

  status:
    | "PENDING"
    | "ISSUED"
    | "BLOCKCHAIN_FAILED"
    | "REVOKED",

  blockchainError?: string,

  retryCount: number,

  issuedAt?: Date,
  confirmedAt?: Date,
  failedAt?: Date,

  revokedAt?: Date,
  revokeReason?: string,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```text
certificateCode UNIQUE
documentHash INDEX
transactionHash SPARSE INDEX
studentId INDEX
status INDEX
```

---

## 5.5. `blockchain_transactions`

Nên có nếu muốn làm project rõ ràng và dễ audit.

```ts
{
  _id: ObjectId,

  certificateId: ObjectId,

  action:
    | "ISSUE_CERTIFICATE"
    | "REVOKE_CERTIFICATE",

  transactionHash?: string,

  network: string,
  chainId: number,

  contractAddress: string,

  status:
    | "CREATED"
    | "SUBMITTED"
    | "CONFIRMED"
    | "FAILED",

  blockNumber?: number,

  errorCode?: string,
  errorMessage?: string,

  submittedAt?: Date,
  confirmedAt?: Date,
  failedAt?: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.6. `verification_logs`

```ts
{
  _id: ObjectId,

  certificateId?: ObjectId,
  certificateCode?: string,

  method: "QR" | "CODE" | "HASH",

  result:
    | "VALID"
    | "INVALID"
    | "REVOKED"
    | "NOT_FOUND",

  requestIp?: string,
  userAgent?: string,

  createdAt: Date
}
```

---

# 6. Dữ liệu dùng để hash

Không nên hash trực tiếp một object JavaScript tùy ý vì thứ tự key có thể thay đổi.

Phải tạo payload chuẩn.

Ví dụ:

```ts
type CertificateHashPayload = {
  certificateCode: string;
  studentCode: string;
  studentName: string;
  certificateName: string;
  major: string;
  issueDate: string;
  institutionCode: string;
};
```

Chuẩn hóa:

```ts
const payload = {
  certificateCode: certificate.certificateCode.trim(),
  studentCode: student.studentCode.trim(),
  studentName: student.fullName.trim(),
  certificateName: certificate.certificateName.trim(),
  major: certificate.major.trim(),
  issueDate: dayjs(certificate.issueDate).format("YYYY-MM-DD"),
  institutionCode: institution.code.trim(),
};
```

Sau đó serialize theo format cố định:

```ts
const canonicalString = JSON.stringify(payload);
```

Hash:

```ts
SHA256(canonicalString)
```

hoặc:

```ts
keccak256(toUtf8Bytes(canonicalString))
```

Với Ethereum/Solidity có thể ưu tiên `Keccak-256`.

---

# 7. Smart Contract

## 7.1. Struct

```solidity
struct Certificate {
    bytes32 documentHash;
    uint256 issuedAt;
    address issuer;
    bool exists;
    bool revoked;
}
```

---

## 7.2. Mapping

```solidity
mapping(string => Certificate) private certificates;
```

Key:

```text
certificateCode
```

---

## 7.3. `issueCertificate`

```solidity
function issueCertificate(
    string calldata certificateCode,
    bytes32 documentHash
) external onlyIssuer {
    require(
        !certificates[certificateCode].exists,
        "CERTIFICATE_ALREADY_EXISTS"
    );

    certificates[certificateCode] = Certificate({
        documentHash: documentHash,
        issuedAt: block.timestamp,
        issuer: msg.sender,
        exists: true,
        revoked: false
    });

    emit CertificateIssued(
        certificateCode,
        documentHash,
        msg.sender,
        block.timestamp
    );
}
```

---

## 7.4. Verify

```solidity
function verifyCertificate(
    string calldata certificateCode,
    bytes32 documentHash
) external view returns (bool) {
    Certificate memory cert = certificates[certificateCode];

    return
        cert.exists &&
        !cert.revoked &&
        cert.documentHash == documentHash;
}
```

---

## 7.5. Revoke

```solidity
function revokeCertificate(
    string calldata certificateCode
) external onlyIssuer {
    require(
        certificates[certificateCode].exists,
        "CERTIFICATE_NOT_FOUND"
    );

    require(
        !certificates[certificateCode].revoked,
        "CERTIFICATE_ALREADY_REVOKED"
    );

    certificates[certificateCode].revoked = true;

    emit CertificateRevoked(
        certificateCode,
        msg.sender,
        block.timestamp
    );
}
```

---

# 8. API cấp văn bằng

```http
POST /api/admin/certificates
```

Authorization:

```text
ADMIN
```

Request:

```json
{
  "studentId": "student-id",
  "certificateCode": "TVU-2026-000001",
  "certificateName": "Kỹ sư Công nghệ thông tin",
  "major": "Công nghệ thông tin",
  "classification": "Khá",
  "issueDate": "2026-09-15"
}
```

---

# 9. Backend Flow chi tiết

## Step 1 - Authentication

Backend kiểm tra:

```text
Access Token
Role = ADMIN
Account status = ACTIVE
```

Nếu không hợp lệ:

```http
401 Unauthorized
403 Forbidden
```

---

## Step 2 - Validate request

Kiểm tra:

```text
studentId exists
certificateCode not empty
certificateName not empty
major not empty
issueDate valid
```

---

## Step 3 - Kiểm tra duplicate

```ts
const existing = await certificateRepository.findByCertificateCode(
  dto.certificateCode
);

if (existing) {
  throw new ConflictException("CERTIFICATE_CODE_ALREADY_EXISTS");
}
```

---

# 10. Tạo Certificate PENDING

```ts
const certificate = await certificateRepository.create({
  ...dto,

  status: "PENDING",

  blockchainStatus: "NOT_SUBMITTED",

  retryCount: 0,

  createdBy: currentUser.id
});
```

Tại thời điểm này Certificate đã tồn tại trong Database.

---

# 11. Tạo hash

Backend lấy:

```text
Certificate
Student
Institution
```

Sau đó build canonical payload.

```ts
const documentHash =
  certificateHashService.generate({
    certificateCode,
    studentCode,
    studentName,
    certificateName,
    major,
    issueDate,
    institutionCode
  });
```

Update:

```ts
certificate.documentHash = documentHash;
```

---

# 12. Tạo Blockchain Transaction record

```ts
const blockchainTransaction =
  await blockchainTransactionRepository.create({
    certificateId: certificate.id,

    action: "ISSUE_CERTIFICATE",

    network: blockchainConfig.network,

    chainId: blockchainConfig.chainId,

    contractAddress:
      blockchainConfig.certificateContractAddress,

    status: "CREATED"
  });
```

---

# 13. Gọi Smart Contract

Ví dụ Ethers.js:

```ts
const tx = await certificateContract.issueCertificate(
  certificate.certificateCode,
  certificate.documentHash
);
```

Ngay khi nhận được `tx.hash`, phải lưu vào Database.

```ts
await certificateRepository.update(certificate.id, {
  transactionHash: tx.hash,
  blockchainStatus: "SUBMITTED"
});
```

Đồng thời:

```ts
await blockchainTransactionRepository.update(
  blockchainTransaction.id,
  {
    transactionHash: tx.hash,
    status: "SUBMITTED",
    submittedAt: new Date()
  }
);
```

---

# 14. Chờ Transaction Receipt

```ts
const receipt = await tx.wait();
```

Không được coi việc nhận `transactionHash` là thành công cuối cùng.

```text
tx.hash
```

chỉ chứng minh transaction đã được gửi/broadcast.

Phải chờ:

```text
receipt
```

---

# 15. SUCCESS Flow

Điều kiện:

```ts
receipt.status === 1
```

Update Certificate:

```ts
await certificateRepository.update(certificate.id, {
  status: "ISSUED",

  blockchainStatus: "CONFIRMED",

  blockNumber: receipt.blockNumber,

  confirmedAt: new Date(),

  issuedAt: new Date(),

  blockchainError: null
});
```

Update blockchain transaction:

```ts
await blockchainTransactionRepository.update(
  blockchainTransaction.id,
  {
    status: "CONFIRMED",

    blockNumber: receipt.blockNumber,

    confirmedAt: new Date()
  }
);
```

Response:

```json
{
  "success": true,
  "data": {
    "certificateId": "...",
    "certificateCode": "TVU-2026-000001",
    "status": "ISSUED",
    "documentHash": "0x...",
    "transactionHash": "0x...",
    "blockNumber": 123
  }
}
```

---

# 16. FAILED Flow

Các lỗi có thể xảy ra:

```text
RPC unavailable
Wallet insufficient funds
Contract reverted
Transaction rejected
Gas estimation error
Transaction timeout
Provider disconnected
Incorrect contract address
Incorrect network
Duplicate certificate on-chain
```

Catch:

```ts
catch (error) {
}
```

Không delete Certificate.

Update:

```ts
await certificateRepository.update(certificate.id, {
  status: "BLOCKCHAIN_FAILED",

  blockchainStatus: "FAILED",

  blockchainError: normalizeBlockchainError(error),

  failedAt: new Date()
});
```

Update transaction:

```ts
await blockchainTransactionRepository.update(
  blockchainTransaction.id,
  {
    status: "FAILED",

    errorCode: getBlockchainErrorCode(error),

    errorMessage: normalizeBlockchainError(error),

    failedAt: new Date()
  }
);
```

Response phù hợp:

```http
202 Accepted
```

hoặc:

```http
200 OK
```

Ví dụ:

```json
{
  "success": true,
  "data": {
    "certificateId": "...",
    "certificateCode": "TVU-2026-000001",
    "status": "BLOCKCHAIN_FAILED"
  },
  "message":
    "Certificate was saved but blockchain issuance failed. Retry is available."
}
```

Không nên trả:

```http
500
```

nếu bản ghi nghiệp vụ đã được tạo thành công và hệ thống chủ động lưu trạng thái lỗi.

---

# 17. Retry Blockchain

Endpoint:

```http
POST /api/admin/certificates/:id/retry-blockchain
```

Chỉ cho retry khi:

```text
status = BLOCKCHAIN_FAILED
```

Không retry khi:

```text
ISSUED
REVOKED
```

---

## Retry Flow

```text
Admin bấm Retry
      ↓
Backend load Certificate
      ↓
status phải = BLOCKCHAIN_FAILED
      ↓
Kiểm tra on-chain trước
      ↓
Nếu đã tồn tại đúng hash
      ↓
Sync DB → ISSUED

Nếu chưa tồn tại
      ↓
Gọi issueCertificate()
      ↓
Lưu transactionHash mới
      ↓
wait receipt
   ┌───────────────┐
 SUCCESS          FAILED
   ↓               ↓
ISSUED      BLOCKCHAIN_FAILED
```

---

# 18. Idempotency

Đây là phần rất quan trọng.

Giả sử:

```text
Blockchain transaction thành công
        ↓
Backend bị crash
        ↓
DB chưa kịp update ISSUED
```

Database có thể đang:

```text
BLOCKCHAIN_FAILED
```

hoặc:

```text
PENDING
```

nhưng Blockchain thực tế đã có Certificate.

Nếu retry ngay:

```text
issueCertificate()
```

Smart Contract sẽ revert:

```text
CERTIFICATE_ALREADY_EXISTS
```

Do đó trước mỗi retry phải kiểm tra Blockchain.

Pseudo:

```ts
const onChainCertificate =
  await blockchainService.getCertificate(
    certificate.certificateCode
  );

if (
  onChainCertificate.exists &&
  onChainCertificate.documentHash ===
    certificate.documentHash
) {
  await certificateRepository.update(
    certificate.id,
    {
      status: "ISSUED",
      blockchainStatus: "CONFIRMED"
    }
  );

  return certificate;
}
```

Chỉ gọi issue khi:

```text
certificate chưa tồn tại on-chain
```

---

# 19. API lấy trạng thái

```http
GET /api/admin/certificates/:id
```

Response:

```json
{
  "id": "...",
  "certificateCode": "TVU-2026-000001",
  "status": "BLOCKCHAIN_FAILED",

  "blockchain": {
    "status": "FAILED",
    "transactionHash": "0x...",
    "blockNumber": null,
    "error": "RPC unavailable",
    "retryCount": 1
  }
}
```

Frontend dựa vào status để hiển thị.

---

# 20. UI Admin

## `PENDING`

Hiển thị:

```text
Đang xử lý Blockchain...
```

Button:

```text
disabled
```

---

## `ISSUED`

Badge:

```text
Đã cấp
```

Hiển thị:

```text
Document Hash
Transaction Hash
Block Number
QR Code
```

---

## `BLOCKCHAIN_FAILED`

Badge:

```text
Blockchain lỗi
```

Hiển thị error.

Button:

```text
Thử lại
```

---

## `REVOKED`

Badge:

```text
Đã thu hồi
```

Không cho retry Issue.

---

# 21. QR Code

QR không cần chứa toàn bộ dữ liệu văn bằng.

Nên chứa URL:

```text
https://domain.com/verify/{certificateCode}
```

Ví dụ:

```text
https://certificate.example.com/verify/TVU-2026-000001
```

---

# 22. Verify Flow

```text
Nhà tuyển dụng scan QR
        ↓
/verify/:certificateCode
        ↓
Backend lấy Certificate DB
        ↓
Không tồn tại?
        ↓
INVALID

Nếu tồn tại
        ↓
Lấy dữ liệu cần hash
        ↓
Hash lại
        ↓
Query Smart Contract
        ↓
Compare:
DB hash
Local generated hash
Blockchain hash
        ↓
Kiểm tra revoked
        ↓
VALID / INVALID / REVOKED
```

---

# 23. Điều kiện VALID

Chỉ trả:

```text
VALID
```

khi:

```text
Certificate DB exists
AND
status = ISSUED
AND
localHash == DB.documentHash
AND
DB.documentHash == blockchain.documentHash
AND
blockchain.exists == true
AND
blockchain.revoked == false
```

---

# 24. Verify API

```http
GET /api/public/certificates/verify/:certificateCode
```

Response:

```json
{
  "valid": true,

  "status": "VALID",

  "certificate": {
    "certificateCode": "TVU-2026-000001",
    "studentName": "Nguyễn Văn A",
    "certificateName": "Kỹ sư Công nghệ thông tin",
    "major": "Công nghệ thông tin",
    "issueDate": "2026-09-15",
    "institution": "Trường Đại học ..."
  },

  "blockchain": {
    "verified": true,
    "documentHash": "0x...",
    "transactionHash": "0x..."
  }
}
```

---

# 25. Revoke Flow

```text
Admin bấm "Thu hồi văn bằng"
          ↓
Nhập lý do
          ↓
Backend validate
          ↓
Certificate status phải = ISSUED
          ↓
Smart Contract revokeCertificate()
          ↓
transactionHash
          ↓
wait receipt
   ┌───────────────┐
 SUCCESS          FAILED
   ↓               ↓
REVOKED       Giữ ISSUED
              + lưu revoke error
```

Nếu muốn chuẩn hơn có thể thêm:

```text
REVOKE_PENDING
REVOKE_FAILED
```

nhưng không bắt buộc đối với KLTN.

---

# 26. Service Architecture

Đề xuất:

```text
src/
├── auth/
├── users/
├── students/
├── institutions/
├── certificates/
│   ├── certificate.controller
│   ├── certificate.service
│   ├── certificate.repository
│   ├── certificate.schema
│   ├── dto/
│   └── enums/
│
├── blockchain/
│   ├── blockchain.module
│   ├── blockchain.service
│   ├── blockchain.config
│   ├── blockchain-error.util
│   └── abi/
│
├── verification/
│   ├── verification.controller
│   └── verification.service
│
└── common/
```

---

# 27. CertificateService

Các method chính:

```ts
createCertificate()

issueCertificateOnBlockchain()

retryBlockchainIssue()

getCertificate()

listCertificates()

verifyCertificate()

revokeCertificate()
```

---

# 28. BlockchainService

Không để logic Ethers nằm trực tiếp trong Controller.

```ts
class BlockchainService {
  issueCertificate(
    certificateCode: string,
    documentHash: string
  )

  getCertificate(
    certificateCode: string
  )

  verifyCertificate(
    certificateCode: string,
    documentHash: string
  )

  revokeCertificate(
    certificateCode: string
  )

  waitForTransaction(
    transactionHash: string
  )
}
```

---

# 29. Error handling

Tạo error normalization.

```ts
type BlockchainErrorInfo = {
  code: string;
  message: string;
  originalMessage?: string;
};
```

Ví dụ mapping:

```text
CALL_EXCEPTION
→ CONTRACT_REVERTED

INSUFFICIENT_FUNDS
→ WALLET_INSUFFICIENT_FUNDS

NETWORK_ERROR
→ BLOCKCHAIN_NETWORK_ERROR

TIMEOUT
→ BLOCKCHAIN_TIMEOUT
```

Không expose private key hoặc raw internal config cho client.

---

# 30. Security

## Private Key

Không hard-code:

```ts
const PRIVATE_KEY = "...";
```

Dùng:

```env
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_PRIVATE_KEY=
BLOCKCHAIN_CHAIN_ID=
CERTIFICATE_CONTRACT_ADDRESS=
```

`.env` phải nằm trong `.gitignore`.

---

## Authorization

Chỉ ADMIN:

```text
Create certificate
Retry Blockchain
Revoke Certificate
```

Public:

```text
Verify Certificate
```

Student:

```text
View own certificates
Get QR/share URL
```

---

# 31. Logging

Mỗi Blockchain action nên log:

```text
certificateId
certificateCode
action
transactionHash
status
duration
error
timestamp
```

Không log:

```text
private key
wallet mnemonic
password
JWT secret
```

---

# 32. Test cases

## TC01 - Issue thành công

```text
Given:
valid certificate

When:
Admin cấp văn bằng

Then:
Certificate PENDING
→ tx submitted
→ receipt success
→ ISSUED
```

---

## TC02 - Blockchain RPC lỗi

```text
Given:
RPC unavailable

Then:
Certificate vẫn tồn tại
status = BLOCKCHAIN_FAILED
```

---

## TC03 - Retry thành công

```text
Given:
Certificate = BLOCKCHAIN_FAILED

When:
RPC hoạt động lại
Admin retry

Then:
ISSUED
```

---

## TC04 - Retry nhưng transaction cũ thực tế đã thành công

```text
Given:
DB chưa sync
Blockchain đã tồn tại certificate

When:
retry

Then:
Không gọi issue lần nữa
Sync DB → ISSUED
```

---

## TC05 - Duplicate Certificate Code

```text
Given:
certificateCode đã tồn tại DB

Then:
409 Conflict
```

---

## TC06 - Verify hợp lệ

```text
DB hash
=
generated hash
=
Blockchain hash

AND not revoked

→ VALID
```

---

## TC07 - DB bị chỉnh sửa

```text
generated hash != Blockchain hash

→ INVALID
```

---

## TC08 - Certificate revoked

```text
blockchain.revoked = true

→ REVOKED
```

---

# 33. Acceptance Criteria

Luồng cấp văn bằng được xem là hoàn thiện khi:

- Admin có thể tạo văn bằng.
- Certificate được tạo `PENDING` trước khi gọi Blockchain.
- Hash được tạo deterministic.
- Smart Contract nhận `certificateCode + documentHash`.
- Backend lưu transactionHash ngay sau khi broadcast.
- Backend chờ receipt.
- Receipt thành công → `ISSUED`.
- Blockchain lỗi → `BLOCKCHAIN_FAILED`.
- Không xóa Certificate khi Blockchain lỗi.
- Có API retry.
- Retry có idempotency check.
- Có public verify QR.
- Verify đối chiếu hash Database và Blockchain.
- Có revoke.
- Private key không nằm trong source.
- Có test cho success/failure/retry.

---

# 34. PROMPT CHO CODEX

Copy toàn bộ prompt bên dưới vào Codex cùng file đặc tả này.

```text
Bạn là Senior Full-stack Engineer có kinh nghiệm NestJS/Node.js, MongoDB và Ethereum Smart Contract.

Hãy đọc TOÀN BỘ file đặc tả:
CERTIFICATE_BLOCKCHAIN_FLOW.md

Nhiệm vụ của bạn là triển khai hệ thống quản lý và xác thực văn bằng điện tử đúng theo tài liệu. Không được tự ý thay đổi state machine hoặc bỏ các failure case.

MỤC TIÊU CHÍNH

Triển khai flow cấp văn bằng:

Admin bấm Cấp văn bằng
→ Backend authenticate + authorize
→ Validate
→ Kiểm tra duplicate
→ DB create Certificate status=PENDING
→ Generate deterministic documentHash
→ Create blockchain transaction log
→ Call Smart Contract issueCertificate
→ Save transactionHash ngay sau khi broadcast
→ Wait receipt

Nếu receipt SUCCESS:
→ Certificate.status = ISSUED
→ blockchainStatus = CONFIRMED
→ save blockNumber
→ save confirmedAt
→ save issuedAt

Nếu Blockchain FAILED:
→ KHÔNG rollback/delete Certificate
→ Certificate.status = BLOCKCHAIN_FAILED
→ blockchainStatus = FAILED
→ save blockchainError
→ save failedAt

Phải có retry endpoint:

POST /api/admin/certificates/:id/retry-blockchain

Retry chỉ áp dụng cho BLOCKCHAIN_FAILED.

TRƯỚC KHI gửi transaction retry:
phải query Smart Contract bằng certificateCode.

Nếu certificate đã tồn tại on-chain và documentHash trùng:
→ KHÔNG gửi issueCertificate lần nữa
→ sync DB thành ISSUED.

Nếu certificate chưa tồn tại on-chain:
→ mới gửi transaction mới.

Đây là yêu cầu idempotency bắt buộc.

TECH STACK

Backend:
- NestJS
- TypeScript
- MongoDB
- Mongoose
- class-validator
- JWT
- Ethers.js v6

Blockchain:
- Solidity
- Hardhat
- Ethereum local network hoặc testnet

Frontend nếu repository đã có:
- React hoặc Next.js
- TypeScript

DOMAIN

Các entity/collection chính:

users
students
institutions
certificates
blockchain_transactions
verification_logs

CERTIFICATE STATUS

PENDING
ISSUED
BLOCKCHAIN_FAILED
REVOKED

BLOCKCHAIN STATUS

NOT_SUBMITTED
SUBMITTED
CONFIRMED
FAILED

SMART CONTRACT

Tạo CertificateRegistry.sol.

Certificate:

struct Certificate {
    bytes32 documentHash;
    uint256 issuedAt;
    address issuer;
    bool exists;
    bool revoked;
}

mapping bằng certificateCode.

Functions:

issueCertificate(
  string certificateCode,
  bytes32 documentHash
)

getCertificate(
  string certificateCode
)

verifyCertificate(
  string certificateCode,
  bytes32 documentHash
)

revokeCertificate(
  string certificateCode
)

Contract phải chống duplicate certificateCode.

Tạo events:

CertificateIssued
CertificateRevoked

BACKEND ARCHITECTURE

Tách module rõ ràng:

auth
users
students
institutions
certificates
blockchain
verification

Không viết Ethers.js trực tiếp trong controller.

Tạo BlockchainService riêng.

CertificateService chịu trách nhiệm orchestration nghiệp vụ.

BlockchainService chịu trách nhiệm:

- connect provider
- connect wallet
- connect contract
- issueCertificate
- getCertificate
- verifyCertificate
- revokeCertificate
- wait transaction

HASH

Không hash raw Mongo document.

Tạo CertificateHashService.

Tạo canonical payload cố định:

certificateCode
studentCode
studentName
certificateName
major
issueDate
institutionCode

Normalize string bằng trim.

issueDate format YYYY-MM-DD.

Serialize deterministic.

Generate keccak256.

Cùng một input bắt buộc tạo cùng một hash.

API

1.
POST /api/admin/certificates

Create + Blockchain issue flow.

2.
POST /api/admin/certificates/:id/retry-blockchain

Retry Blockchain.

3.
GET /api/admin/certificates/:id

Certificate detail.

4.
GET /api/admin/certificates

Pagination/filter/search.

5.
GET /api/public/certificates/verify/:certificateCode

Public verify.

6.
POST /api/admin/certificates/:id/revoke

Revoke certificate.

VERIFY LOGIC

Một Certificate chỉ VALID khi:

DB certificate exists
AND status == ISSUED
AND locally generated hash == DB documentHash
AND DB documentHash == Blockchain documentHash
AND Blockchain exists == true
AND Blockchain revoked == false.

QR

QR chỉ chứa:

{CLIENT_URL}/verify/{certificateCode}

Không encode toàn bộ Certificate data vào QR.

DATABASE

Certificate phải có tối thiểu:

certificateCode
studentId
institutionId
certificateName
major
classification
issueDate
documentHash
transactionHash
blockNumber
blockchainStatus
status
blockchainError
retryCount
issuedAt
confirmedAt
failedAt
revokedAt
revokeReason
createdBy
timestamps

certificateCode phải unique.

BLOCKCHAIN TRANSACTION

Lưu mỗi attempt riêng.

Fields:

certificateId
action
transactionHash
network
chainId
contractAddress
status
blockNumber
errorCode
errorMessage
submittedAt
confirmedAt
failedAt
timestamps

Không overwrite lịch sử attempt cũ khi retry.

SECURITY

Private key chỉ đọc từ env.

Không commit env.

Validate env khi app startup.

Không log private key.

Chỉ ADMIN được:
- issue
- retry
- revoke

Public được verify.

ERROR HANDLING

Normalize Blockchain errors.

Không trả raw Ethers error toàn bộ cho client.

Các mã ứng dụng gợi ý:

CERTIFICATE_ALREADY_EXISTS
CERTIFICATE_NOT_FOUND
INVALID_CERTIFICATE_STATUS
BLOCKCHAIN_NETWORK_ERROR
BLOCKCHAIN_TIMEOUT
BLOCKCHAIN_TRANSACTION_REVERTED
BLOCKCHAIN_INSUFFICIENT_FUNDS
BLOCKCHAIN_ISSUE_FAILED

TRANSACTION CONSISTENCY

Không cố tạo distributed ACID transaction giữa MongoDB và Blockchain.

Database record phải được giữ lại nếu Blockchain thất bại.

State machine là source of truth của quá trình xử lý.

TEST

Viết unit/integration test cho ít nhất:

1. issue success
2. RPC failure
3. transaction revert
4. retry success
5. retry khi on-chain transaction thực tế đã thành công
6. duplicate certificateCode
7. verify valid
8. verify modified DB data
9. verify revoked certificate
10. unauthorized issue

CÁCH THỰC HIỆN

Trước khi code:
1. Scan repository hiện tại.
2. Xác định framework/version/package manager.
3. Reuse architecture, conventions và existing utilities của repository.
4. Không thay đổi code unrelated.
5. Liệt kê ngắn các file dự kiến tạo/sửa.

Sau đó triển khai từng phần.

Ưu tiên:
1. schema/enums
2. Smart Contract
3. BlockchainService
4. CertificateHashService
5. CertificateService
6. Controllers
7. DTO/validation
8. Verify flow
9. Retry/idempotency
10. Revoke
11. Tests
12. README/env example

Sau mỗi phần:
- chạy typecheck
- chạy lint nếu repo có
- chạy test phù hợp
- sửa lỗi trước khi chuyển tiếp.

Không để TODO placeholder cho business logic cốt lõi.

Nếu repository hiện tại có kiến trúc khác tài liệu:
hãy giữ conventions của repository nhưng vẫn phải đảm bảo đầy đủ nghiệp vụ và state machine đã mô tả.

KẾT QUẢ CUỐI CÙNG

Sau khi code xong, báo cáo:

1. Files created
2. Files modified
3. API implemented
4. Contract functions implemented
5. Database indexes
6. Env variables cần cấu hình
7. Cách chạy local Blockchain
8. Cách deploy contract
9. Cách chạy backend
10. Cách test flow:
   PENDING → ISSUED
   PENDING → BLOCKCHAIN_FAILED
   BLOCKCHAIN_FAILED → ISSUED
11. Các assumptions đã sử dụng.

Không được đơn giản hóa luồng bằng cách:
- gọi Blockchain trước rồi mới tạo DB;
- xóa Certificate khi Blockchain fail;
- đánh dấu ISSUED ngay khi chỉ mới nhận tx.hash;
- bỏ receipt;
- retry mà không kiểm tra on-chain;
- lưu private key trong source.
```

---

# 35. Flow cuối cùng cần Codex tuân thủ

```text
CREATE
──────────────────────────────────────────────

ADMIN
  │
  ▼
POST /admin/certificates
  │
  ▼
Auth / RBAC
  │
  ▼
Validate
  │
  ▼
Check Duplicate
  │
  ▼
Create DB Certificate
status=PENDING
  │
  ▼
Generate Hash
  │
  ▼
Create BlockchainTransaction
  │
  ▼
Smart Contract.issueCertificate()
  │
  ▼
Save transactionHash
  │
  ▼
tx.wait()
  │
  ├──────── SUCCESS ──────────► ISSUED
  │
  └──────── FAILED ───────────► BLOCKCHAIN_FAILED


RETRY
──────────────────────────────────────────────

BLOCKCHAIN_FAILED
  │
  ▼
Admin Retry
  │
  ▼
Check Blockchain
  │
  ├── Exists + Same Hash ─────► Sync ISSUED
  │
  └── Not Exists
            │
            ▼
       issueCertificate()
            │
            ▼
       save txHash
            │
            ▼
         receipt
          /   \
      success fail
        │      │
        ▼      ▼
     ISSUED  BLOCKCHAIN_FAILED


VERIFY
──────────────────────────────────────────────

Scan QR
  │
  ▼
/verify/:certificateCode
  │
  ▼
Load DB Certificate
  │
  ▼
Generate hash again
  │
  ▼
Read Smart Contract
  │
  ▼
Compare Hash + Revoked
  │
  ├── MATCH + ACTIVE ─────► VALID
  ├── REVOKED ────────────► REVOKED
  └── MISMATCH ───────────► INVALID
```


---

# 36. Giao diện React cần triển khai

Frontend sử dụng **React + Vite + TypeScript**. Chỉ cần **một React application duy nhất**, bên trong phân quyền theo route cho Admin và Student, đồng thời có trang Public Verify cho nhà tuyển dụng/người xác minh.

## 36.1. Nhóm màn hình Authentication

### `/login` — Đăng nhập

Đối tượng:
- Admin
- Student

Thành phần:
- Email / mã đăng nhập
- Password
- Nút đăng nhập
- Hiển thị lỗi sai thông tin đăng nhập

Sau khi đăng nhập:
- `ADMIN` → `/admin/dashboard`
- `STUDENT` → `/student/certificates`

---

## 36.2. Nhóm màn hình Admin

### `/admin/dashboard` — Dashboard

Hiển thị tổng quan:
- Tổng số sinh viên
- Tổng số văn bằng
- Số văn bằng `ISSUED`
- Số văn bằng `PENDING`
- Số văn bằng `BLOCKCHAIN_FAILED`
- Số văn bằng `REVOKED`
- Danh sách giao dịch Blockchain gần nhất
- Danh sách lỗi Blockchain gần nhất

### `/admin/students` — Quản lý sinh viên

Chức năng:
- Danh sách sinh viên
- Search theo mã/tên
- Pagination
- Thêm sinh viên
- Sửa sinh viên
- Xem chi tiết sinh viên

### `/admin/students/create` — Thêm sinh viên

Form:
- Mã sinh viên
- Họ tên
- Ngày sinh
- Ngành
- Lớp
- Khóa
- Email

### `/admin/students/:id` — Chi tiết sinh viên

Hiển thị:
- Thông tin sinh viên
- Danh sách văn bằng đã được cấp
- Trạng thái từng văn bằng

### `/admin/certificates` — Danh sách văn bằng

Bảng:
- Mã văn bằng
- Sinh viên
- Tên văn bằng
- Ngành
- Ngày cấp
- Trạng thái nghiệp vụ
- Trạng thái Blockchain
- Transaction Hash
- Action

Filter:
- Search mã văn bằng
- Search sinh viên
- Filter theo `PENDING`
- Filter theo `ISSUED`
- Filter theo `BLOCKCHAIN_FAILED`
- Filter theo `REVOKED`

### `/admin/certificates/create` — Cấp văn bằng

Form:
- Sinh viên
- Mã văn bằng
- Tên văn bằng
- Loại bằng
- Ngành
- Xếp loại
- Ngày cấp
- Đơn vị cấp

Nút chính:

```text
Cấp văn bằng
```

Sau khi submit:

```text
PENDING
→ gửi Blockchain
→ chờ receipt
→ ISSUED / BLOCKCHAIN_FAILED
```

UI phải hiển thị trạng thái xử lý rõ ràng.

### `/admin/certificates/:id` — Chi tiết văn bằng

Hiển thị:
- Thông tin văn bằng
- Thông tin sinh viên
- Document Hash
- Transaction Hash
- Block Number
- Blockchain Status
- Certificate Status
- QR Code
- Link verify
- Thời gian issued/confirmed/failed
- Lỗi Blockchain nếu có

Action theo trạng thái:

`PENDING`
- không cho thao tác retry
- hiển thị "Đang xử lý Blockchain"

`ISSUED`
- hiển thị QR
- copy verify link
- cho phép thu hồi

`BLOCKCHAIN_FAILED`
- hiển thị lỗi
- nút `Thử lại Blockchain`

`REVOKED`
- hiển thị lý do thu hồi
- không cho retry issue

### `/admin/blockchain-transactions` — Lịch sử giao dịch Blockchain

Hiển thị:
- Certificate Code
- Action
- Tx Hash
- Network
- Chain ID
- Contract Address
- Status
- Block Number
- Error
- Submitted At
- Confirmed At / Failed At

Màn hình này không bắt buộc nếu muốn giảm scope, nhưng nên có vì giúp demo KLTN rõ hơn.

---

## 36.3. Nhóm màn hình Student

### `/student/certificates` — Văn bằng của tôi

Hiển thị dạng card/table:
- Tên văn bằng
- Mã văn bằng
- Ngành
- Ngày cấp
- Trạng thái

Chỉ hiển thị văn bằng thuộc sinh viên đang đăng nhập.

### `/student/certificates/:id` — Chi tiết văn bằng của tôi

Hiển thị:
- Thông tin văn bằng
- Trạng thái
- QR Code
- Verify URL
- Document Hash
- Transaction Hash nếu muốn công khai cho sinh viên

Actions:
- Sao chép link xác thực
- Tải / hiển thị QR
- Mở trang xác thực public

Student không được:
- sửa văn bằng
- cấp văn bằng
- retry Blockchain
- revoke

---

## 36.4. Public Verify

### `/verify/:certificateCode` — Xác thực văn bằng

Không yêu cầu đăng nhập.

Các trạng thái UI:

`LOADING`
```text
Đang xác thực dữ liệu...
```

`VALID`
```text
Văn bằng hợp lệ
```

Hiển thị:
- Mã văn bằng
- Họ tên sinh viên
- Tên văn bằng
- Ngành
- Ngày cấp
- Đơn vị cấp
- Hash
- Blockchain verified

`INVALID`
```text
Không thể xác thực văn bằng
```

`REVOKED`
```text
Văn bằng đã bị thu hồi
```

`NOT_FOUND`
```text
Không tìm thấy văn bằng
```

Không hiển thị dữ liệu nhạy cảm không cần thiết.

---

# 37. Route Structure React

```text
/
├── /login
│
├── /admin
│   ├── /dashboard
│   ├── /students
│   ├── /students/create
│   ├── /students/:id
│   ├── /certificates
│   ├── /certificates/create
│   ├── /certificates/:id
│   └── /blockchain-transactions
│
├── /student
│   ├── /certificates
│   └── /certificates/:id
│
└── /verify/:certificateCode
```

---

# 38. Frontend Folder Structure

```text
src/
├── app/
│   ├── router.tsx
│   └── providers.tsx
│
├── layouts/
│   ├── AdminLayout.tsx
│   ├── StudentLayout.tsx
│   └── PublicLayout.tsx
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   │
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── StudentListPage.tsx
│   │   ├── StudentCreatePage.tsx
│   │   ├── StudentDetailPage.tsx
│   │   ├── CertificateListPage.tsx
│   │   ├── CertificateCreatePage.tsx
│   │   ├── CertificateDetailPage.tsx
│   │   └── BlockchainTransactionPage.tsx
│   │
│   ├── student/
│   │   ├── MyCertificateListPage.tsx
│   │   └── MyCertificateDetailPage.tsx
│   │
│   └── public/
│       └── VerifyCertificatePage.tsx
│
├── features/
│   ├── auth/
│   ├── students/
│   ├── certificates/
│   ├── blockchain/
│   └── verification/
│
├── components/
│   ├── CertificateStatusBadge.tsx
│   ├── BlockchainStatusBadge.tsx
│   ├── CertificateQRCode.tsx
│   ├── TransactionHashLink.tsx
│   ├── ConfirmDialog.tsx
│   └── DataTable.tsx
│
├── services/
│   ├── api.ts
│   ├── auth.api.ts
│   ├── student.api.ts
│   ├── certificate.api.ts
│   └── verification.api.ts
│
├── hooks/
├── types/
├── utils/
└── main.tsx
```

---

# 39. Quy tắc UI theo Certificate Status

| Status | Badge | Hành động Admin | Student | Public Verify |
|---|---|---|---|---|
| `PENDING` | Đang xử lý | Xem | Có thể ẩn hoặc hiện đang xử lý | Không hợp lệ |
| `ISSUED` | Đã cấp | Xem, Thu hồi | Xem, QR, chia sẻ | VALID nếu hash khớp |
| `BLOCKCHAIN_FAILED` | Blockchain lỗi | Xem, Retry | Không nên hiển thị như bằng hợp lệ | INVALID/không public |
| `REVOKED` | Đã thu hồi | Xem | Xem trạng thái | REVOKED |

---

# 40. Bộ tài liệu triển khai tuần tự cho Codex

Không nên đưa toàn bộ tài liệu này vào một prompt duy nhất.

Codex nên đọc lần lượt các file trong thư mục `certificate_blockchain_specs/`:

```text
00_INDEX.md
01_SCOPE_AND_ARCHITECTURE.md
02_DATABASE_AND_STATE_MACHINE.md
03_SMART_CONTRACT.md
04_BACKEND_CERTIFICATE_FLOW.md
05_FRONTEND_REACT_UI.md
06_VERIFY_RETRY_REVOKE.md
07_TESTING_AND_ACCEPTANCE.md
08_CODEX_MASTER_PROMPT.md
```

Quy tắc:
- Hoàn thành file hiện tại trước khi sang file tiếp theo.
- Sau mỗi phase phải build/typecheck/test.
- Không tự sửa state machine.
- Không triển khai chức năng của phase sau khi phase trước chưa ổn.


---

# 41. AI Development Rule — 1 Flow = End-to-End Change

Từ phiên bản tài liệu này, Codex phải triển khai theo **vertical slice** thay vì chia rời frontend/backend.

Mỗi nghiệp vụ phải được cập nhật xuyên suốt trong cùng một flow:

```text
React Page/Component
→ Type/API Client
→ Backend API
→ DTO/Auth/Validation
→ Service/Repository
→ MongoDB
→ Blockchain nếu liên quan
→ API Response
→ React cập nhật UI
→ Test
```

Ví dụ flow `Cấp văn bằng` chỉ được xem là hoàn thành khi Admin có thể thao tác trên React và kết quả cuối cùng phản ánh đúng trạng thái DB/Blockchain (`ISSUED` hoặc `BLOCKCHAIN_FAILED`).

Chi tiết protocol: `09_AI_END_TO_END_FLOW_PROTOCOL.md`.
Thứ tự triển khai: thư mục `flows/`.
Prompt bắt đầu: `10_CODEX_START_PROMPT.md`.
