# 11 — ĐỊNH DANH VĂN BẰNG BẰNG HASH VÀ XÁC MINH QUA QR CODE

## 1. Mục đích

Mỗi văn bằng cần có một mã nhận diện riêng để tra cứu và một dấu vân tay mật mã để kiểm tra tính toàn vẹn. QR Code cung cấp đường dẫn quét nhanh đến màn hình xác minh công khai; QR **không** chứa dữ liệu học tập hoặc hash của toàn bộ văn bằng.

Mô hình này giúp bên xác minh biết được:

- Văn bằng có được cấp trong hệ thống hay không.
- Dữ liệu văn bằng hiện tại có còn đúng với dữ liệu tại thời điểm cấp hay không.
- Hash được lưu trên blockchain có trùng với hash trong cơ sở dữ liệu hay không.
- Văn bằng có bị thu hồi hay không.

## 2. Vai trò của các định danh

| Thành phần | Vai trò | Tính chất |
| --- | --- | --- |
| `certificateCode` | Mã định danh nghiệp vụ, ví dụ `TVU-2026-000001` | Duy nhất trong cơ sở dữ liệu; dùng để tra cứu và tạo URL QR. |
| `documentHash` | Dấu vân tay của dữ liệu lõi trên văn bằng | Sinh xác định từ payload chuẩn hoá; thay đổi dữ liệu đầu vào sẽ làm hash thay đổi. |
| `transactionHash` | Mã giao dịch blockchain | Dùng để truy vết lần ghi/thu hồi; không thay thế mã văn bằng. |

`certificateCode` phải được áp dụng unique index ở cơ sở dữ liệu. `documentHash` không phải số thứ tự và không nên được diễn giải là “duy nhất tuyệt đối”: về mặt mật mã vẫn có khả năng va chạm lý thuyết, dù Keccak-256 có mức độ an toàn phù hợp cho mục đích nhận diện toàn vẹn.

## 3. Cơ chế tạo hash hiện tại

`CertificateHashService` tạo hash bằng `keccak256(toUtf8Bytes(JSON.stringify(canonical)))`. Payload canonical hiện tại có thứ tự trường cố định:

```ts
{
  certificateCode,
  studentCode,
  studentName,
  certificateName,
  major,
  issueDate,
  institutionCode
}
```

Quy tắc chuẩn hoá trước khi băm:

1. Các chuỗi được `trim()` để loại khoảng trắng thừa ở đầu/cuối.
2. `issueDate` được quy về chuỗi `YYYY-MM-DD`.
3. Object canonical được tự tạo theo đúng thứ tự trường nêu trên, sau đó mới `JSON.stringify`.
4. Mã băm Keccak-256 dạng `0x...` được lưu vào `Certificate.documentHash` và gửi lên smart contract.

Không băm trực tiếp Mongoose document hoặc dữ liệu PDF nhị phân. Các đối tượng đó có thể chứa trường kỹ thuật, metadata hoặc thứ tự không ổn định, làm kết quả không thể tái tạo tin cậy khi kiểm tra lại.

Ví dụ, chỉ cần sửa `major` từ `Công nghệ thông tin` thành `Kỹ thuật phần mềm` thì canonical payload thay đổi và `documentHash` mới sẽ khác hash đã neo trên blockchain. Do đó, bản sửa sẽ bị phát hiện khi xác minh.

## 4. Liên kết hash với blockchain

Luồng cấp văn bằng:

```text
Thông tin văn bằng hợp lệ
        ↓
Canonicalize + Keccak-256
        ↓
Lưu documentHash trong MongoDB
        ↓
issueCertificate(certificateCode, documentHash)
        ↓
Chờ transaction receipt thành công
        ↓
Đánh dấu ISSUED / CONFIRMED
```

Blockchain giữ cặp `certificateCode` và `documentHash` cùng trạng thái thu hồi. Vì dữ liệu on-chain có tính bất biến theo lịch sử giao dịch, một người sửa dữ liệu MongoDB hoặc giao diện hiển thị không thể làm hash đã ghi trên chain tự đổi theo. Tuy nhiên, blockchain không tự ngăn sửa dữ liệu ngoài chuỗi; nó cung cấp bằng chứng để **phát hiện** sửa đổi khi đối chiếu.

## 5. Nội dung QR Code

Nội dung QR bắt buộc theo định dạng:

```text
{CLIENT_URL}/verify/{certificateCode}?source=qr
```

Ví dụ:

```text
https://vanbang.example.edu.vn/verify/TVU-2026-000001?source=qr
```

Khi quét QR, thiết bị mở route frontend `/verify/:certificateCode`. Frontend gọi API công khai:

```http
GET /api/public/certificates/verify/:certificateCode?method=QR
```

Không đưa họ tên, ngày sinh, điểm số, `documentHash`, token đăng nhập, private key hoặc dữ liệu cá nhân khác vào QR. Cách này giữ QR gọn, giảm lộ thông tin khi ảnh QR bị chia sẻ và cho phép trạng thái thu hồi được kiểm tra theo thời gian thực.

## 6. Luồng xác minh sau khi quét

```text
Quét QR
  ↓
Mở /verify/{certificateCode}
  ↓
GET API xác minh công khai
  ↓
Tìm văn bằng theo certificateCode
  ↓
Tái tạo localHash từ dữ liệu hiện có
  ↓
So sánh localHash ↔ documentHash trong DB
  ↓
Đọc certificateCode + documentHash từ blockchain
  ↓
So sánh hash DB ↔ hash on-chain, kiểm tra revoked
  ↓
Trả trạng thái và ghi verification_logs
```

Kết quả được hiểu như sau:

| Kết quả | Điều kiện chính | Hiển thị cho người quét |
| --- | --- | --- |
| `VALID` | DB tồn tại, trạng thái `ISSUED`, hash tái tạo khớp DB, bản ghi on-chain tồn tại, hash on-chain khớp DB và chưa thu hồi | Văn bằng hợp lệ. |
| `REVOKED` | DB hoặc blockchain cho biết văn bằng đã thu hồi | Văn bằng đã bị thu hồi; không dùng để xác nhận. |
| `INVALID` | Hash không khớp, không truy vấn/đối chiếu chain được, hoặc chưa ở trạng thái `ISSUED` | Không thể xác nhận tính hợp lệ. |
| `NOT_FOUND` | Không tìm thấy `certificateCode` | Không tồn tại trong hệ thống cấp bằng. |

Việc nhận URL QR không đủ để kết luận văn bằng hợp lệ: chỉ màn hình/API xác minh với kết quả `VALID` mới là căn cứ xác thực.

## 7. Quy tắc an toàn và vận hành

1. Chỉ sinh/in QR sau khi văn bằng đạt `ISSUED` và `blockchainStatus=CONFIRMED`.
2. QR phải dùng tên miền HTTPS chính thức. Client nên cảnh báo hoặc từ chối URL quét được không thuộc tên miền đã cấu hình để hạn chế QR giả mạo dẫn tới phishing.
3. Không dùng QR tĩnh để ghi trạng thái hợp lệ. QR chỉ là link; trạng thái phải được lấy lại từ API ở mỗi lần quét để phát hiện thu hồi.
4. `certificateCode` nên khó đoán nếu cần giảm khả năng dò quét hàng loạt. Đây không phải biện pháp kiểm soát truy cập: API công khai chỉ được trả về dữ liệu tối thiểu cần thiết.
5. Mọi lần xác minh cần ghi `certificateCode`, phương thức (`QR` hoặc `CODE`), thời điểm, IP và user-agent theo chính sách bảo vệ dữ liệu cá nhân.
6. Khi thay đổi thuật toán, trường dữ liệu hoặc chuẩn hoá hash, phải version hoá payload (ví dụ `hashVersion: 1`) và vẫn hỗ trợ xác minh các văn bằng cũ. Không thay đổi âm thầm thuật toán của dữ liệu đã cấp.

## 8. Triển khai full flow frontend — backend

Backend là nguồn duy nhất tạo nội dung QR. Khi văn bằng có trạng thái `ISSUED` hoặc `REVOKED`, người dùng có quyền sở hữu gọi một trong hai API:

```http
GET /api/admin/certificates/:id/verification-qr
GET /api/student/certificates/:id/verification-qr
```

Response trả về payload để frontend vẽ QR:

```json
{
  "certificateCode": "TVU-2026-000001",
  "verificationUrl": "https://vanbang.example.edu.vn/verify/TVU-2026-000001?source=qr",
  "verificationMethod": "QR",
  "status": "ISSUED"
}
```

Frontend dùng `QRCode` của Ant Design để mã hoá đúng `verificationUrl`; không tự ghép URL bằng `window.location.origin`. Người quét mở route public, route này gọi API verify với `method=QR`, vì vậy `verification_logs.method` được lưu là `QR`. Nếu người dùng truy cập thủ công không có `source=qr`, frontend gửi `method=CODE`.

QR vẫn hiển thị được sau khi thu hồi để người quét nhận kết quả `REVOKED`, thay vì giữ một QR cũ có thể gây hiểu nhầm là còn hợp lệ.
