# FLOW 11 — FINAL INTEGRATION & DEMO

## Mục tiêu
Không thêm feature mới. Chỉ rà soát tất cả vertical flows.

## Scenario A — Happy path
```text
Admin login
→ create student
→ issue certificate
→ PENDING/SUBMITTED
→ ISSUED
→ admin detail thấy tx/hash/block
→ student login thấy bằng
→ QR/public verify → VALID
```

## Scenario B — Blockchain failure + retry
```text
Admin issue khi RPC fail
→ BLOCKCHAIN_FAILED
→ bật lại RPC
→ Retry
→ check on-chain
→ ISSUED
```

## Scenario C — Revoke
```text
ISSUED
→ Admin revoke
→ REVOKED
→ Student thấy revoked
→ Public verify → REVOKED
```

## Final checks
- frontend build
- backend build
- lint
- tests
- contract tests
- env example
- README local setup
- no hard-coded secret
- no TODO core flow
- routes and APIs consistent
