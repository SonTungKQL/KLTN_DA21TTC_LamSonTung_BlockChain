# 07 — TESTING & ACCEPTANCE

## Backend tests

### TC01 Issue success

Expected:
```text
PENDING
→ SUBMITTED
→ ISSUED
```

Có:
- documentHash
- transactionHash
- blockNumber

### TC02 RPC failure

Expected:
```text
Certificate vẫn tồn tại
status=BLOCKCHAIN_FAILED
```

### TC03 Contract revert

Expected:
- không delete Certificate
- transaction attempt FAILED

### TC04 Retry success

```text
BLOCKCHAIN_FAILED
→ retry
→ ISSUED
```

### TC05 Crash recovery / idempotency

On-chain đã có certificate nhưng DB chưa sync.

Retry:
- query chain
- không issue duplicate
- DB → ISSUED

### TC06 Duplicate code

Expected:
`409 Conflict`

### TC07 Verify valid

Expected:
`VALID`

### TC08 Modified DB data

Rebuild hash mismatch.

Expected:
`INVALID`

### TC09 Revoked

Expected:
`REVOKED`

### TC10 Unauthorized issue

Student/public không được issue.

Expected:
`403`

## Smart Contract tests

- issue success
- duplicate revert
- verify correct hash
- wrong hash false
- revoke
- revoked verify false
- permission

## Frontend acceptance

### Login
- role redirect đúng

### Admin
- student CRUD usable
- certificate create works
- status badge đúng
- detail có blockchain info
- failed có Retry
- issued có Revoke
- QR chỉ rõ ràng với issued

### Student
- chỉ thấy certificate của mình
- không thấy admin actions

### Public
- valid
- invalid
- revoked
- not found
- responsive tối thiểu

## Demo flow

### Demo A
```text
Admin login
→ create student
→ issue certificate
→ PENDING
→ ISSUED
→ show txHash + blockNumber + QR
→ open verify
→ VALID
```

### Demo B
```text
shutdown local blockchain/RPC
→ issue
→ BLOCKCHAIN_FAILED
→ restart blockchain
→ Retry
→ ISSUED
```

### Demo C
```text
ISSUED
→ Revoke
→ REVOKED
→ public verify
→ REVOKED
```

## Definition of Done

- build frontend pass
- backend typecheck/build pass
- contract tests pass
- API tests chính pass
- `.env.example` đầy đủ
- README chạy local
- không commit secret
- không có TODO ở core flow
