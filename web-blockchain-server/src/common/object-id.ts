import { Types } from "mongoose";
import { AppError } from "../http/error";

export function requireObjectId(value: string, name = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) throw new AppError(`Invalid ${name}`, 400, "VALIDATION_ERROR");
  return new Types.ObjectId(value);
}
