const baoMatBearer = [{ bearerAuth: [] }];
const idParam = [
  {
    name: "id",
    in: "path",
    required: true,
    description: "Mã định danh dữ liệu MongoDB",
    schema: { type: "string" },
  },
];
const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        "Nhập mã JWT nhận được sau khi đăng nhập; không nhập tiền tố xác thực.",
    },
  },
  schemas: {
    DangNhap: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "admin@example.com",
          description: "Địa chỉ thư điện tử",
        },
        password: {
          type: "string",
          format: "password",
          example: "Admin@123",
          description: "Mật khẩu",
        },
      },
    },
    DangKySinhVien: {
      type: "object",
      required: ["email", "password", "fullName", "studentCode", "major"],
      description:
        "Đăng ký chỉ tạo tài khoản STUDENT và hồ sơ sinh viên; không thể tự tạo tài khoản quản trị.",
      properties: {
        email: {
          type: "string",
          format: "email",
          description: "Địa chỉ thư điện tử",
        },
        password: {
          type: "string",
          minLength: 8,
          format: "password",
          description: "Mật khẩu",
        },
        fullName: { type: "string", description: "Họ và tên" },
        studentCode: { type: "string", description: "Mã sinh viên" },
        major: { type: "string", description: "Ngành học" },
        className: { type: "string", description: "Lớp học" },
        course: { type: "string", description: "Khóa học" },
        dateOfBirth: {
          type: "string",
          format: "date",
          description: "Ngày sinh",
        },
      },
    },
    SinhVien: {
      type: "object",
      required: ["studentCode", "fullName", "major"],
      properties: {
        studentCode: {
          type: "string",
          example: "SV20260001",
          description: "Mã sinh viên",
        },
        fullName: {
          type: "string",
          example: "Nguyễn Văn An",
          description: "Họ và tên",
        },
        dateOfBirth: {
          type: "string",
          format: "date",
          description: "Ngày sinh",
        },
        major: {
          type: "string",
          example: "Công nghệ thông tin",
          description: "Ngành học",
        },
        className: { type: "string", description: "Lớp học" },
        course: { type: "string", description: "Khóa học" },
        email: {
          type: "string",
          format: "email",
          description: "Tùy chọn; phải gửi kèm mật khẩu.",
        },
        password: {
          type: "string",
          minLength: 8,
          format: "password",
          description: "Mật khẩu tạo tài khoản sinh viên",
        },
      },
    },
    CoSoDaoTao: {
      type: "object",
      required: ["name", "code"],
      properties: {
        name: { type: "string", description: "Tên cơ sở đào tạo" },
        code: {
          type: "string",
          example: "DEMO",
          description: "Mã cơ sở đào tạo",
        },
        address: { type: "string", description: "Địa chỉ" },
        blockchainIssuerAddress: {
          type: "string",
          description: "Địa chỉ ví được cấp quyền phát hành trên Blockchain",
        },
      },
    },
    CapVanBang: {
      type: "object",
      required: [
        "studentId",
        "institutionId",
        "certificateCode",
        "certificateName",
        "major",
        "issueDate",
      ],
      properties: {
        studentId: { type: "string", description: "Mã định danh sinh viên" },
        institutionId: {
          type: "string",
          description: "Mã định danh cơ sở đào tạo",
        },
        certificateCode: {
          type: "string",
          example: "TVU-2026-000001",
          description: "Mã văn bằng duy nhất",
        },
        certificateName: {
          type: "string",
          example: "Kỹ sư Công nghệ thông tin",
          description: "Tên văn bằng",
        },
        degreeType: { type: "string", description: "Loại bằng" },
        major: { type: "string", description: "Ngành đào tạo" },
        classification: {
          type: "string",
          example: "Khá",
          description: "Xếp loại",
        },
        issueDate: {
          type: "string",
          format: "date",
          description: "Ngày cấp theo định dạng năm-tháng-ngày",
        },
        documentUrl: {
          type: "string",
          format: "uri",
          description: "Đường dẫn tài liệu đính kèm",
        },
      },
    },
    ThuHoi: {
      type: "object",
      required: ["reason"],
      properties: {
        reason: {
          type: "string",
          example: "Cấp sai thông tin",
          description: "Lý do thu hồi",
        },
      },
    },
    PhanHoiThanhCong: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
          description: "Yêu cầu thành công",
        },
        data: { type: "object", description: "Dữ liệu trả về" },
      },
    },
    PhanHoiLoi: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: false,
          description: "Yêu cầu thất bại",
        },
        error: {
          type: "object",
          properties: {
            code: { type: "string", description: "Mã lỗi" },
            message: { type: "string", description: "Thông báo lỗi" },
          },
        },
      },
    },
  },
};
const certificateIssueSchema = components.schemas.CapVanBang as {
  required: string[];
  properties: Record<string, { description?: string }>;
};
certificateIssueSchema.required = certificateIssueSchema.required.filter(
  (field) => field !== "certificateCode",
);
delete certificateIssueSchema.properties.certificateCode;
certificateIssueSchema.properties.institutionId.description =
  "Mã định danh cơ sở đào tạo; hệ thống dùng mã cơ sở và ngày cấp để tự sinh mã văn bằng.";
const errors = {
  "400": { description: "Dữ liệu đầu vào không hợp lệ" },
  "401": { description: "Chưa gửi token hoặc token không hợp lệ/hết hạn" },
  "403": { description: "Token hợp lệ nhưng không có quyền" },
  "404": { description: "Không tìm thấy dữ liệu" },
  "409": { description: "Xung đột dữ liệu hoặc trạng thái không hợp lệ" },
};
const success = (description: string) => ({
  "200": {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/PhanHoiThanhCong" },
      },
    },
  },
  ...errors,
});
const created = (description: string) => ({
  "201": {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/PhanHoiThanhCong" },
      },
    },
  },
  ...errors,
});
const body = (schema: string) => ({
  required: true,
  content: {
    "application/json": { schema: { $ref: `#/components/schemas/${schema}` } },
  },
});
const paths = {
  "/health": {
    get: {
      tags: ["Hệ thống"],
      summary: "Kiểm tra trạng thái API",
      description: "Công khai, không cần token.",
      responses: success("API đang hoạt động"),
    },
  },
  "/auth/login": {
    post: {
      tags: ["Xác thực"],
      summary: "Đăng nhập",
      description:
        "Công khai. Sao chép mã truy cập trong phản hồi, bấm nút Xác thực và dán mã đó trước khi gọi API cần đăng nhập.",
      requestBody: body("DangNhap"),
      responses: {
        "200": { description: "Đăng nhập thành công, trả mã truy cập." },
        "401": { description: "Email hoặc mật khẩu không đúng" },
        "403": { description: "Tài khoản bị vô hiệu hóa" },
      },
    },
  },
  "/auth/register": {
    post: {
      tags: ["Xác thực"],
      summary: "Đăng ký tài khoản sinh viên",
      description:
        "Công khai. Chỉ tạo tài khoản STUDENT và hồ sơ sinh viên, không thể tự đăng ký quyền ADMIN.",
      requestBody: body("DangKySinhVien"),
      responses: created(
        "Đăng ký thành công, trả mã truy cập để vào cổng sinh viên",
      ),
    },
  },
  "/auth/me": {
    get: {
      tags: ["Xác thực"],
      summary: "Thông tin tài khoản hiện tại",
      description: "Cần token ADMIN hoặc STUDENT.",
      security: baoMatBearer,
      responses: success("Thông tin người dùng"),
    },
  },
  "/admin/students": {
    get: {
      tags: ["Quản trị - Sinh viên"],
      summary: "Danh sách sinh viên",
      description: "Chỉ ADMIN. Hỗ trợ tìm kiếm và phân trang.",
      security: baoMatBearer,
      responses: success("Danh sách phân trang"),
    },
    post: {
      tags: ["Quản trị - Sinh viên"],
      summary: "Tạo sinh viên",
      description:
        "Chỉ ADMIN. Gửi email cùng mật khẩu nếu cần tạo luôn tài khoản STUDENT.",
      security: baoMatBearer,
      requestBody: body("SinhVien"),
      responses: created("Tạo sinh viên thành công"),
    },
  },
  "/admin/students/{id}": {
    get: {
      tags: ["Quản trị - Sinh viên"],
      summary: "Chi tiết sinh viên",
      description: "Chỉ ADMIN.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Thông tin sinh viên"),
    },
    patch: {
      tags: ["Quản trị - Sinh viên"],
      summary: "Cập nhật sinh viên",
      description: "Chỉ ADMIN.",
      security: baoMatBearer,
      parameters: idParam,
      requestBody: body("SinhVien"),
      responses: success("Cập nhật thành công"),
    },
  },
  "/admin/institutions": {
    get: {
      tags: ["Quản trị - Cơ sở đào tạo"],
      summary: "Danh sách cơ sở đào tạo",
      description: "Chỉ ADMIN.",
      security: baoMatBearer,
      responses: success("Danh sách cơ sở đào tạo"),
    },
    post: {
      tags: ["Quản trị - Cơ sở đào tạo"],
      summary: "Tạo cơ sở đào tạo",
      description: "Chỉ ADMIN.",
      security: baoMatBearer,
      requestBody: body("CoSoDaoTao"),
      responses: created("Tạo cơ sở thành công"),
    },
  },
  "/admin/institutions/{id}/authorize-issuer": {
    post: {
      tags: ["Quản trị - Cơ sở đào tạo"],
      summary: "Cấp quyền ví issuer",
      description:
        "Chỉ ADMIN. Ví issuer của cơ sở được owner Smart Contract cấp quyền phát hành văn bằng.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Cơ sở đã được cấp quyền issuer"),
    },
  },
  "/admin/certificates": {
    get: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Danh sách văn bằng",
      description:
        "Chỉ ADMIN. Hỗ trợ tìm kiếm, lọc theo trạng thái và phân trang.",
      security: baoMatBearer,
      responses: success("Danh sách văn bằng"),
    },
    post: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Cấp văn bằng và ghi Blockchain",
      description:
        "Chỉ ADMIN. Văn bằng chỉ được đánh dấu đã cấp sau khi giao dịch Blockchain được xác nhận; khi lỗi vẫn được lưu để thử lại.",
      security: baoMatBearer,
      requestBody: body("CapVanBang"),
      responses: created("Văn bằng sau khi xử lý Blockchain"),
    },
  },
  "/admin/certificates/{id}": {
    get: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Chi tiết văn bằng",
      description: "Chỉ ADMIN.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Chi tiết văn bằng"),
    },
  },
  "/admin/certificates/{id}/verification-qr": {
    get: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Tạo payload QR xác thực",
      description:
        "Chỉ ADMIN. Trả về URL xác minh chuẩn từ CLIENT_URL cho văn bằng đã cấp hoặc đã thu hồi.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Payload QR xác thực"),
    },
  },
  "/admin/certificates/{id}/retry-blockchain": {
    post: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Thử lại ghi Blockchain",
      description:
        "Chỉ ADMIN, chỉ dùng với văn bằng ghi Blockchain thất bại; hệ thống kiểm tra dữ liệu trên chuỗi để chống gửi lặp.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Văn bằng sau khi thử lại"),
    },
  },
  "/admin/certificates/{id}/revoke": {
    post: {
      tags: ["Quản trị - Văn bằng"],
      summary: "Thu hồi văn bằng",
      description:
        "Chỉ ADMIN, chỉ dùng với văn bằng đã cấp. Chỉ đổi trạng thái sau khi giao dịch Blockchain xác nhận thành công.",
      security: baoMatBearer,
      parameters: idParam,
      requestBody: body("ThuHoi"),
      responses: success("Văn bằng đã thu hồi"),
    },
  },
  "/admin/blockchain-transactions": {
    get: {
      tags: ["Quản trị - Blockchain"],
      summary: "Lịch sử giao dịch Blockchain",
      description:
        "Chỉ ADMIN. Hỗ trợ lọc theo trạng thái, hành động và phân trang.",
      security: baoMatBearer,
      responses: success("Các lần thử giao dịch"),
    },
  },
  "/student/certificates": {
    get: {
      tags: ["Sinh viên - Văn bằng"],
      summary: "Danh sách văn bằng của tôi",
      description:
        "Chỉ STUDENT. Hệ thống xác định sinh viên sở hữu từ mã đăng nhập.",
      security: baoMatBearer,
      responses: success("Danh sách văn bằng thuộc tài khoản"),
    },
  },
  "/student/certificates/{id}": {
    get: {
      tags: ["Sinh viên - Văn bằng"],
      summary: "Chi tiết văn bằng của tôi",
      description: "Chỉ STUDENT, chỉ được đọc văn bằng thuộc sở hữu.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Chi tiết văn bằng"),
    },
  },
  "/student/certificates/{id}/verification-qr": {
    get: {
      tags: ["Sinh viên - Văn bằng"],
      summary: "Tạo payload QR xác thực của tôi",
      description:
        "Chỉ STUDENT, chỉ áp dụng cho văn bằng thuộc sở hữu đã cấp hoặc đã thu hồi.",
      security: baoMatBearer,
      parameters: idParam,
      responses: success("Payload QR xác thực"),
    },
  },
  "/public/certificates/verify/{certificateCode}": {
    get: {
      tags: ["Xác thực công khai"],
      summary: "Xác thực văn bằng",
      description:
        "Công khai, không cần token. Đối chiếu dữ liệu cơ sở dữ liệu, mã băm và Blockchain.",
      parameters: [
        {
          name: "certificateCode",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "method",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["QR", "CODE"], default: "CODE" },
          description: "Nguồn khởi tạo xác minh; QR được dùng khi mở từ mã QR.",
        },
      ],
      responses: success(
        "Hợp lệ, không hợp lệ, đã thu hồi hoặc không tìm thấy",
      ),
    },
  },
};
function document(title: string, description: string, allowedPaths: string[]) {
  return {
    openapi: "3.0.3",
    info: {
      title,
      version: "1.0.0",
      description: `${description}\n\nKhi API_ENCRYPTION_ENABLED=true, phần thân của yêu cầu không phải GET và phản hồi API được mã hóa AES-256-GCM; Swagger và điểm kiểm tra sức khỏe không mã hóa.`,
    },
    servers: [{ url: "/api", description: "Địa chỉ API hiện tại" }],
    tags: [
      { name: "Xác thực" },
      { name: "Hệ thống" },
      { name: "Xác thực công khai" },
      { name: "Sinh viên - Văn bằng" },
      { name: "Quản trị - Sinh viên" },
      { name: "Quản trị - Cơ sở đào tạo" },
      { name: "Quản trị - Văn bằng" },
      { name: "Quản trị - Blockchain" },
    ],
    components,
    paths: Object.fromEntries(
      allowedPaths.map((path) => [path, paths[path as keyof typeof paths]]),
    ),
  };
}
const base = [
  "/health",
  "/auth/login",
  "/auth/register",
  "/auth/me",
  "/public/certificates/verify/{certificateCode}",
];
export const openApiClientDocument = document(
  "API Ứng dụng người dùng – Xác thực văn bằng",
  "Tài liệu dành cho giao diện công khai và sinh viên.",
  [
    ...base,
    "/student/certificates",
    "/student/certificates/{id}",
    "/student/certificates/{id}/verification-qr",
  ],
);
export const openApiAdminDocument = document(
  "API Quản trị – Văn bằng",
  "Tài liệu dành cho giao diện quản trị. Các API quản trị yêu cầu JWT với quyền ADMIN.",
  [
    ...base,
    "/admin/students",
    "/admin/students/{id}",
    "/admin/institutions",
    "/admin/institutions/{id}/authorize-issuer",
    "/admin/certificates",
    "/admin/certificates/{id}",
    "/admin/certificates/{id}/verification-qr",
    "/admin/certificates/{id}/retry-blockchain",
    "/admin/certificates/{id}/revoke",
    "/admin/blockchain-transactions",
  ],
);
