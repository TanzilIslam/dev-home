import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const DEFAULT_UPLOAD_DIR = "./uploads";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
}

export async function ensureUserDir(userId: string): Promise<string> {
  const dir = path.join(getUploadDir(), userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function generateStoragePath(
  userId: string,
  originalFilename: string,
): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  return path.join(userId, uniqueName);
}

export async function saveFile(
  storagePath: string,
  buffer: Buffer,
): Promise<void> {
  const fullPath = path.join(getUploadDir(), storagePath);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
}

export async function deleteFileFromDisk(
  storagePath: string,
): Promise<void> {
  const fullPath = path.join(getUploadDir(), storagePath);
  try {
    await fs.unlink(fullPath);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

export function getAbsolutePath(storagePath: string): string {
  return path.resolve(getUploadDir(), storagePath);
}
