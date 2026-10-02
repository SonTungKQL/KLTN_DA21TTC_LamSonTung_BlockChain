import { Schema, model } from "mongoose";

const certificateSequenceSchema = new Schema({
  institutionCode: { type: String, required: true, uppercase: true, trim: true },
  issueYear: { type: Number, required: true },
  currentValue: { type: Number, required: true },
}, { timestamps: true });

certificateSequenceSchema.index({ institutionCode: 1, issueYear: 1 }, { unique: true });

export const CertificateSequenceModel = model("CertificateSequence", certificateSequenceSchema);
