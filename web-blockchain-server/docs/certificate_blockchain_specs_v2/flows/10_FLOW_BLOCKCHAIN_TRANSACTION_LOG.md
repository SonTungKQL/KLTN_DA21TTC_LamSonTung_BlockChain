# FLOW 10 — BLOCKCHAIN TRANSACTION LOG

## React
Route: `/admin/blockchain-transactions`

Table:
- certificateCode
- action
- transactionHash
- network
- chainId
- status
- blockNumber
- error
- submittedAt
- confirmedAt/failedAt

## Backend
GET `/api/admin/blockchain-transactions`

Support:
- pagination
- status filter
- action filter
- certificate keyword nếu dễ triển khai

## DB
Không mutate lịch sử attempt khi chỉ xem log.

## Note
Flow này optional nếu cần giảm scope KLTN. Nếu bỏ, ghi rõ trong final report.
