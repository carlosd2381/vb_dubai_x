import { promises as fs } from "fs";
import path from "path";

function normalizeName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

export async function savePublicUpload(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${normalizeName(file.name || "media")}`;
  const target = path.join(uploadDir, fileName);

  await fs.writeFile(target, buffer);

  return `/uploads/${fileName}`;
}
