# FLOW 03 — STUDENT MANAGEMENT

## User story
Admin tạo và quản lý thông tin sinh viên để làm dữ liệu đầu vào cấp văn bằng.

## React
- `/admin/students`
- `/admin/students/create`
- `/admin/students/:id`
- `/admin/students/:id/edit`

Features:
- list
- search
- pagination
- create
- view detail
- edit thông tin hồ sơ sinh viên

## Backend
- GET `/api/admin/students`
- POST `/api/admin/students`
- GET `/api/admin/students/:id`
- PATCH `/api/admin/students/:id` nếu edit
- ADMIN only

## DB
`students`
- unique studentCode
- optional userId

## Integration
Sau khi create thành công, React chuyển detail/list và hiển thị data trả từ API, không dùng mock data.

## Tests
- create success
- duplicate studentCode
- validation
- search/pagination
- non-admin forbidden
- edit success và validation
