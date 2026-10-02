import mongoose from "mongoose";
import type { AppEnvironment } from "../config/env";

export async function connectToDatabase(environment: AppEnvironment): Promise<void> {
  await mongoose.connect(environment.MONGODB_URI, {
    dbName: environment.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 5_000,
  });
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}
