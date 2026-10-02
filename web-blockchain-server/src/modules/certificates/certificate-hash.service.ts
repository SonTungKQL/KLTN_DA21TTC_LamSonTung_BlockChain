import { keccak256, toUtf8Bytes } from "ethers";
export interface CanonicalCertificate { certificateCode: string; studentCode: string; studentName: string; certificateName: string; major: string; issueDate: string; institutionCode: string; }
const normalize = (value: string) => value.trim();
export class CertificateHashService { create(payload: CanonicalCertificate) { const canonical = { certificateCode: normalize(payload.certificateCode), studentCode: normalize(payload.studentCode), studentName: normalize(payload.studentName), certificateName: normalize(payload.certificateName), major: normalize(payload.major), issueDate: payload.issueDate.slice(0, 10), institutionCode: normalize(payload.institutionCode) }; return keccak256(toUtf8Bytes(JSON.stringify(canonical))); } }
