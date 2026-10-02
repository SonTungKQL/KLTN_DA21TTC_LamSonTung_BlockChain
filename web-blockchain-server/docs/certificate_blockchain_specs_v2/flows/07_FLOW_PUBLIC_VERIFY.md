# FLOW 07 — PUBLIC VERIFY END-TO-END

## React
Routes:
- `/verify` — nhập mã văn bằng để tra cứu công khai
- `/verify/:certificateCode` — hiển thị kết quả xác minh

States:
- LOADING
- VALID
- INVALID
- REVOKED
- NOT_FOUND

## Backend
`GET /api/public/certificates/verify/:certificateCode`

## Logic
```text
load DB
→ rebuild canonical hash
→ compare local hash với DB hash
→ query blockchain
→ compare on-chain hash
→ check revoked
→ result
```

VALID chỉ khi toàn bộ điều kiện trong spec tổng thể đúng.

## DB
Ghi `verification_logs`.

## QR
QR của Certificate phải trỏ tới:
`{CLIENT_URL}/verify/{certificateCode}?source=qr`

QR payload do API đã phân quyền tạo:

```http
GET /api/admin/certificates/:id/verification-qr
GET /api/student/certificates/:id/verification-qr
```

Route `/verify/:certificateCode?source=qr` truyền `method=QR` tới public verify API để lưu đúng nguồn xác minh.
Khi người dùng tự nhập mã, frontend gửi `method=CODE`.

Quy ước hash, nội dung QR, điều kiện an toàn và trạng thái xác minh được mô tả tại
`../11_QR_HASH_CERTIFICATE_VERIFICATION.md`.

## Tests
- valid
- modified DB data
- revoked
- not found
- wrong on-chain hash
- React render mỗi state
