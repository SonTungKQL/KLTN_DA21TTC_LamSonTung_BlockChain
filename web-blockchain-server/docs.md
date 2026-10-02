# HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN CERTIFICATE BLOCKCHAIN Ở LOCAL

Tài liệu này hướng dẫn trình tự khởi động hệ thống cấp và xác minh văn bằng sử dụng **Node.js + MongoDB + Ganache + Smart Contract** trên môi trường local.

---

## 1. Thành phần cần chạy

Khi chạy local, hệ thống gồm các thành phần chính:

1. **MongoDB** – lưu dữ liệu ứng dụng.
2. **Ganache** – blockchain Ethereum local.
3. **Smart Contract** – contract cấp/xác minh văn bằng được deploy lên Ganache.
4. **Backend** – Node.js server.
5. **Frontend** – ứng dụng giao diện người dùng (nếu cần chạy).

> Nên khởi động theo đúng thứ tự: **MongoDB → Ganache → Deploy Contract (khi cần) → Backend → Frontend**.

---

## 2. Bước 1 – Khởi động MongoDB

Đảm bảo MongoDB Server đã được cài đặt và đang chạy.

Backend hiện kết nối MongoDB bằng cấu hình:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=certificate-blockchain
```

Có thể kiểm tra service MongoDB trên Windows bằng PowerShell:

```powershell
Get-Service MongoDB
```

Nếu trạng thái là:

```text
Running
```

thì MongoDB đã hoạt động.

Nếu service chưa chạy:

```powershell
Start-Service MongoDB
```

Nếu MongoDB không được cài dưới dạng Windows Service thì khởi động MongoDB theo cách cài đặt tương ứng trước khi chạy backend.

---

## 3. Bước 2 – Khởi động Ganache

Mở một terminal riêng và chạy:

```powershell
ganache
```

Khi Ganache chạy thành công sẽ xuất hiện:

```text
RPC Listening on 127.0.0.1:8545
```

Ví dụ thông tin blockchain local:

```text
RPC URL:  http://127.0.0.1:8545
Chain ID: 1337
```

**Không đóng terminal Ganache trong lúc sử dụng hệ thống.**

Cảnh báo dạng:

```text
This version of µWS is not compatible with your Node.js build
Falling back to a NodeJS implementation
```

không ngăn Ganache chạy. Nếu cuối output vẫn có:

```text
RPC Listening on 127.0.0.1:8545
```

thì Ganache đang hoạt động.

---

## 4. Bước 3 – Kiểm tra file `.env` của Backend

Trong thư mục backend:

```text
web-blockchain-server
```

đảm bảo có file `.env`.

Cấu hình local mẫu:

```env
NODE_ENV=development
PORT=5001

MONGODB_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=certificate-blockchain

CLIENT_URL=http://localhost:3001

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=1337

CERTIFICATE_CONTRACT_ADDRESS=
BLOCKCHAIN_PRIVATE_KEY=<GANACHE_PRIVATE_KEY>

BLOCKCHAIN_ISSUER_PRIVATE_KEYS=

JWT_SECRET=<YOUR_LOCAL_JWT_SECRET>
JWT_EXPIRES_IN_SECONDS=86400

API_ENCRYPTION_ENABLED=false
API_ENCRYPTION_KEY=<YOUR_LOCAL_ENCRYPTION_KEY>
```

### Lưu ý

- `BLOCKCHAIN_CHAIN_ID` phải trùng với Chain ID mà Ganache đang chạy.
- `BLOCKCHAIN_PRIVATE_KEY` sử dụng private key của một account Ganache dùng để deploy/gửi transaction.
- Không commit `.env` lên Git.
- Không sử dụng private key của ví thật cho môi trường local.

Trong `.gitignore` nên có:

```gitignore
.env
.env.*
!.env.example
```

---

## 5. Bước 4 – Deploy Smart Contract

### Khi nào cần deploy?

Cần deploy contract khi:

- Chạy project blockchain lần đầu.
- Ganache đã bị reset và blockchain cũ không còn.
- Smart Contract vừa được thay đổi.
- `CERTIFICATE_CONTRACT_ADDRESS` chưa có.
- Contract address hiện tại không tồn tại trên blockchain local đang chạy.

Mở **terminal mới**, không dùng terminal đang chạy Ganache.

Đi tới backend:

```powershell
cd "D:\KHÓA LUẬN TỐT NGHIỆP\web-blockchain-server"
```

Sau đó chạy:

```powershell
npm run contract:deploy:local
```

Sau khi deploy thành công, terminal sẽ trả về địa chỉ contract dạng:

```text
0x...
```

Copy địa chỉ contract vừa deploy và cập nhật:

```env
CERTIFICATE_CONTRACT_ADDRESS=0x...
```

> Nếu contract đã được deploy trên chính blockchain Ganache hiện tại và địa chỉ trong `.env` vẫn hợp lệ thì **không cần deploy lại mỗi lần chạy backend**.

---

## 6. Bước 5 – Khởi động Backend

Mở một terminal mới:

```powershell
cd "D:\KHÓA LUẬN TỐT NGHIỆP\web-blockchain-server"
```

Nếu là lần đầu clone/cài project:

```powershell
npm install
```

Sau đó chạy backend:

```powershell
npm run dev
```

Backend được cấu hình:

```text
PORT=5001
```

nên API local sẽ chạy tại:

```text
http://localhost:5001
```

Giữ terminal backend mở trong quá trình sử dụng hệ thống.

---

## 7. Bước 6 – Khởi động Frontend

Mở thêm một terminal mới và di chuyển vào thư mục frontend:

```powershell
cd "<đường-dẫn-frontend>"
```

Nếu chưa cài dependencies:

```powershell
npm install
```

Sau đó chạy:

```powershell
npm run dev
```

Theo cấu hình backend:

```env
CLIENT_URL=http://localhost:3001
```

frontend dự kiến chạy tại:

```text
http://localhost:3001
```

Nếu frontend chạy ở port khác, cần cập nhật `CLIENT_URL` và cấu hình API/CORS tương ứng.

---

# Trình tự khởi động nhanh

Mỗi lần muốn chạy project local, thực hiện:

### Terminal 1 – Ganache

```powershell
ganache
```

Chờ:

```text
RPC Listening on 127.0.0.1:8545
```

### Terminal 2 – Backend

```powershell
cd "D:\KHÓA LUẬN TỐT NGHIỆP\web-blockchain-server"
npm run dev
```

### Terminal 3 – Frontend

```powershell
cd "<đường-dẫn-frontend>"
npm run dev
```

MongoDB phải đang chạy trước hoặc trong thời gian backend hoạt động.

---

# Khi chạy lần đầu hoặc Ganache bị reset

Trình tự sẽ là:

```text
1. Khởi động MongoDB
        ↓
2. Chạy Ganache
        ↓
3. Kiểm tra .env
        ↓
4. Deploy Smart Contract
   npm run contract:deploy:local
        ↓
5. Copy Contract Address
        ↓
6. Cập nhật CERTIFICATE_CONTRACT_ADDRESS trong .env
        ↓
7. Chạy Backend
   npm run dev
        ↓
8. Chạy Frontend
   npm run dev
        ↓
9. Truy cập hệ thống
```

---

# Khi chạy lại project hằng ngày

Nếu Ganache vẫn sử dụng đúng blockchain/contract trước đó:

```text
MongoDB
   ↓
Ganache
   ↓
Backend: npm run dev
   ↓
Frontend: npm run dev
```

Không cần deploy lại Smart Contract.

---

## Kiểm tra nhanh khi hệ thống không chạy

### Backend báo lỗi MongoDB

Kiểm tra:

```powershell
Get-Service MongoDB
```

và:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
```

### Backend không kết nối được blockchain

Kiểm tra Ganache còn chạy và có:

```text
RPC Listening on 127.0.0.1:8545
```

Đồng thời kiểm tra:

```env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=1337
```

### Lỗi contract không tồn tại / gọi contract thất bại

Có khả năng Ganache đã tạo blockchain mới nhưng `.env` vẫn chứa địa chỉ contract cũ.

Deploy lại:

```powershell
npm run contract:deploy:local
```

rồi cập nhật:

```env
CERTIFICATE_CONTRACT_ADDRESS=<địa chỉ mới>
```

và restart backend.

### Private key không hợp lệ hoặc account không có ETH

Kiểm tra `BLOCKCHAIN_PRIVATE_KEY` có thuộc danh sách account của phiên Ganache hiện tại hay không.

---

## Checklist trước khi test

- [ ] MongoDB đang chạy.
- [ ] Ganache đang chạy tại `127.0.0.1:8545`.
- [ ] Ganache Chain ID trùng `.env`.
- [ ] `BLOCKCHAIN_PRIVATE_KEY` thuộc account Ganache hiện tại.
- [ ] Smart Contract đã được deploy.
- [ ] `CERTIFICATE_CONTRACT_ADDRESS` đã được cập nhật.
- [ ] Backend đang chạy bằng `npm run dev`.
- [ ] Frontend đang chạy.
- [ ] `.env` không được commit lên Git.

---

## Tóm tắt

**Chạy bình thường:**

```text
MongoDB → ganache → Backend (npm run dev) → Frontend (npm run dev)
```

**Lần đầu / Ganache reset / contract thay đổi:**

```text
MongoDB
→ ganache
→ npm run contract:deploy:local
→ cập nhật CERTIFICATE_CONTRACT_ADDRESS
→ npm run dev (Backend)
→ npm run dev (Frontend)
```
