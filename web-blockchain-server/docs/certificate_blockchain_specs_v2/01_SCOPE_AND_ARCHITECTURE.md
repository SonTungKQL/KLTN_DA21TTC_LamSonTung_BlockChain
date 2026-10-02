# 01 — SCOPE & ARCHITECTURE

## 1. Bài toán

Xây dựng hệ thống quản lý và xác thực văn bằng/chứng chỉ số có Blockchain.

Blockchain chỉ lưu dấu vết xác thực/hash cần thiết. Database vẫn lưu dữ liệu nghiệp vụ đầy đủ.

## 2. Actor

### ADMIN / Nhà trường

Có quyền:
- đăng nhập
- quản lý sinh viên
- cấp văn bằng
- xem văn bằng
- retry Blockchain
- thu hồi văn bằng
- xem giao dịch Blockchain

### STUDENT

Có quyền:
- đăng nhập
- xem văn bằng của chính mình
- xem QR
- copy verify URL

Không có quyền:
- cấp bằng
- sửa bằng
- retry
- revoke

### PUBLIC / Nhà tuyển dụng

Không cần account.

Có quyền:
- mở `/verify/:certificateCode`
- xác thực văn bằng

## 3. Kiến trúc

```text
React + Vite
    |
    | REST API
    v
Backend
    |
    +---- MongoDB
    |
    +---- Ethers.js
              |
              v
      CertificateRegistry.sol
```

## 4. Module backend

```text
auth
users
students
institutions
certificates
blockchain
verification
```

## 5. Frontend

Chỉ một React app:

```text
/admin/*
/student/*
/verify/*
```

## 6. Scope chính

- Auth + RBAC
- Student CRUD tối thiểu
- Certificate issue
- Deterministic hash
- Blockchain issue
- Retry
- Public verify
- QR
- Revoke
- Transaction logs

## 7. Out of scope

Không bắt buộc:
- NFT
- DID
- multi-school production
- Ethereum mainnet
- ví riêng cho sinh viên
- payment
- notification system phức tạp
