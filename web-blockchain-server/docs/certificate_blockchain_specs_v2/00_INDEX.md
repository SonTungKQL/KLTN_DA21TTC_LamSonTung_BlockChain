# 00 — INDEX / CÁCH CODEX PHẢI TRIỂN KHAI

## Mục tiêu

Bộ tài liệu này dùng để triển khai hệ thống quản lý và xác thực văn bằng Blockchain theo nguyên tắc **mỗi lần làm một flow end-to-end hoàn chỉnh**.

Không làm kiểu "xong toàn bộ backend rồi mới qua frontend".

Mỗi flow phải đi xuyên suốt:

```text
React UI
→ frontend service/API client
→ Backend Controller/Route
→ DTO/Validation/Auth
→ Service business logic
→ Repository/Database
→ Blockchain nếu flow cần
→ Response contract
→ React cập nhật state/UI
→ Test backend
→ Test frontend / build
→ Demo flow
```

## Tài liệu nền tảng — đọc trước, không triển khai rời rạc theo tầng

1. `01_SCOPE_AND_ARCHITECTURE.md`
2. `02_DATABASE_AND_STATE_MACHINE.md`
3. `03_SMART_CONTRACT.md`
4. `04_BACKEND_CERTIFICATE_FLOW.md`
5. `05_FRONTEND_REACT_UI.md`
6. `06_VERIFY_RETRY_REVOKE.md`
7. `07_TESTING_AND_ACCEPTANCE.md`
8. `09_AI_END_TO_END_FLOW_PROTOCOL.md`
9. `11_QR_HASH_CERTIFICATE_VERIFICATION.md` — cơ chế định danh hash và quét QR xác minh văn bằng

Các file trên là **reference/spec tổng thể**.

## Thứ tự triển khai thực tế — theo FLOW

Codex phải làm lần lượt:

1. `flows/01_FLOW_PROJECT_FOUNDATION.md`
2. `flows/02_FLOW_AUTH_LOGIN.md`
3. `flows/03_FLOW_STUDENT_MANAGEMENT.md`
4. `flows/04_FLOW_ISSUE_CERTIFICATE.md`
5. `flows/05_FLOW_CERTIFICATE_LIST_DETAIL.md`
6. `flows/06_FLOW_RETRY_BLOCKCHAIN.md`
7. `flows/07_FLOW_PUBLIC_VERIFY.md`
8. `flows/08_FLOW_REVOKE_CERTIFICATE.md`
9. `flows/09_FLOW_STUDENT_CERTIFICATES.md`
10. `flows/10_FLOW_BLOCKCHAIN_TRANSACTION_LOG.md`
11. `flows/11_FLOW_FINAL_INTEGRATION_TEST.md`

Sau cùng đọc:

`10_CODEX_START_PROMPT.md`

## Quy tắc cứng

1. Mỗi lần chỉ active **một flow**.
2. Một flow chưa pass build/test thì không sang flow tiếp theo.
3. Không chỉ code backend rồi báo xong flow.
4. Không chỉ dựng UI mock mà chưa nối API thật.
5. Flow chỉ hoàn thành khi frontend và backend chạy xuyên suốt với nhau.
6. Flow có Blockchain phải test cả success và failure phù hợp.
7. Không delete Certificate khi Blockchain fail.
8. Không đánh dấu `ISSUED` khi mới chỉ nhận `tx.hash`.
9. Phải chờ receipt.
10. Retry phải kiểm tra on-chain trước để đảm bảo idempotency.
