import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "AGENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { movedId?: string; targetId?: string };
    const movedId = String(body.movedId || "").trim();
    const targetId = String(body.targetId || "").trim();

    if (!movedId || !targetId || movedId === targetId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tours = await db.tour.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

    const movedIndex = tours.findIndex((tour) => tour.id === movedId);
    const targetIndex = tours.findIndex((tour) => tour.id === targetId);

    if (movedIndex < 0 || targetIndex < 0) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const next = [...tours];
    const [moved] = next.splice(movedIndex, 1);
    next.splice(targetIndex, 0, moved);

    await db.$transaction(
      next.map((tour, index) =>
        db.tour.update({
          where: { id: tour.id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    revalidatePath("/");
    revalidatePath("/tours");
    revalidatePath("/destinations");
    revalidatePath("/admin/site");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not reorder tours" }, { status: 500 });
  }
}
