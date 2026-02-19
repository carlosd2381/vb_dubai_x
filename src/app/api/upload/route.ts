import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

function normalizeName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${normalizeName(file.name || "media")}`;
  const target = path.join(uploadDir, fileName);
  await fs.writeFile(target, buffer);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
