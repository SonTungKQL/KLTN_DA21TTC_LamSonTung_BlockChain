import { InferSchemaType, Schema, model } from "mongoose";
const consultationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, fullName: { type: String, required: true, trim: true }, email: { type: String, required: true, trim: true, lowercase: true }, phone: { type: String, required: true, trim: true }, organization: { type: String, required: true, trim: true }, interest: { type: String, trim: true }, message: { type: String, trim: true }, status: { type: String, enum: ["NEW", "CONTACTED", "CLOSED"], default: "NEW", index: true } }, { timestamps: true });
export type Consultation = InferSchemaType<typeof consultationSchema>;
export const ConsultationModel = model("Consultation", consultationSchema);
