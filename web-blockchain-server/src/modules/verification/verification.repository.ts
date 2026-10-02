import { VerificationLogModel } from "./verification-log.model";
export class VerificationRepository { create(input: Record<string, unknown>) { return VerificationLogModel.create(input); } }
