import bcrypt from "bcryptjs";
import type { AdvisorRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

type SessionPayload = {
  advisorId: string;
  email: string;
  role: AdvisorRole;
};

const COOKIE_NAME = "advisor_session";
const SECRET = process.env.AUTH_SECRET ?? "change-me-in-env";
const secretKey = new TextEncoder().encode(SECRET);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (!session.role) {
    const advisor = await db.advisor.findUnique({ where: { id: session.advisorId } });

    if (!advisor) {
      return null;
    }

    return {
      advisorId: advisor.id,
      email: advisor.email,
      role: advisor.role,
    };
  }

  return session;
}

export async function requireAdvisor() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireRole(roles: AdvisorRole[]) {
  const session = await requireAdvisor();

  if (!roles.includes(session.role)) {
    redirect("/admin");
  }

  return session;
}

export { COOKIE_NAME };
