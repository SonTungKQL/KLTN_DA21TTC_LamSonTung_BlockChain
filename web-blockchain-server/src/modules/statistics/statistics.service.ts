import { ConsultationModel } from "../consultations/consultation.model";
import { CertificateModel } from "../certificates/certificate.model";
import { InstitutionModel } from "../institutions/institution.model";
import { StudentModel } from "../students/student.model";
import { BlockchainTransactionModel } from "../blockchain/blockchain-transaction.model";
import { CourseModel, MajorModel, TrainingClassModel } from "../academics/academic.model";

type Count = { key: string; count: number };
type Trend = { month: string; total: number; issued: number; revoked: number };

export class StatisticsService {
  async overview() {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 5, 1);
    monthStart.setHours(0, 0, 0, 0);
    const [students, institutions, majors, courses, classes, certificates, certificateStatus, blockchainStatus, consultationStatus, transactionStatus, trendRows, institutionRows, majorRows, recentTransactions] = await Promise.all([
      StudentModel.countDocuments(), InstitutionModel.countDocuments(), MajorModel.countDocuments(), CourseModel.countDocuments(), TrainingClassModel.countDocuments(), CertificateModel.countDocuments(),
      CertificateModel.aggregate<Count>([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }]),
      CertificateModel.aggregate<Count>([{ $group: { _id: "$blockchainStatus", count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }]),
      ConsultationModel.aggregate<Count>([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }]),
      BlockchainTransactionModel.aggregate<Count>([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }]),
      CertificateModel.aggregate<Trend>([
        { $match: { issueDate: { $gte: monthStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } }, total: { $sum: 1 }, issued: { $sum: { $cond: [{ $eq: ["$status", "ISSUED"] }, 1, 0] } }, revoked: { $sum: { $cond: [{ $eq: ["$status", "REVOKED"] }, 1, 0] } } } },
        { $project: { _id: 0, month: "$_id", total: 1, issued: 1, revoked: 1 } }, { $sort: { month: 1 } },
      ]),
      CertificateModel.aggregate<{ name: string; count: number }>([
        { $group: { _id: "$institutionId", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 },
        { $lookup: { from: "institutions", localField: "_id", foreignField: "_id", as: "institution" } }, { $unwind: { path: "$institution", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, name: { $ifNull: ["$institution.name", "Chưa xác định"] }, count: 1 } },
      ]),
      StudentModel.aggregate<{ name: string; count: number }>([
        { $group: { _id: "$major", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }, { $project: { _id: 0, name: { $ifNull: ["$_id", "Chưa xác định"] }, count: 1 } },
      ]),
      BlockchainTransactionModel.find().sort({ createdAt: -1 }).limit(6).select("action transactionHash status blockNumber createdAt").lean().exec(),
    ]);
    return {
      summary: { students, institutions, majors, courses, classes, certificates },
      certificateStatus: this.completeCounts(["ISSUED", "PENDING", "BLOCKCHAIN_FAILED", "REVOKED"], certificateStatus),
      blockchainStatus: this.completeCounts(["CONFIRMED", "SUBMITTED", "NOT_SUBMITTED", "FAILED"], blockchainStatus),
      consultationStatus: this.completeCounts(["NEW", "CONTACTED", "CLOSED"], consultationStatus),
      transactionStatus: this.completeCounts(["CREATED", "SUBMITTED", "CONFIRMED", "FAILED"], transactionStatus),
      issueTrend: this.completeTrend(monthStart, trendRows), byInstitution: institutionRows, byMajor: majorRows, recentTransactions,
    };
  }

  private completeTrend(start: Date, rows: Trend[]) {
    const values = new Map(rows.map((row) => [row.month, row]));
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return values.get(month) ?? { month, total: 0, issued: 0, revoked: 0 };
    });
  }

  private completeCounts(keys: string[], rows: Count[]) {
    const values = new Map(rows.map((row) => [row.key, row.count]));
    return keys.map((key) => ({ key, count: values.get(key) ?? 0 }));
  }
}
