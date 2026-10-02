import { InferSchemaType, Schema, model } from "mongoose";
const userSchema = new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true }, fullName: { type: String, required: true, trim: true }, role: { type: String, enum: ["ADMIN", "STUDENT"], required: true }, status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" } }, { timestamps: true });
export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
