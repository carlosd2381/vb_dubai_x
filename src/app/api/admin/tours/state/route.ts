import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Body = {
  action?: "archive" | "restore" | "toggleActive";
  tourId?: string;
  isActive?: boolean;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "AGENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Body;
    const action = body.action;
    const tourId = String(body.tourId || "").trim();

    if (!action || !tourId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (action === "archive") {
      await db.tour.update({ where: { id: tourId }, data: { deletedAt: new Date() } });
      revalidatePath("/");
      revalidatePath("/tours");
      revalidatePath("/destinations");
      revalidatePath("/admin/site");
      return NextResponse.json({ ok: true });
    }

    if (action === "restore") {
      await db.tour.update({ where: { id: tourId }, data: { deletedAt: null } });
      revalidatePath("/");
      revalidatePath("/tours");
      revalidatePath("/destinations");
      revalidatePath("/admin/site");
      return NextResponse.json({ ok: true });
    }

    if (action === "toggleActive") {
      await db.tour.update({ where: { id: tourId }, data: { isActive: Boolean(body.isActive) } });
      revalidatePath("/");
      revalidatePath("/tours");
      revalidatePath("/destinations");
      revalidatePath("/admin/site");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Could not update tour" }, { status: 500 });
  }
}
