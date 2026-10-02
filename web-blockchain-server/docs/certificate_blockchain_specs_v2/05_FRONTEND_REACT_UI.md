# 05 — FRONTEND REACT UI

## Stack

- React
- Vite
- TypeScript
- React Router
- REST API

Chỉ một React app.

## Route map

```text
/login

/admin/dashboard
/admin/students
/admin/students/create
/admin/students/:id
/admin/certificates
/admin/certificates/create
/admin/certificates/:id
/admin/blockchain-transactions

/student/certificates
/student/certificates/:id

/verify/:certificateCode
```

## Layout

### AdminLayout

Sidebar:
- Tổng quan
- Sinh viên
- Văn bằng
- Giao dịch Blockchain
- Đăng xuất

Header:
- tên user
- role

### StudentLayout

Menu:
- Văn bằng của tôi
- Đăng xuất

### PublicLayout

Không cần sidebar.

---

# MÀN HÌNH

## 1. LoginPage

Route:
`/login`

Fields:
- email/login
- password

Behavior:
- ADMIN → `/admin/dashboard`
- STUDENT → `/student/certificates`

---

## 2. Admin Dashboard

Route:
`/admin/dashboard`

Cards:
- Tổng sinh viên
- Tổng văn bằng
- ISSUED
- PENDING
- BLOCKCHAIN_FAILED
- REVOKED

Sections:
- giao dịch Blockchain gần nhất
- lỗi gần nhất

---

## 3. Student List

Route:
`/admin/students`

Table:
- mã sinh viên
- họ tên
- ngành
- lớp
- khóa
- action

Functions:
- search
- pagination
- create
- edit/detail

---

## 4. Student Create

Route:
`/admin/students/create`

Fields:
- studentCode
- fullName
- dateOfBirth
- major
- className
- course
- email

---

## 5. Student Detail

Route:
`/admin/students/:id`

Hiển thị:
- profile
- danh sách văn bằng của sinh viên

---

## 6. Certificate List

Route:
`/admin/certificates`

Columns:
- certificateCode
- student
- certificateName
- major
- issueDate
- status
- blockchainStatus
- transactionHash
- action

Filters:
- keyword
- student
- status
- blockchainStatus

---

## 7. Certificate Create

Route:
`/admin/certificates/create`

Fields:
- student
- certificateCode
- certificateName
- degreeType
- major
- classification
- issueDate
- institution

Button:
`Cấp văn bằng`

Submit UX:

```text
1. disable button
2. show "Đang tạo văn bằng..."
3. API trả certificate
4. chuyển detail
5. detail hiển thị current state
```

Nếu backend xử lý đồng bộ tới receipt:
- hiển thị success/error sau response.

Nếu backend trả sớm:
- poll detail theo interval hợp lý đến terminal state.

Không được hiển thị "Đã cấp" chỉ vì có transactionHash.

---

## 8. Certificate Detail Admin

Route:
`/admin/certificates/:id`

Sections:

### Certificate Info
- code
- name
- major
- classification
- issueDate
- institution

### Student Info
- studentCode
- fullName

### Blockchain Info
- documentHash
- transactionHash
- blockNumber
- blockchainStatus

### Status Timeline
- created
- submitted
- confirmed / failed
- revoked

### QR
Chỉ show QR rõ ràng khi `ISSUED`.

### Actions

`PENDING`
- disable issue/retry
- label: Đang xử lý

`ISSUED`
- Copy verify URL
- Revoke

`BLOCKCHAIN_FAILED`
- Show error
- Retry Blockchain

`REVOKED`
- readonly
- show revokeReason

---

## 9. Blockchain Transaction List

Route:
`/admin/blockchain-transactions`

Columns:
- certificateCode
- action
- txHash
- network
- chainId
- status
- blockNumber
- error
- timestamps

Có thể bỏ màn hình này nếu cần giảm scope.

---

## 10. Student Certificate List

Route:
`/student/certificates`

Chỉ gọi API của current student.

Card/table:
- certificateName
- certificateCode
- major
- issueDate
- status

Không show văn bằng `BLOCKCHAIN_FAILED` như một văn bằng hợp lệ.

---

## 11. Student Certificate Detail

Route:
`/student/certificates/:id`

Hiển thị:
- certificate info
- QR
- verify URL
- status

Actions:
- copy verify URL
- open public verify page

Không có:
- edit
- retry
- revoke

---

## 12. Public Verify

Route:
`/verify/:certificateCode`

States:

### LOADING
`Đang xác thực dữ liệu...`

### VALID
Badge:
`Văn bằng hợp lệ`

Show:
- certificateCode
- studentName
- certificateName
- major
- issueDate
- institution
- blockchain verified

### INVALID
`Không thể xác thực văn bằng`

### REVOKED
`Văn bằng đã bị thu hồi`

### NOT_FOUND
`Không tìm thấy văn bằng`

---

# Shared Components

```text
CertificateStatusBadge
BlockchainStatusBadge
CertificateQRCode
TransactionHash
CopyButton
ConfirmDialog
DataTable
Pagination
EmptyState
ErrorState
LoadingState
```

## Status mapping

Certificate:

```text
PENDING → Đang xử lý
ISSUED → Đã cấp
BLOCKCHAIN_FAILED → Blockchain lỗi
REVOKED → Đã thu hồi
```

Blockchain:

```text
NOT_SUBMITTED → Chưa gửi
SUBMITTED → Đã gửi
CONFIRMED → Đã xác nhận
FAILED → Thất bại
```

## Route Guard

```text
/admin/* → ADMIN
/student/* → STUDENT
/verify/* → PUBLIC
```

## UX rule

- destructive action phải confirm
- Retry phải disable trong lúc request
- Revoke yêu cầu nhập reason
- copy hash/tx hash/link bằng nút riêng
- loading/error/empty state rõ ràng
- không gọi Smart Contract trực tiếp từ React
- React chỉ gọi Backend REST API
