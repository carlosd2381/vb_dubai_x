import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload";

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

  try {
    const url = await savePublicUpload(file);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo subir el archivo",
        details: error instanceof Error ? error.message : "Unknown upload error",
      },
      { status: 500 },
    );
  }
}
