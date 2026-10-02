# 06 — VERIFY, RETRY & REVOKE

# 1. Retry

Endpoint:

```http
POST /api/admin/certificates/:id/retry-blockchain
```

Chỉ cho:
`BLOCKCHAIN_FAILED`

## Flow

```text
load Certificate
↓
validate status
↓
query on-chain by certificateCode
↓
exists + same hash?
├─ YES → sync DB = ISSUED, không gửi tx mới
└─ NO
   ↓
   create new BlockchainTransaction attempt
   ↓
   issueCertificate()
   ↓
   save new txHash
   ↓
   wait receipt
   ↓
   ISSUED / BLOCKCHAIN_FAILED
```

## Idempotency

Case bắt buộc:

```text
Blockchain success
↓
backend crash trước update DB
↓
DB còn PENDING/BLOCKCHAIN_FAILED
↓
retry
```

Phải query chain trước.

Nếu on-chain đã tồn tại và same hash:
- không issue lại
- sync DB → ISSUED

Nếu on-chain tồn tại nhưng hash khác:
- không overwrite
- trả conflict/security error

---

# 2. Verify

Endpoint:

```http
GET /api/public/certificates/verify/:certificateCode
```

Flow:

```text
find DB
↓
not found → NOT_FOUND
↓
status revoked → vẫn query/confirm chain nếu cần
↓
rebuild canonical hash
↓
compare localHash == db.documentHash
↓
query chain
↓
compare chain hash
↓
check revoked
```

VALID khi:

```text
DB exists
AND status == ISSUED
AND localHash == DB.documentHash
AND DB.documentHash == onChain.documentHash
AND onChain.exists == true
AND onChain.revoked == false
```

Result:
- VALID
- INVALID
- REVOKED
- NOT_FOUND

Log vào `verification_logs`.

QR chứa:

```text
{CLIENT_URL}/verify/{certificateCode}
```

Không nhét toàn bộ data vào QR.

---

# 3. Revoke

Endpoint:

```http
POST /api/admin/certificates/:id/revoke
```

Request:

```json
{
  "reason": "Cấp sai thông tin"
}
```

Chỉ cho:
`ISSUED`

Flow:

```text
validate reason
↓
call revokeCertificate()
↓
save txHash attempt
↓
wait receipt
↓
success → REVOKED
fail → giữ ISSUED + log revoke error
```

Nếu muốn đơn giản KLTN:
- không cần `REVOKE_PENDING`
- không cần `REVOKE_FAILED`

Nhưng blockchain_transactions phải lưu attempt revoke.

## UI

CertificateDetail:
- ISSUED → button Thu hồi
- BLOCKCHAIN_FAILED → button Retry
- REVOKED → readonly
