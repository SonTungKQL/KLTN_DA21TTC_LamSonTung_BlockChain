# FLOW 09 — STUDENT CERTIFICATES END-TO-END

## React
- `/student/certificates`
- `/student/certificates/:id`

Student chỉ thấy văn bằng thuộc chính mình.

Features:
- list own certificates
- detail
- QR/verify link cho ISSUED
- copy verify URL
- open public verify

Không có:
- edit
- retry
- revoke

## Backend
- GET `/api/student/certificates`
- GET `/api/student/certificates/:id`

Phải lấy student identity từ authenticated user, không tin studentId truyền từ client để bypass ownership.

## Tests
- own list
- own detail
- other student's certificate forbidden/not found
- student UI không render admin actions
