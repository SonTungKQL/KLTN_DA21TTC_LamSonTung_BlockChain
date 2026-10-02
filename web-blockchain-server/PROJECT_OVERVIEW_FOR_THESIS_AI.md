# Hồ sơ tổng quan dự án — Certificate Chain

> **Mục đích tài liệu:** đây là nguồn ngữ cảnh thống nhất để một AI có thể hiểu hệ thống và viết báo cáo khóa luận bằng Word. Nội dung được đối chiếu với mã nguồn của hai repository `web-blockchain-server` và `web-blockchain-client` tại thời điểm tạo tài liệu. Khi viết báo cáo, không khẳng định các chức năng thuộc phần “Giới hạn” là đã hoàn thành.

## 1. Thông tin nhận diện

| Hạng mục | Nội dung |
| --- | --- |
| Tên gợi ý đề tài | **Xây dựng hệ thống quản lý và xác thực văn bằng số ứng dụng Blockchain** |
| Tên sản phẩm | Certificate Chain |
| Bài toán | Số hóa việc quản lý, cấp, tra cứu, xác thực và thu hồi văn bằng/chứng chỉ; phát hiện dữ liệu nghiệp vụ bị thay đổi bằng cách đối chiếu dấu vân tay số trên Blockchain. |
| Người dùng | Quản trị viên/cơ sở đào tạo (ADMIN), sinh viên (STUDENT), bên xác minh công khai như nhà tuyển dụng (PUBLIC). |
| Mô hình triển khai | Web client đơn trang → REST API → MongoDB và Blockchain EVM. |
| Ngôn ngữ chính | TypeScript (client/server), Solidity (smart contract). |

## 2. Vấn đề và mục tiêu

Quy trình cấp văn bằng truyền thống thường khó tra cứu, tốn thời gian xác minh và có nguy cơ bị chỉnh sửa hoặc làm giả. Dự án không đưa toàn bộ dữ liệu cá nhân lên chuỗi. Thay vào đó, MongoDB lưu dữ liệu nghiệp vụ đầy đủ; Blockchain chỉ neo `certificateCode`, `documentHash`, thời điểm cấp, địa chỉ đơn vị cấp và trạng thái thu hồi. Cách tiếp cận này giảm dữ liệu on-chain, vẫn tạo được bằng chứng kiểm tra tính toàn vẹn.

Mục tiêu chức năng:

- Quản lý tài khoản, sinh viên, cơ sở đào tạo, ngành, khóa và lớp.
- Cấp văn bằng, sinh mã văn bằng tự động và tạo hash xác định từ dữ liệu lõi.
- Gửi giao dịch cấp lên smart contract, chờ receipt rồi mới công nhận là đã cấp.
- Lưu nhật ký từng lần gửi giao dịch; hỗ trợ retry an toàn khi Blockchain lỗi.
- Xác thực công khai từ mã văn bằng hoặc QR; trả về `VALID`, `INVALID`, `REVOKED`, `NOT_FOUND`.
- Thu hồi văn bằng và phản ánh trạng thái thu hồi on-chain.
- Cổng sinh viên chỉ xem văn bằng của chính mình; dashboard quản trị có số liệu tổng hợp.

## 3. Kiến trúc tổng thể

```text
Người dùng (Admin / Student / Public)
                │ Browser, HTTPS/HTTP
                ▼
React 19 + Vite + Ant Design + React Router
                │ REST JSON + JWT Bearer
                ▼
Express 5 API (TypeScript)
 ├─ Mongoose ───────────────────────────────► MongoDB 8
 │    users, students, institutions, certificates,
 │    blockchain_transactions, verification_logs, catalogs...
 │
 └─ ethers.js ─► JSON-RPC ─► EVM/Ganache/Hardhat network
                                  │
                                  ▼
                       CertificateRegistry.sol
```

**Nguyên tắc kiến trúc:** React không gọi smart contract trực tiếp. Backend là lớp điều phối duy nhất cho nghiệp vụ, dữ liệu MongoDB, khóa ký và Blockchain. Điều này giúp kiểm soát phân quyền, che giấu private key, tập trung logging và xử lý lỗi.

## 4. Thành phần và công nghệ

| Tầng | Hiện thực |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Ant Design 6, React Router 7. |
| Backend | Node.js, Express 5, TypeScript, Zod, Mongoose 8, CORS, Swagger UI. |
| Blockchain | Solidity `^0.8.24`, Hardhat Toolbox, ethers.js v6; có cấu hình Ganache/local EVM. |
| CSDL | MongoDB; Docker Compose khởi tạo MongoDB 8. |
| Bảo mật | JWT, mật khẩu băm bằng module `password`, RBAC, kiểm tra dữ liệu Zod, tùy chọn AES-256-GCM cho payload API. |
| Tài liệu API | Swagger: `/api/docs/admin`, `/api/docs/client`; OpenAPI JSON tương ứng. |

## 5. Vai trò và quyền

| Vai trò | Được phép | Không được phép |
| --- | --- | --- |
| ADMIN | Đăng nhập; CRUD sinh viên, cơ sở, danh mục đào tạo; cấp/retry/thu hồi văn bằng; xem giao dịch, thống kê và yêu cầu tư vấn. | — |
| STUDENT | Đăng ký/đăng nhập; xem danh sách, chi tiết và QR của văn bằng thuộc tài khoản mình. | Cấp, sửa, retry hoặc thu hồi văn bằng; xem dữ liệu sinh viên khác. |
| PUBLIC | Tra cứu/xác minh văn bằng qua mã hoặc QR, không cần tài khoản. | Truy cập API quản trị hoặc thông tin quản trị. |

## 6. Dữ liệu và mô hình trạng thái

### Các collection chính

| Collection | Dữ liệu cốt lõi |
| --- | --- |
| `users` | email duy nhất, `passwordHash`, họ tên, role `ADMIN/STUDENT`, trạng thái `ACTIVE/INACTIVE`. |
| `students` | mã sinh viên duy nhất, họ tên, ngày sinh, ngành/lớp/khóa; có thể liên kết `userId`. |
| `institutions` | tên, mã duy nhất, địa chỉ, địa chỉ ví issuer Blockchain và thông tin ủy quyền issuer. |
| `majors`, `courses`, `trainingclasses` | danh mục đào tạo, liên kết với cơ sở đào tạo. |
| `certificates` | mã văn bằng, sinh viên, cơ sở, thông tin bằng, `documentHash`, trạng thái nghiệp vụ/Blockchain, hash giao dịch cấp và thu hồi, lỗi/retry/timestamps. |
| `certificate_sequences` | bộ đếm tăng nguyên tử theo `institutionCode` và năm cấp; dùng tạo mã văn bằng duy nhất theo mẫu `INSTITUTION-YYYY-000001`. |
| `blockchain_transactions` | mỗi attempt cấp hoặc thu hồi: action, network, chainId, contract, tx hash, block, trạng thái và lỗi. |
| `verification_logs` | mã/bằng liên quan, phương thức `QR/CODE/HASH`, kết quả, IP, user-agent, thời gian. |
| `consultations` | yêu cầu tư vấn từ người dùng đăng nhập và trạng thái xử lý. |

### Hai trạng thái tách biệt của văn bằng

```text
Trạng thái nghiệp vụ:
PENDING ──thành công──► ISSUED ──thu hồi thành công──► REVOKED
   │
   └──Blockchain lỗi──► BLOCKCHAIN_FAILED ──retry thành công──► ISSUED

Trạng thái giao tiếp Blockchain:
NOT_SUBMITTED → SUBMITTED → CONFIRMED
                    │
                    └──────────────► FAILED
```

Điểm quan trọng cho báo cáo: bản ghi văn bằng được tạo trước khi ghi chain và **không bị xóa khi Blockchain thất bại**. Một văn bằng chỉ hợp lệ công khai khi ở `ISSUED`, hash cục bộ khớp hash MongoDB, bản ghi on-chain tồn tại, hash on-chain trùng khớp và chưa bị thu hồi.

## 7. Cơ chế hash, QR và xác minh

`CertificateHashService` tạo `documentHash` bằng Keccak-256 (`keccak256(toUtf8Bytes(JSON.stringify(canonical)))`) từ payload đã chuẩn hóa, theo đúng thứ tự:

```ts
{
  certificateCode,
  studentCode,
  studentName,
  certificateName,
  major,
  issueDate,       // YYYY-MM-DD
  institutionCode
}
```

Chuỗi được `trim()`, ngày cấp được chuẩn hóa và thứ tự trường cố định nên hash có thể tái tạo khi xác minh. Không hash trực tiếp Mongoose document hoặc file PDF nhị phân vì metadata/thứ tự không ổn định.

QR chỉ mã hóa đường dẫn tra cứu của ứng dụng dạng:

```text
/verify/{certificateCode}?source=qr
```

QR không chứa họ tên, điểm, hash, token hay private key. Khi mở đường dẫn này trong bản demo cục bộ, frontend gọi API xác minh; backend tái tạo hash, so sánh DB và smart contract, sau đó ghi `verification_logs`.

## 8. Smart contract `CertificateRegistry.sol`

Contract lưu mapping từ `certificateCode` đến struct:

```solidity
Certificate {
  bytes32 documentHash;
  uint256 issuedAt;
  address issuer;
  bool exists;
  bool revoked;
}
```

Các hàm chính:

| Hàm | Mục đích |
| --- | --- |
| `issueCertificate(code, hash)` | Chỉ issuer được ủy quyền gọi; từ chối mã trùng hoặc hash rỗng; phát event `CertificateIssued`. |
| `getCertificate(code)` | Đọc hash, thời gian, issuer, tồn tại và thu hồi. |
| `verifyCertificate(code, hash)` | Trả `true` nếu tồn tại, hash đúng và chưa revoked. |
| `revokeCertificate(code)` | Chỉ issuer; từ chối bản ghi không tồn tại/đã thu hồi; phát `CertificateRevoked`. |
| `setIssuerAuthorization(address, authorized)` | Chỉ owner/deployer cấp hoặc rút quyền issuer. |

Contract test hiện có: cấp/xác minh thành công, từ chối cấp trùng, hash sai, phân quyền issuer, thu hồi và ủy quyền cho issuer thứ hai.

## 9. Luồng nghiệp vụ quan trọng

### 9.1 Cấp văn bằng

```text
Admin gửi dữ liệu → Backend kiểm tra JWT/ADMIN và dữ liệu
→ lấy Student + Institution, kiểm tra issuer signer của cơ sở
→ sinh certificateCode + canonical documentHash
→ tạo Certificate: PENDING / NOT_SUBMITTED
→ tạo BlockchainTransaction
→ gọi issueCertificate(code, hash)
→ lưu txHash: SUBMITTED → chờ transaction receipt
→ receipt thành công: ISSUED / CONFIRMED + blockNumber
  hoặc lỗi: BLOCKCHAIN_FAILED / FAILED + thông tin lỗi (bản ghi vẫn giữ)
```

### 9.2 Retry khi cấp thất bại (idempotency)

Chỉ nhận văn bằng `BLOCKCHAIN_FAILED`. Backend đọc chain trước: nếu mã đã tồn tại và hash trùng, đồng bộ DB thành `ISSUED` mà không gửi giao dịch mới; nếu hash khác, trả lỗi xung đột bảo mật. Nếu chưa tồn tại, backend tạo attempt mới và gửi lại giao dịch. Điều này xử lý tình huống chain đã thành công nhưng backend bị dừng trước khi cập nhật DB.

### 9.3 Thu hồi

Chỉ áp dụng cho `ISSUED`. Backend tạo transaction attempt, gọi `revokeCertificate`, chờ receipt rồi chuyển thành `REVOKED` cùng lý do, transaction hash và block. Nếu lỗi, văn bằng giữ `ISSUED`, còn attempt lỗi vẫn được lưu.

### 9.4 Xác minh công khai

```text
Nhập/quét mã → tìm DB theo certificateCode (hoặc blockchain identifier)
→ không có: NOT_FOUND
→ tái tạo hash từ dữ liệu hiện tại
→ đọc bản ghi on-chain
→ REVOKED nếu DB/chain revoked
→ VALID nếu DB=ISSUED, local hash=DB hash, chain tồn tại, chain hash=DB hash, chưa revoked
→ các trường hợp còn lại: INVALID
→ ghi log xác minh
```

## 10. API theo nhóm

Mọi response thành công dùng envelope `{"success": true, "data": ...}`. Các endpoint có bảo vệ cần `Authorization: Bearer <JWT>`.

| Nhóm | Endpoint chính |
| --- | --- |
| Nền tảng | `GET /api/health`, Swagger/OpenAPI tại `/api/docs/*`, `/api/openapi.*.json`. |
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`. |
| Sinh viên admin | `GET/POST /api/admin/students`, `GET/PATCH /api/admin/students/:id`. |
| Cơ sở | `GET/POST /api/admin/institutions`, `PATCH /:id`, `POST /:id/authorize-issuer`. |
| Danh mục | CRUD mức create/list/update cho `/api/admin/academics/majors`, `/courses`, `/classes`. |
| Văn bằng admin | `GET/POST /api/admin/certificates`, `GET /:id`, `GET /:id/verification-qr`, `POST /:id/retry-blockchain`, `POST /:id/revoke`. |
| Văn bằng sinh viên | `GET /api/student/certificates`, `GET /:id`, `GET /:id/verification-qr`. |
| Blockchain/điều hành | `GET /api/admin/blockchain-transactions`, `GET /api/admin/statistics/overview`. |
| Công khai | `GET /api/public/certificates/verify/:certificateCode?method=QR|CODE|HASH`. |
| Tư vấn | `POST /api/consultations` (người dùng đăng nhập), `GET/PATCH /api/admin/consultations`. |

## 11. Giao diện frontend và route

- Public: trang chủ, tính năng, quy trình, liên hệ, tra cứu thủ công `/verify`, kết quả `/verify/:certificateCode`.
- Xác thực: `/login`, `/register` (đăng ký vai trò STUDENT).
- Admin (RouteGuard `ADMIN`): dashboard, sinh viên, cơ sở đào tạo, ngành/khóa/lớp, cấp/danh sách/chi tiết văn bằng, nhật ký giao dịch, tư vấn.
- Student (RouteGuard `STUDENT`): danh sách và chi tiết văn bằng cá nhân.
- Dashboard có tổng số thực thể, trạng thái văn bằng/giao dịch, xu hướng 6 tháng, phân bố theo cơ sở/ngành và giao dịch gần nhất.

Frontend lưu phiên JWT trong `localStorage`, tự xóa phiên khi API trả `401 UNAUTHORIZED`. Nếu bật cấu hình mã hóa, client và server trao đổi body JSON bằng AES-256-GCM; endpoint health/Swagger/OpenAPI được để plaintext phục vụ vận hành.

## 12. Cấu trúc mã nguồn

```text
web-blockchain-server/
├─ contracts/CertificateRegistry.sol       Smart contract
├─ test/CertificateRegistry.ts             Test contract
├─ scripts/deploy.ts                       Deploy Hardhat
├─ src/app.ts, main.ts                     Khởi tạo Express/API
├─ src/modules/                            auth, students, certificates, blockchain,
│                                          verification, institutions, academics, statistics...
├─ src/blockchain/                         ABI và read client
├─ src/middlewares/                        JWT/RBAC, mã hóa payload
├─ src/docs/openapi.ts                     Tài liệu Swagger
└─ docker-compose.yml                      MongoDB

web-blockchain-client/
├─ src/App.tsx                             Router và route guards
├─ src/api/client.ts                       REST client + mã hóa tùy chọn
├─ src/pages/admin|student|public/         Các màn hình theo vai trò
├─ src/components/                         QR, badge trạng thái, guard...
├─ src/layouts/                            Khung public/admin/student
└─ src/types/api.ts                        Kiểu dữ liệu API chia sẻ ở client
```

## 13. Cài đặt, cấu hình và kiểm thử

1. Backend: sao chép `.env.example` thành `.env`; cấu hình MongoDB, JWT, đường dẫn ứng dụng, kết nối Blockchain, chain ID, địa chỉ contract và khóa ký. Không đưa private key/secret vào báo cáo hoặc Git.
2. Chạy MongoDB bằng `docker compose up -d`; cài dependency `npm install`.
3. Chạy mạng EVM cục bộ (Hardhat/Ganache), deploy `npm run contract:deploy:local`, điền `CERTIFICATE_CONTRACT_ADDRESS`.
4. Backend: `npm run dev`; seed demo: `npm run seed`. Tài khoản seed chỉ dành cho local development.
5. Client: cấu hình biến môi trường kết nối API cục bộ, `npm install`, `npm run dev`.
6. Kiểm thử: server `npm run lint`, `npm run test:unit`, `npm run test:contract`; client `npm run lint`, `npm run build`.

## 14. Điểm mạnh, giới hạn và hướng phát triển

### Điểm mạnh

- Bằng chứng toàn vẹn tách khỏi dữ liệu nghiệp vụ: sửa dữ liệu DB sẽ làm lệch hash khi verify.
- Phân quyền rõ theo ba nhóm người dùng; private key không đi qua browser.
- State machine và transaction log giúp minh bạch tiến trình cấp/thu hồi.
- Retry có kiểm tra on-chain trước, hạn chế cấp trùng khi có lỗi đồng bộ.
- QR gọn, không lộ dữ liệu nhạy cảm và luôn truy vấn trạng thái mới nhất.

### Giới hạn cần nêu trung thực

- Demo và kiểm thử chỉ thực hiện trong môi trường cục bộ; không thuộc phạm vi triển khai vận hành thực tế hoặc công khai.
- Blockchain chứng minh tính toàn vẹn khi đối chiếu, không tự ngăn dữ liệu ngoài chuỗi bị sửa.
- Hash hiện là hash dữ liệu lõi, không phải hash file PDF nhị phân; `documentUrl` là tùy chọn.
- API transport encryption dùng shared secret ở frontend chỉ phù hợp mô hình minh họa/kiểm soát môi trường; HTTPS, quản lý secret và cơ chế bảo mật production vẫn cần thiết.
- Chưa thấy test end-to-end tự động toàn bộ giao diện/API trong mã nguồn; test contract và một số unit test backend đã có.

### Hướng phát triển hợp lý

- Version hóa canonical payload/hash để vẫn xác minh được văn bằng cũ khi thay đổi schema.
- Lưu file văn bằng ở object storage, hash file hoặc Merkle proof tùy yêu cầu.
- Queue/worker cho giao dịch Blockchain, retry có backoff, monitoring và cảnh báo.
- Bổ sung cơ chế giám sát giao dịch, audit smart contract, rate limiting và CAPTCHA nếu mở rộng phạm vi vận hành sau này.
- Bổ sung test tích hợp/E2E, CI/CD, HTTPS, quản lý secret và sao lưu/phục hồi dữ liệu.
- Bổ sung đa tổ chức theo mô hình issuer được ủy quyền và quy trình quản trị khóa an toàn.

## 15. Các hạng mục đã bổ sung và trạng thái triển khai

Phần này là nhật ký phạm vi để AI/báo cáo nhận biết các chức năng được bổ sung sau các luồng cấp, xác minh, retry và thu hồi cốt lõi. Các hạng mục dưới đây đều đã có mã nguồn ở cả API hoặc giao diện tương ứng; không phải chỉ là đề xuất.

| Hạng mục bổ sung | Hiện thực đang có | Ý nghĩa trong báo cáo |
| --- | --- | --- |
| Danh mục đào tạo | ADMIN quản lý ngành (`majors`), khóa (`courses`) và lớp (`trainingclasses`) qua các API create/list/update; hồ sơ sinh viên liên kết bằng các khóa tham chiếu, đồng thời lưu các trường hiển thị `major`, `course`, `className`. | Làm rõ dữ liệu đầu vào của văn bằng và cách chuẩn hóa thông tin đào tạo. |
| Quản lý cơ sở đào tạo và issuer | Mỗi cơ sở có mã duy nhất, địa chỉ ví issuer, thời điểm/hash giao dịch ủy quyền. Khi thay đổi địa chỉ ví, thông tin ủy quyền trước đó bị xóa để tránh hiểu nhầm là còn hiệu lực. Contract owner dùng `setIssuerAuthorization` để cấp/rút quyền. | Minh họa mô hình nhiều đơn vị cấp bằng và sự tách biệt giữa dữ liệu quản trị off-chain với quyền ghi on-chain. |
| Sinh mã văn bằng tuần tự | `CertificateCodeService` tạo mã theo mẫu `INSTITUTION-YYYY-000001`, dùng collection `certificate_sequences` và thao tác tăng nguyên tử; có xử lý lại một lần khi va chạm unique index lúc khởi tạo. | Nêu được cơ chế định danh ổn định, tránh trùng mã khi cấp đồng thời. |
| Dashboard thống kê | Endpoint `GET /api/admin/statistics/overview` tổng hợp số lượng sinh viên/cơ sở/danh mục/văn bằng, phân bố trạng thái văn bằng/giao dịch/tư vấn, xu hướng sáu tháng, phân bố theo cơ sở/ngành và sáu giao dịch gần nhất. | Là chức năng hỗ trợ quản trị; các số liệu là dữ liệu tổng hợp thời điểm truy vấn, không phải chỉ số hiệu năng của hệ thống. |
| Tiếp nhận tư vấn | Người dùng đã đăng nhập tạo yêu cầu tư vấn; ADMIN xem danh sách có phân trang/lọc trạng thái và chuyển `NEW` → `CONTACTED` → `CLOSED`. Yêu cầu lưu người tạo, email, điện thoại, tổ chức, nội dung và thời gian. | Bổ sung quy trình hỗ trợ người dùng, tách biệt với nghiệp vụ xác minh công khai. |
| Tài liệu vận hành API | Swagger được tách thành tài liệu Admin và Client; `/api/docs` chuyển tới Admin, còn các OpenAPI JSON là `/api/openapi.admin.json` và `/api/openapi.client.json`. | Có thể dùng làm phụ lục API hoặc căn cứ đối chiếu khi viết phần cài đặt. |

### Cập nhật mô hình dữ liệu

- Có thêm collection `certificate_sequences` để sinh số thứ tự theo `institutionCode` và năm cấp.
- `students` liên kết tới `institutions`, `majors`, `courses`, `trainingclasses`; các trường tên hiển thị vẫn được giữ để phục vụ nghiệp vụ và dữ liệu đã có.
- `institutions` có `blockchainIssuerAddress`, `issuerAuthorizedAt`, `issuerAuthorizationTransactionHash` để theo dõi quá trình cấp quyền issuer.
- `consultations` có trạng thái xử lý `NEW`, `CONTACTED`, `CLOSED`; đây là dữ liệu nghiệp vụ hỗ trợ, không được đưa lên Blockchain.

### Lưu ý chính xác khi mô tả API

- Toàn bộ đường dẫn trong bảng API ở mục 10 là đường dẫn đầy đủ theo prefix đã nêu. Ví dụ cập nhật cơ sở là `PATCH /api/admin/institutions/:id`, không phải `PATCH /:id` độc lập.
- `POST /api/consultations` yêu cầu JWT của người dùng đã đăng nhập; `GET/PATCH /api/admin/consultations` chỉ dành cho ADMIN.
- Các endpoint danh mục đào tạo và thống kê đều yêu cầu JWT cùng vai trò ADMIN.
- API công khai xác minh vẫn không cần JWT; tham số `method` dùng để ghi nhận nguồn xác minh như `QR`, `CODE` hoặc `HASH`.

## 16. Khung viết báo cáo Word đề xuất cho AI

AI nên dùng cấu trúc sau, viết theo văn phong học thuật tiếng Việt và chỉ dựa trên các phần đã triển khai ở trên:

1. **Mở đầu:** lý do chọn đề tài, vấn đề xác thực văn bằng, mục tiêu, đối tượng/phạm vi, phương pháp.
2. **Cơ sở lý thuyết:** Blockchain/EVM, smart contract, hash Keccak-256, QR, REST API, JWT/RBAC, MongoDB; giải thích vai trò từng công nghệ trong đề tài.
3. **Phân tích và thiết kế:** actor/use case, kiến trúc 3 tầng, thiết kế dữ liệu, state machine, sequence diagram cho cấp–retry–verify–revoke, thiết kế contract và API.
4. **Cài đặt hệ thống:** trình bày backend, frontend, contract, cơ chế canonical hash, QR, phân quyền và xử lý lỗi; chèn ảnh giao diện/chạy thử nếu có.
5. **Kiểm thử và đánh giá:** trình bày test case cấp thành công, lỗi RPC, retry/idempotency, trùng mã, verify hợp lệ/sai/thu hồi/không tìm thấy, phân quyền; đánh giá điểm mạnh và giới hạn thực tế.
6. **Kết luận và hướng phát triển:** tóm tắt kết quả, đóng góp, giới hạn và các hướng ở mục 14.

### Prompt gợi ý để tạo báo cáo

```text
Hãy viết báo cáo khóa luận tốt nghiệp bằng tiếng Việt về đề tài
“Xây dựng hệ thống quản lý và xác thực văn bằng số ứng dụng Blockchain”.
Dùng tài liệu PROJECT_OVERVIEW_FOR_THESIS_AI.md làm nguồn sự thật kỹ thuật.
Viết theo bố cục 6 chương: Mở đầu, Cơ sở lý thuyết, Phân tích thiết kế,
Cài đặt, Kiểm thử đánh giá, Kết luận hướng phát triển. Phân biệt rõ chức năng
đã triển khai và hướng phát triển; không bịa số liệu, kết quả test, triển khai
triển khai vận hành thực tế hoặc tính năng không có trong tài liệu. Đề xuất vị trí cần chèn sơ đồ,
ảnh giao diện và bảng test case. Văn phong học thuật, có tiêu đề, bảng biểu,
và nội dung có thể chuyển trực tiếp sang Word.
```
