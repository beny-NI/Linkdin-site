import path from "node:path";

export const UPLOAD_KINDS = ["portraits", "covers"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

/**
 * Where uploaded images are stored on disk.
 * Set UPLOAD_DIR in .env to an absolute, persistent folder on the server
 * (default: ./uploads next to the running app).
 */
export function uploadDir(): string {
  return process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), "uploads");
}
