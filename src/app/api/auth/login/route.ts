import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COOKIE_NAME, createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
    }

    const advisor = await db.advisor.findUnique({ where: { email: body.email } });

    if (!advisor) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await verifyPassword(body.password, advisor.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await createSessionToken({ advisorId: advisor.id, email: advisor.email });
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 });
  }
}
