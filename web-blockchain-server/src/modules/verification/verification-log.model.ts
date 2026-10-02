import { InferSchemaType, Schema, model } from "mongoose";
const logSchema = new Schema({ certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" }, certificateCode: String, method: { type: String, enum: ["QR", "CODE", "HASH"], required: true }, result: { type: String, enum: ["VALID", "INVALID", "REVOKED", "NOT_FOUND"], required: true }, requestIp: String, userAgent: String }, { timestamps: { createdAt: true, updatedAt: false } });
export type VerificationLog = InferSchemaType<typeof logSchema>;
export const VerificationLogModel = model("VerificationLog", logSchema);
