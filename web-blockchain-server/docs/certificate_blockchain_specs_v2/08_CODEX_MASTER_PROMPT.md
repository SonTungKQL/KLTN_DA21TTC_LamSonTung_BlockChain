# 08 — CODEX MASTER PROMPT / LEGACY REFERENCE

Cách triển khai mới không còn chạy theo layer/phase riêng lẻ.

Hãy dùng:
- `09_AI_END_TO_END_FLOW_PROTOCOL.md`
- thư mục `flows/`
- `10_CODEX_START_PROMPT.md`

Các file `01` đến `07` vẫn là đặc tả/reference kỹ thuật, nhưng việc sửa code phải thực hiện theo **vertical end-to-end flow**.

Quy tắc cốt lõi:

```text
1 FLOW
= React UI
→ API client
→ Backend route/controller
→ validation/auth
→ service
→ DB
→ Blockchain nếu có
→ response
→ React state/UI
→ tests
```

Không hoàn thành theo kiểu "backend xong, frontend làm sau".
