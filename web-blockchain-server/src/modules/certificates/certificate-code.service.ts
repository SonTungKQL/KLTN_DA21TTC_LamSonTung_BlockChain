import { CertificateSequenceModel } from "./certificate-sequence.model";

export class CertificateCodeService {
  async create(institutionCode: string, issueDate: string) {
    const normalizedInstitutionCode = institutionCode.trim().toUpperCase();
    const issueYear = Number(issueDate.slice(0, 4));
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const sequence = await CertificateSequenceModel.findOneAndUpdate(
          { institutionCode: normalizedInstitutionCode, issueYear },
          { $inc: { currentValue: 1 } },
          { new: true, upsert: true },
        ).exec();
        return `${normalizedInstitutionCode}-${issueYear}-${String(sequence.currentValue).padStart(6, "0")}`;
      } catch (error) {
        const isUniqueIndexRace = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
        if (!isUniqueIndexRace || attempt === 1) throw error;
      }
    }
    throw new Error("Certificate sequence generation failed");
  }
}
