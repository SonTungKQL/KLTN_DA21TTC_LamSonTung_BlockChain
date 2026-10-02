# FLOW 05 — CERTIFICATE LIST & DETAIL

## React
- `/admin/certificates`
- `/admin/certificates/:id`

List:
- search
- pagination
- status filter
- blockchain status filter

Detail:
- certificate
- student
- institution
- documentHash
- txHash
- blockNumber
- timestamps
- blockchain error
- QR only when appropriate

## Backend
- GET `/api/admin/certificates`
- GET `/api/admin/certificates/:id`

## DB
Query/index phải dùng các index đã định nghĩa.

## UI status
- PENDING → Đang xử lý
- ISSUED → Đã cấp
- BLOCKCHAIN_FAILED → Blockchain lỗi
- REVOKED → Đã thu hồi

## Tests
- filters
- pagination
- detail
- not found
- admin guard
