import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

export const MAX_IMAGES = 4;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

function validateImageFile(file: File) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image "${file.name}" exceeds the 5 MB size limit`);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }

  const ext = path.extname(file.name || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS[file.type]?.includes(ext)) {
    throw new Error(`File extension does not match MIME type for "${file.name}"`);
  }
}

export async function saveProductImages(files: File[], productId: string): Promise<string[]> {
  if (files.length > MAX_IMAGES) {
    throw new Error(`A product can have at most ${MAX_IMAGES} images`);
  }

  for (const file of files) {
    validateImageFile(file);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", productId);
  await mkdir(uploadDir, { recursive: true });

  const imagePaths: string[] = [];

  for (const file of files) {
    const ext = path.extname(file.name || "").toLowerCase() || ".bin";
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    imagePaths.push(`/uploads/${productId}/${filename}`);
  }

  return imagePaths;
}

export function extractImageFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const value of formData.getAll("images")) {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  return files;
}
