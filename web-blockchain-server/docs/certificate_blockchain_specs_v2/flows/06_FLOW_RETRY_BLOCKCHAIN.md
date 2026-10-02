# FLOW 06 — RETRY BLOCKCHAIN END-TO-END

## React
Trong `/admin/certificates/:id`:
- chỉ hiện Retry khi `BLOCKCHAIN_FAILED`
- disable button khi đang retry
- show error/success
- refresh detail sau retry

## Backend
`POST /api/admin/certificates/:id/retry-blockchain`

## Bắt buộc idempotency
```text
load DB certificate
→ status phải BLOCKCHAIN_FAILED
→ query on-chain trước
├─ exists + same hash → sync DB ISSUED, KHÔNG issue mới
├─ exists + different hash → conflict/security error
└─ not exists → create attempt mới → issue → save txHash → wait receipt
```

Không overwrite attempt cũ trong `blockchain_transactions`.

## Tests
- retry success
- retry fail
- on-chain already success but DB stale
- on-chain different hash
- wrong status
- frontend retry state
