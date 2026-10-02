# 09 — AI END-TO-END FLOW PROTOCOL

## 1. Mục đích

File này quy định cách Codex/AI phải thay đổi code.

Nguyên tắc chính:

> **1 yêu cầu nghiệp vụ = 1 flow end-to-end = 1 lần thay đổi code xuyên từ frontend đến backend và các tầng liên quan.**

Không được chia cùng một nghiệp vụ thành các lần sửa rời rạc kiểu:

```text
lần 1: tạo UI
lần 2: tạo API
lần 3: tạo DB
lần 4: nối Blockchain
```

Thay vào đó, khi thực hiện một flow, AI phải hoàn thiện toàn bộ vertical slice:

```text
UI → API client → API backend → validation → business logic
→ DB → Blockchain (nếu có) → response → UI state → tests
```

---

# 2. Định nghĩa một Flow hoàn chỉnh

Một flow chỉ được đánh dấu `DONE` khi có đủ các phần áp dụng cho flow đó:

### Frontend
- route/page/component
- form/table/detail UI
- loading state
- success state
- error state
- API call thật
- permission/route guard nếu cần

### Backend
- route/controller
- DTO/validation
- authentication/authorization
- service/business rule
- repository/model/schema interaction
- standardized response/error

### Database
- schema/index nếu cần
- read/write/query thực tế
- dữ liệu demo/seed nếu flow cần

### Blockchain
Chỉ áp dụng khi flow liên quan:
- contract function
- Ethers integration
- tx hash handling
- receipt handling
- failure handling
- idempotency nếu retry

### Test
- backend unit/integration test phù hợp
- contract test nếu đụng Smart Contract
- frontend build/typecheck
- manual demo scenario

---

# 3. Chu trình bắt buộc cho mỗi Flow

## STEP 1 — Read

AI đọc:
- `00_INDEX.md`
- file flow đang active
- các reference MD được flow chỉ định
- source code hiện tại liên quan flow

Không đọc lan man và sửa module không liên quan.

## STEP 2 — Impact Map

Trước khi code, AI phải in ngắn:

```text
ACTIVE FLOW: <flow name>

Frontend files:
- ...

Backend files:
- ...

Database:
- ...

Blockchain:
- ...

Tests:
- ...

API contract:
REQUEST: ...
RESPONSE: ...
```

Nếu repo đã có file tương đương, ưu tiên sửa/reuse thay vì tạo duplicate.

## STEP 3 — Implement vertical slice

Triển khai theo thứ tự nội bộ:

```text
Data contract/types
→ backend business/API
→ DB/Blockchain
→ frontend API client
→ frontend UI
→ errors/loading/status
→ tests
```

AI có thể sửa nhiều file trong cùng flow, nhưng tất cả thay đổi phải phục vụ cùng flow.

## STEP 4 — Verify end-to-end

Bắt buộc kiểm tra:

```text
User action trên React
→ request gửi đúng
→ backend nhận đúng
→ business rule chạy đúng
→ DB thay đổi đúng
→ blockchain thay đổi đúng nếu có
→ response đúng
→ React hiển thị đúng trạng thái cuối
```

## STEP 5 — Regression check

Chạy các lệnh repo đang hỗ trợ:
- lint
- typecheck
- build
- unit tests
- integration tests
- contract tests nếu cần

Không được bỏ qua lỗi bằng cách comment test hoặc disable type checking.

## STEP 6 — Flow Report

Sau flow, AI phải trả:

```text
FLOW COMPLETED: <name>

Frontend:
- ...

Backend:
- ...

Database:
- ...

Blockchain:
- ...

Tests run:
- ...

Manual demo:
1. ...
2. ...
3. ...

Known issue:
- none / ...
```

Chỉ sau report này mới chuyển flow tiếp theo.

---

# 4. Quy tắc khi có thay đổi yêu cầu giữa chừng

Khi user yêu cầu thay đổi một nghiệp vụ đã tồn tại, AI phải xác định flow bị ảnh hưởng và cập nhật **toàn bộ vertical slice trong cùng lần sửa**.

Ví dụ user đổi:

```text
Cấp văn bằng phải có thêm trường graduationYear
```

Không chỉ thêm input React.

Phải kiểm tra và cập nhật trong cùng flow:

```text
React form
→ TypeScript type
→ API request DTO
→ backend validation
→ schema/database
→ canonical hash payload nếu graduationYear thuộc dữ liệu cần xác thực
→ Smart Contract chỉ khi thiết kế on-chain cần field đó
→ detail UI
→ verify UI
→ tests
```

Nếu field không nên đưa vào hash/Blockchain, AI phải giữ nguyên contract/hash và ghi rõ lý do trong Flow Report.

---

# 5. API Contract First

Mỗi flow phải xác định request/response trước khi nối React.

Ví dụ:

```http
POST /api/admin/certificates
```

Request và response phải có TypeScript type tương ứng ở frontend.

Không để frontend tự đoán response backend.

---

# 6. Không tạo code duplicate

Trước khi tạo:
- service mới
- component mới
- DTO mới
- schema mới
- utility mới

AI phải search repository xem đã có chức năng tương đương chưa.

Reuse/refactor tối thiểu cần thiết.

Không rewrite toàn project khi chỉ cần sửa một flow.

---

# 7. Definition of Done của một Flow

Flow = DONE khi tất cả điều kiện áp dụng đều đúng:

```text
[ ] UI có thể thao tác thật
[ ] UI gọi API thật
[ ] API validate đúng
[ ] Auth/RBAC đúng
[ ] Business rule đúng
[ ] DB read/write đúng
[ ] Blockchain đúng nếu liên quan
[ ] Error case có xử lý
[ ] Loading/submitting state có xử lý
[ ] Response type thống nhất
[ ] Build/typecheck pass
[ ] Tests phù hợp pass
[ ] Demo flow chạy từ UI đến dữ liệu cuối
```

Nếu thiếu một mục bắt buộc, AI phải ghi `FLOW INCOMPLETE`, không được báo DONE.
