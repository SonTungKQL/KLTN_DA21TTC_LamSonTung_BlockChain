import { InferSchemaType, Schema, model } from "mongoose";

const baseOptions = { timestamps: true };

const majorSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
  },
  baseOptions,
);
majorSchema.index({ institutionId: 1, code: 1 }, { unique: true });

const courseSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    startYear: { type: Number, min: 1900, max: 3000 },
  },
  baseOptions,
);
courseSchema.index({ institutionId: 1, code: 1 }, { unique: true });

const trainingClassSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    majorId: { type: Schema.Types.ObjectId, ref: "Major", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
  },
  baseOptions,
);
trainingClassSchema.index({ courseId: 1, code: 1 }, { unique: true });

export type Major = InferSchemaType<typeof majorSchema>;
export type Course = InferSchemaType<typeof courseSchema>;
export type TrainingClass = InferSchemaType<typeof trainingClassSchema>;
export const MajorModel = model("Major", majorSchema);
export const CourseModel = model("Course", courseSchema);
export const TrainingClassModel = model("TrainingClass", trainingClassSchema);
