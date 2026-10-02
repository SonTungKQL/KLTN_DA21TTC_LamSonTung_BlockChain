# 10 — CODEX START PROMPT

Copy prompt bên dưới để bắt đầu Codex.

```text
Bạn sẽ triển khai repository này theo phương pháp END-TO-END VERTICAL FLOW.

QUY TẮC QUAN TRỌNG NHẤT:
1 yêu cầu nghiệp vụ = 1 flow hoàn chỉnh từ React → API → Backend → Database → Blockchain nếu có → Response → React UI → Tests.

Không làm toàn bộ backend trước rồi mới làm frontend.
Không tạo UI mock rồi để API cho phase sau.
Không báo một flow DONE nếu UI chưa gọi API thật hoặc backend chưa xử lý dữ liệu thật.

BƯỚC KHỞI ĐỘNG — CHƯA CODE NGAY

Hãy đọc theo thứ tự:
- 00_INDEX.md
- 01_SCOPE_AND_ARCHITECTURE.md
- 02_DATABASE_AND_STATE_MACHINE.md
- 03_SMART_CONTRACT.md
- 04_BACKEND_CERTIFICATE_FLOW.md
- 05_FRONTEND_REACT_UI.md
- 06_VERIFY_RETRY_REVOKE.md
- 07_TESTING_AND_ACCEPTANCE.md
- 09_AI_END_TO_END_FLOW_PROTOCOL.md

Sau đó scan toàn bộ repository hiện tại để xác định:
- frontend nằm ở đâu
- backend nằm ở đâu
- package manager
- framework/version
- existing conventions
- code/module nào đã tồn tại và có thể reuse
- env/config hiện có

Sau khi scan, KHÔNG code tất cả.

Hãy bắt đầu DUY NHẤT với:
flows/01_FLOW_PROJECT_FOUNDATION.md

Trước khi sửa code, hãy trả cho tôi một IMPACT MAP ngắn theo format:

ACTIVE FLOW: FLOW 01 — PROJECT FOUNDATION

Frontend files sẽ tạo/sửa:
- ...

Backend files sẽ tạo/sửa:
- ...

Database/config:
- ...

Blockchain files sẽ tạo/sửa:
- ...

Tests/build commands sẽ chạy:
- ...

Assumptions:
- ...

Sau Impact Map, triển khai luôn FLOW 01. Không hỏi xác nhận nếu repository đủ thông tin để thực hiện.

Khi hoàn thành FLOW 01:
- chạy build/typecheck/lint/test phù hợp
- sửa lỗi
- chạy lại cho pass
- đưa FLOW REPORT

FLOW REPORT phải có:
- Frontend changes
- Backend changes
- Database/config changes
- Blockchain changes
- Tests/build đã chạy
- Manual verification
- Known issues

Chỉ khi FLOW 01 hoàn tất mới chuyển sang FLOW 02 ở lần làm tiếp theo.

CÁC YÊU CẦU CỨNG TOÀN PROJECT

Certificate issue:
DB create PENDING
→ generate canonical hash
→ Smart Contract issue
→ nhận txHash
→ save txHash
→ await receipt
→ SUCCESS = ISSUED
→ FAILED = BLOCKCHAIN_FAILED

Không rollback/delete Certificate khi Blockchain fail.
Không đánh dấu ISSUED chỉ vì có txHash.
Retry phải query on-chain trước để idempotent.
React không gọi Smart Contract trực tiếp; chỉ gọi backend REST API.
Private key chỉ ở env backend.
Không thêm NFT/DID/payment ngoài scope.

Khi user yêu cầu thay đổi một flow đã có, hãy cập nhật toàn bộ vertical slice trong CÙNG MỘT LẦN sửa, ví dụ:
React form/type → API client → DTO → Service → DB/hash/Blockchain nếu bị ảnh hưởng → Response → Detail/Verify UI → tests.
Không sửa một tầng rồi để tầng khác lệch contract.
```
