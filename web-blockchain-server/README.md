# Certificate Blockchain API

## Local setup

1. Copy `.env.example` to `.env`. Set `MONGODB_URI` to the Mongo server URI and `MONGO_DB_NAME` to the database name.
2. Start MongoDB with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Start Ganache with its RPC server at `http://127.0.0.1:7545`.
5. Set `BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545` and the matching `BLOCKCHAIN_CHAIN_ID` in `.env`, then run `npm run contract:deploy:local` and put the printed address in `CERTIFICATE_CONTRACT_ADDRESS`.
6. Run `npm run dev` (Nodemon tự khởi động lại backend khi file trong `src` thay đổi).
7. For a local admin and institution, run `npm run seed` (admin: `admin@example.com` / `Admin@123`; change it outside local development).

The foundation health endpoint is `GET /api/health`.

Swagger tiếng Việt: `GET /api/docs/admin` (quản trị) và `GET /api/docs/client` (client/sinh viên). OpenAPI tương ứng là `/api/openapi.admin.json` và `/api/openapi.client.json`; `/api/docs` chuyển đến tài liệu Admin.

## API transport encryption

Set `API_ENCRYPTION_ENABLED=true` and an `API_ENCRYPTION_KEY` to enable AES-256-GCM transport encryption for JSON API responses and non-GET JSON request bodies. The client sends `{ "encryptedData": "base64" }`; the base64 value consists of a 12-byte IV, 16-byte authentication tag, then ciphertext. Responses use the same envelope and include `X-Payload-Encrypted: true`. Health and Swagger endpoints remain plaintext for operational access.
web-blockchain code đồ án thue
