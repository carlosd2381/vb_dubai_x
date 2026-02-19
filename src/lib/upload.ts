import { promises as fs } from "fs";
import path from "path";

function normalizeName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

function getSupabaseUploadConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    bucket,
  };
}

async function saveToSupabaseStorage(file: File) {
  const config = getSupabaseUploadConfig();

  if (!config) {
    return null;
  }

  const { supabaseUrl, supabaseServiceRoleKey, bucket } = config;

  const fileName = `${Date.now()}-${normalizeName(file.name || "media")}`;
  const objectPath = `public/${fileName}`;
  const uploadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase storage upload failed: ${response.status} ${details}`);
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export async function savePublicUpload(file: File) {
  const supabaseUrl = await saveToSupabaseStorage(file);
  if (supabaseUrl) {
    return supabaseUrl;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    throw new Error(
      "File upload storage is not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${normalizeName(file.name || "media")}`;
  const target = path.join(uploadDir, fileName);

  await fs.writeFile(target, buffer);

  return `/uploads/${fileName}`;
}
