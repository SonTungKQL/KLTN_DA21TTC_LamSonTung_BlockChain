import type { ApiResponse } from "../types/api";
import { expireSession } from "../auth/session";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001/api";
const encryptionEnabled =
  import.meta.env.VITE_API_ENCRYPTION_ENABLED === "true";
const encryptionSecret = import.meta.env.VITE_API_ENCRYPTION_KEY;

const toBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));
const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
async function encryptionKey() {
  if (!encryptionSecret)
    throw new Error("Thiếu VITE_API_ENCRYPTION_KEY khi bật mã hóa API");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(encryptionSecret),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
async function encryptPayload(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await encryptionKey(),
      new TextEncoder().encode(value),
    ),
  );
  const packed = new Uint8Array(iv.length + encrypted.length);
  packed.set(iv);
  packed.set(encrypted, iv.length);
  return toBase64(packed);
}
async function decryptPayload(value: string) {
  const packed = fromBase64(value);
  const iv = packed.slice(0, 12);
  const ciphertextWithTag = packed.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    ciphertextWithTag,
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = window.localStorage.getItem("accessToken");
  const encryptedBody =
    encryptionEnabled &&
    options.body &&
    !["GET", "HEAD"].includes(options.method ?? "GET")
      ? JSON.stringify({
          encryptedData: await encryptPayload(String(options.body)),
        })
      : options.body;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    body: encryptedBody,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const rawPayload = (await response.json()) as
    | ApiResponse<T>
    | {
        encryptedData?: string;
        success: false;
        error?: { message?: string; code?: string };
      };
  const payload =
    encryptionEnabled &&
    "encryptedData" in rawPayload &&
    typeof rawPayload.encryptedData === "string"
      ? ((await decryptPayload(rawPayload.encryptedData)) as
          | ApiResponse<T>
          | { success: false; error?: { message?: string; code?: string } })
      : rawPayload;
  if (!response.ok) {
    const error = "error" in payload ? payload.error : undefined;
    if (
      response.status === 401 &&
      error?.code === "UNAUTHORIZED" &&
      token
    ) {
      expireSession();
    }
    throw new ApiClientError(
      error?.message ?? "Không thể thực hiện yêu cầu",
      response.status,
      error?.code,
    );
  }
  return (payload as ApiResponse<T>).data;
}

export const get = <T>(path: string) => apiRequest<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
export const patch = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
