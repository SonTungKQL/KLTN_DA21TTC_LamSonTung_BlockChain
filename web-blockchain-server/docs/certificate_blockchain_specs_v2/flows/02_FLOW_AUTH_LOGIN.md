# FLOW 02 — AUTH LOGIN

## User story
Admin hoặc Student đăng nhập trên React và được chuyển đúng khu vực theo role.

## React
Route: `/login`

UI:
- email/login
- password
- submit loading
- invalid credentials error

Success:
- ADMIN → `/admin/dashboard`
- STUDENT → `/student/certificates`

## Backend
- `POST /api/auth/login`
- validate credentials
- JWT
- return current user + role
- auth guard
- role guard

## DB
- users collection
- passwordHash
- role
- status

## Integration
React phải dùng API thật, lưu session/token theo convention repo, attach Authorization cho protected APIs.

## Tests
- admin login success
- student login success
- wrong password
- inactive user
- protected route unauthorized
- role redirect frontend
