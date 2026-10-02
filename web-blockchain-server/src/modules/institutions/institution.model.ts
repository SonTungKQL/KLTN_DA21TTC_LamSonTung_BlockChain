import { InferSchemaType, Schema, model } from "mongoose";
const institutionSchema = new Schema({ name: { type: String, required: true, trim: true }, code: { type: String, required: true, unique: true, trim: true }, address: { type: String, trim: true }, blockchainIssuerAddress: { type: String, trim: true }, issuerAuthorizedAt: Date, issuerAuthorizationTransactionHash: String }, { timestamps: true });
export type Institution = InferSchemaType<typeof institutionSchema>;
export const InstitutionModel = model("Institution", institutionSchema);
