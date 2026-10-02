# FLOW 08 — REVOKE CERTIFICATE END-TO-END

## React
Certificate detail khi `ISSUED`:
- button Thu hồi
- confirm dialog
- reason required
- submitting state
- refresh status sau success

## Backend
`POST /api/admin/certificates/:id/revoke`

Request:
```json
{ "reason": "..." }
```

Flow:
```text
validate ISSUED + reason
→ create blockchain attempt action=REVOKE_CERTIFICATE
→ contract.revokeCertificate
→ save `revocationTransactionHash` ngay khi nhận tx hash
→ wait receipt
├─ success → REVOKED + revokedAt + reason + revocation block
└─ fail → giữ ISSUED + log failure attempt
```

## Verify impact
Public verify sau revoke phải trả `REVOKED`.

## Tests
- revoke success
- revoke contract failure
- already revoked
- non-admin forbidden
- public verify after revoke

## Traceability

- Không xóa văn bằng; `REVOKED` chỉ hủy hiệu lực xác minh.
- Giữ `transactionHash` và `blockNumber` của lần phát hành.
- Lưu riêng `revocationTransactionHash`, `revocationBlockNumber`, `revocationConfirmedAt` cho giao dịch thu hồi.
- Nếu blockchain đã báo thu hồi nhưng backend chưa kịp cập nhật, yêu cầu thu hồi kế tiếp đồng bộ DB về `REVOKED` thay vì gửi giao dịch lặp.
