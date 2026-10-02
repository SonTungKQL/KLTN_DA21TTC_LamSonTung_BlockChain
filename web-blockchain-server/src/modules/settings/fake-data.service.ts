import { randomBytes, randomUUID } from "node:crypto";
import type { AppEnvironment } from "../../config/env";
import { hashPassword } from "../../common/password";
import {
  MajorModel,
  CourseModel,
  TrainingClassModel,
} from "../academics/academic.model";
import { BlockchainTransactionModel } from "../blockchain/blockchain-transaction.model";
import { CertificateHashService } from "../certificates/certificate-hash.service";
import { CertificateCodeService } from "../certificates/certificate-code.service";
import { CertificateModel } from "../certificates/certificate.model";
import { ConsultationModel } from "../consultations/consultation.model";
import { InstitutionModel } from "../institutions/institution.model";
import { StudentModel } from "../students/student.model";
import { UserModel } from "../users/user.model";
import { VerificationLogModel } from "../verification/verification-log.model";

const studentNames = [
  "Nguyễn Hoàng Phúc",
  "Trần Minh Khôi",
  "Lê Thị Ngọc Anh",
  "Phạm Quốc Bảo",
  "Hoàng Gia Huy",
  "Võ Thanh Trúc",
  "Đặng Minh Tâm",
  "Bùi Thị Thu Trang",
  "Nguyễn Đức Anh",
  "Trần Khánh Linh",
  "Lê Hoàng Nam",
  "Phạm Thị Ngọc Hân",
  "Võ Minh Quân",
  "Nguyễn Thành Đạt",
  "Trần Gia Bảo",
  "Lê Thị Phương Thảo",
  "Nguyễn Nhật Minh",
  "Trần Quốc Khánh",
  "Lê Thanh Tùng",
  "Phạm Minh Anh",
];

const institutions = [
  "Trường Đại học Trà Vinh",
  "Trường Đại học Cần Thơ",
  "Trường Đại học Công nghệ Thông tin",
  "Trường Đại học Kinh tế Thành phố Hồ Chí Minh",
  "Trường Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh",
];

const majors = [
  {
    code: "CNTT",
    name: "Công nghệ thông tin",
    certificateName: "Bằng kỹ sư Công nghệ thông tin",
  },
  {
    code: "QTKD",
    name: "Quản trị kinh doanh",
    certificateName: "Bằng cử nhân Quản trị kinh doanh",
  },
  {
    code: "KT",
    name: "Kế toán",
    certificateName: "Bằng cử nhân Kế toán",
  },
  {
    code: "KHDL",
    name: "Khoa học dữ liệu",
    certificateName: "Bằng kỹ sư Khoa học dữ liệu",
  },
];

const classifications = ["Xuất sắc", "Giỏi", "Khá"];

const interests = [
  "Xác thực văn bằng",
  "Tích hợp API",
  "Triển khai Blockchain",
];

const pick = <T>(values: T[], index: number) => values[index % values.length];

const fakeHash = () => `0x${randomBytes(32).toString("hex")}`;

const fakeAddress = () => `0x${randomBytes(20).toString("hex")}`;

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export type FakeDataResult = {
  batchId: string;
  requested: number;
  created: Record<string, number>;
};

/**
 * Tạo dữ liệu mẫu độc lập, nhất quán giữa các bảng.
 *
 * Lưu ý:
 * - Không gửi transaction thật lên Blockchain.
 * - transactionHash, wallet address và blockNumber đều là dữ liệu giả lập.
 * - Dữ liệu sử dụng tiếng Việt có dấu để phục vụ demo hệ thống.
 */
export class FakeDataService {
  private readonly codes = new CertificateCodeService();
  private readonly hashes = new CertificateHashService();

  constructor(private readonly environment: AppEnvironment) {}

  async generate(quantity: number, createdBy: string): Promise<FakeDataResult> {
    const batchId = `${Date.now().toString(36)}${randomUUID().slice(
      0,
      6,
    )}`.toUpperCase();

    const passwordHash = await hashPassword(`Demo-${randomUUID()}-A1`);

    const created = {
      users: 0,
      institutions: 0,
      majors: 0,
      courses: 0,
      classes: 0,
      students: 0,
      certificates: 0,
      certificateSequences: 0,
      blockchainTransactions: 0,
      verificationLogs: 0,
      consultations: 0,
    };

    for (let index = 0; index < quantity; index += 1) {
      const serial = String(index + 1).padStart(4, "0");

      /*
       * ==============================
       * 1. TẠO THÔNG TIN SINH VIÊN
       * ==============================
       */

      const name = pick(studentNames, index);

      /*
       * ==============================
       * 2. TẠO CƠ SỞ ĐÀO TẠO
       * ==============================
       */

      const institutionCode = `FA${batchId.slice(0, 8)}${serial}`.slice(0, 20);

      const institution = await InstitutionModel.create({
        name: `${pick(institutions, index)} - Cơ sở ${index + 1}`,

        code: institutionCode,

        address: `${index + 1} Đường Nguyễn Văn Linh, Quận ${
          (index % 12) + 1
        }, Thành phố Hồ Chí Minh`,

        blockchainIssuerAddress: fakeAddress(),
      });

      created.institutions += 1;

      /*
       * ==============================
       * 3. TẠO NGÀNH HỌC
       * ==============================
       */

      const majorSeed = pick(majors, index);

      const startYear = new Date().getFullYear() - 4 - (index % 3);

      const major = await MajorModel.create({
        institutionId: institution._id,

        code: `${majorSeed.code}${serial}`,

        name: majorSeed.name,
      });

      created.majors += 1;

      /*
       * ==============================
       * 4. TẠO KHÓA HỌC
       * ==============================
       */

      const course = await CourseModel.create({
        institutionId: institution._id,

        code: `K${startYear}${serial}`,

        name: `Khóa ${startYear} - ${startYear + 4}`,

        startYear,
      });

      created.courses += 1;

      /*
       * ==============================
       * 5. TẠO LỚP ĐÀO TẠO
       * ==============================
       */

      const trainingClass = await TrainingClassModel.create({
        institutionId: institution._id,

        majorId: major._id,

        courseId: course._id,

        code: `${majorSeed.code}${startYear}${serial}`,

        name: `${majorSeed.code}${startYear}-${String((index % 4) + 1).padStart(
          2,
          "0",
        )}`,
      });

      created.classes += 1;

      /*
       * ==============================
       * 6. TẠO TÀI KHOẢN SINH VIÊN
       * ==============================
       */

      const user = await UserModel.create({
        email: `sinhvien.${batchId.toLowerCase()}.${serial}@demo.local`,

        passwordHash,

        fullName: name,

        role: "STUDENT",

        status: "ACTIVE",
      });

      created.users += 1;

      /*
       * ==============================
       * 7. TẠO HỒ SƠ SINH VIÊN
       * ==============================
       */

      const student = await StudentModel.create({
        userId: user._id,

        studentCode: `SV${startYear}${batchId.slice(0, 5)}${serial}`.slice(
          0,
          40,
        ),

        fullName: name,

        dateOfBirth: new Date(2000 + (index % 5), index % 12, (index % 25) + 1),

        institutionId: institution._id,

        majorId: major._id,

        courseId: course._id,

        classId: trainingClass._id,

        major: major.name,

        className: trainingClass.name,

        course: course.name,
      });

      created.students += 1;

      /*
       * ==============================
       * 8. NGÀY CẤP VĂN BẰNG
       * ==============================
       */

      const issueDate = new Date(
        startYear + 4,
        5 + (index % 6),
        (index % 25) + 1,
      );

      const issueDateValue = dateOnly(issueDate);

      /*
       * ==============================
       * 9. TẠO MÃ VĂN BẰNG
       * ==============================
       */

      const certificateCode = await this.codes.create(
        institution.code,
        issueDateValue,
      );

      created.certificateSequences += 1;

      /*
       * ==============================
       * 10. TẠO HASH VĂN BẰNG
       * ==============================
       */

      const documentHash = this.hashes.create({
        certificateCode,

        studentCode: student.studentCode,

        studentName: student.fullName,

        certificateName: majorSeed.certificateName,

        major: major.name,

        issueDate: issueDateValue,

        institutionCode: institution.code,
      });

      /*
       * ==============================
       * 11. GIẢ LẬP BLOCKCHAIN
       * ==============================
       */

      const transactionHash = fakeHash();

      const blockNumber = 10_000_000 + index;

      /*
       * ==============================
       * 12. TẠO VĂN BẰNG
       * ==============================
       */

      const certificate = await CertificateModel.create({
        certificateCode,

        studentId: student._id,

        institutionId: institution._id,

        certificateName: majorSeed.certificateName,

        degreeType: "Đại học chính quy",

        major: major.name,

        classification: pick(classifications, index),

        issueDate,

        documentUrl: `https://demo.local/documents/${certificateCode}.pdf`,

        documentHash,

        transactionHash,

        blockNumber,

        blockchainStatus: "CONFIRMED",

        status: "ISSUED",

        issuedAt: issueDate,

        confirmedAt: issueDate,

        retryCount: 0,

        createdBy,
      });

      created.certificates += 1;

      /*
       * ==============================
       * 13. LỊCH SỬ GIAO DỊCH BLOCKCHAIN
       * ==============================
       */

      await BlockchainTransactionModel.create({
        certificateId: certificate._id,

        action: "ISSUE_CERTIFICATE",

        transactionHash,

        network: this.environment.BLOCKCHAIN_RPC_URL,

        chainId: this.environment.BLOCKCHAIN_CHAIN_ID,

        contractAddress:
          this.environment.CERTIFICATE_CONTRACT_ADDRESS ?? "DEMO_FAKE_CONTRACT",

        status: "CONFIRMED",

        blockNumber,

        submittedAt: issueDate,

        confirmedAt: issueDate,
      });

      created.blockchainTransactions += 1;

      /*
       * ==============================
       * 14. NHẬT KÝ XÁC THỰC VĂN BẰNG
       * ==============================
       */

      await VerificationLogModel.create({
        certificateId: certificate._id,

        certificateCode,

        method: index % 2 === 0 ? "QR" : "CODE",

        result: "VALID",

        requestIp: `192.0.2.${(index % 250) + 1}`,

        userAgent: "Trình tạo dữ liệu mẫu hệ thống xác thực văn bằng",
      });

      created.verificationLogs += 1;

      /*
       * ==============================
       * 15. THÔNG TIN TƯ VẤN
       * ==============================
       */

      const interest = pick(interests, index);

      await ConsultationModel.create({
        userId: user._id,

        fullName: name,

        email: user.email,

        phone: `0${String(900000000 + index).slice(-9)}`,

        organization: institution.name,

        interest,

        message: `Tôi cần tư vấn về ${interest.toLowerCase()} cho đơn vị.`,

        status:
          index % 3 === 0 ? "NEW" : index % 3 === 1 ? "CONTACTED" : "CLOSED",
      });

      created.consultations += 1;
    }

    return {
      batchId,
      requested: quantity,
      created,
    };
  }
}
