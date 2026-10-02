# FLOW 04 — ISSUE CERTIFICATE END-TO-END

## Đây là flow quan trọng nhất

## React
Route: `/admin/certificates/create`

Form:
- student
- certificateCode
- certificateName
- degreeType
- major
- classification
- issueDate
- institution
- mã văn bằng chỉ hiển thị preview; admin không nhập trực tiếp

Submit:
```text
Admin bấm Cấp văn bằng
→ disable submit
→ hiển thị màn hình xác nhận thông tin cấp phát
→ gọi API
→ hiển thị processing
→ điều hướng detail
→ show ISSUED hoặc BLOCKCHAIN_FAILED
```

## Backend API
`POST /api/admin/certificates`

Flow bắt buộc:
```text
Auth/RBAC
→ validate + chuẩn hóa mã văn bằng thành chữ hoa
→ check student/institution/duplicate
→ tạo mã `{MÃ_TRƯỜNG}-{NĂM}-{SEQUENCE}` bằng bộ đếm nguyên tử
→ DB create PENDING
→ canonical hash
→ save documentHash
→ create blockchain transaction attempt
→ contract.issueCertificate
→ nhận tx.hash
→ save tx.hash + SUBMITTED
→ await receipt
├─ success → ISSUED + CONFIRMED + blockNumber
└─ fail → BLOCKCHAIN_FAILED + FAILED + error
```

## Blockchain
Dùng `CertificateRegistry.issueCertificate`.

### Nhiều cơ sở đào tạo

- Owner Smart Contract gọi `setIssuerAuthorization(address, true)` để cấp quyền cho ví của từng cơ sở.
- Admin gọi `POST /api/admin/institutions/:id/authorize-issuer` sau khi lưu `blockchainIssuerAddress`.
- Cấu hình `BLOCKCHAIN_ISSUER_PRIVATE_KEYS` là JSON map `institutionCode -> private key`; backend chọn signer theo cơ sở khi phát hành.
- Contract hiện hữu phải được deploy lại sau khi bổ sung cơ chế issuer.

Không được:
- Blockchain trước DB
- delete certificate khi fail
- ISSUED ngay khi mới có txHash

## React detail result
Sau response phải thấy đúng:
- status
- blockchainStatus
- hash
- transactionHash nếu có
- blockNumber khi confirmed
- error khi failed

## Tests
- success
- RPC unavailable
- revert
- duplicate code
- unauthorized
- frontend submit/loading/error
- người dùng để trống URL tài liệu vẫn cấp được
- hai yêu cầu cùng mã văn bằng chỉ có một yêu cầu được tạo
- hai yêu cầu cấp cùng cơ sở/năm phải nhận sequence khác nhau

## Quy tắc mã văn bằng

Backend tự sinh mã từ mã cơ sở đào tạo, năm trong `issueDate` và sequence sáu chữ số:

```text
TVU-2026-000001
TVU-2026-000002
```

Sequence tăng độc lập theo từng cặp `{institutionCode, issueYear}` và không tái sử dụng khi giao dịch blockchain thất bại, vì văn bằng vẫn được giữ để retry.
