import "dotenv/config";
import { z } from "zod";

const optionalEnvironmentValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5001),
    MONGODB_URI: z.string().url().default("mongodb://127.0.0.1:27017"),
    MONGO_DB_NAME: z.string().trim().min(1).default("certificate-blockchain"),
    CLIENT_URL: z.string().url().default("http://localhost:3001"),
    BLOCKCHAIN_RPC_URL: z.string().url().default("http://127.0.0.1:8545"),
    BLOCKCHAIN_CHAIN_ID: z.coerce.number().int().positive().default(31337),
    CERTIFICATE_CONTRACT_ADDRESS: optionalEnvironmentValue(
      z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    ),
    BLOCKCHAIN_PRIVATE_KEY: optionalEnvironmentValue(
      z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    ),
    BLOCKCHAIN_ISSUER_PRIVATE_KEYS: z.string().optional(),
    JWT_SECRET: z
      .string()
      .min(32)
      .default("development-only-jwt-secret-change-this-value"),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(86_400),
    API_ENCRYPTION_ENABLED: z.preprocess(
      (value) => value === true || value === "true",
      z.boolean().default(false),
    ),
    API_ENCRYPTION_KEY: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.API_ENCRYPTION_ENABLED && !value.API_ENCRYPTION_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "API_ENCRYPTION_KEY is required when API_ENCRYPTION_ENABLED=true",
        path: ["API_ENCRYPTION_KEY"],
      });
    }
  });

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): AppEnvironment {
  return environmentSchema.parse(source);
}
