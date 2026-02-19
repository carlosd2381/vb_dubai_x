import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function usersHref(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/admin/users?${params.toString()}`;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await requireRole(["DEVELOPER", "MANAGEMENT"]);
  const isDeveloper = session.role === "DEVELOPER";
  const params = await searchParams;
  const statusRaw = params.status;
  const status = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;

  async function createAdvisor(formData: FormData) {
    "use server";

    const actor = await requireRole(["DEVELOPER", "MANAGEMENT"]);
    const actorIsDeveloper = actor.role === "DEVELOPER";

    const role = String(formData.get("role") || "AGENT") as "DEVELOPER" | "MANAGEMENT" | "AGENT";
    if (!actorIsDeveloper && role !== "AGENT") {
      redirect(usersHref({ status: "forbidden" }));
    }

    try {
      const passwordHash = await hashPassword(String(formData.get("password") || ""));

      await db.advisor.create({
        data: {
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          passwordHash,
          role,
        },
      });

      revalidatePath("/admin/users");
      redirect(usersHref({ status: "created" }));
    } catch {
      redirect(usersHref({ status: "error" }));
    }
  }

  async function updateAdvisor(formData: FormData) {
    "use server";

    const actor = await requireRole(["DEVELOPER", "MANAGEMENT"]);
    const actorIsDeveloper = actor.role === "DEVELOPER";

    const advisorId = String(formData.get("advisorId") || "").trim();
    const role = String(formData.get("role") || "") as "DEVELOPER" | "MANAGEMENT" | "AGENT" | "";
    const password = String(formData.get("password") || "").trim();

    const target = await db.advisor.findUnique({ where: { id: advisorId } });
    if (!target) {
      redirect(usersHref({ status: "not-found" }));
    }

    if (!actorIsDeveloper && target.role !== "AGENT") {
      redirect(usersHref({ status: "forbidden" }));
    }

    if (!actorIsDeveloper && role && role !== "AGENT") {
      redirect(usersHref({ status: "forbidden" }));
    }

    if (actor.advisorId === advisorId && role && role !== actor.role) {
      redirect(usersHref({ status: "self-role" }));
    }

    const data: { role?: "DEVELOPER" | "MANAGEMENT" | "AGENT"; passwordHash?: string } = {};

    if (role) {
      data.role = role;
    }

    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    if (!Object.keys(data).length) {
      redirect(usersHref({ status: "no-change" }));
    }

    await db.advisor.update({ where: { id: advisorId }, data });

    revalidatePath("/admin/users");
    redirect(usersHref({ status: "updated" }));
  }

  const advisors = await db.advisor.findMany({ orderBy: { createdAt: "asc" } });

  const statusMessages: Record<string, string> = {
    created: "Usuario creado correctamente.",
    updated: "Usuario actualizado correctamente.",
    forbidden: "No tienes permisos para esta acción.",
    "self-role": "No puedes cambiar tu propio rol desde esta pantalla.",
    "no-change": "No hubo cambios para guardar.",
    "not-found": "Usuario no encontrado.",
    error: "No se pudo completar la acción.",
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Seguridad · Usuarios y roles</h1>
        <p className="mt-1 text-sm text-zinc-600">Gestiona accesos del panel admin con roles Desarrollador, Gerencia y Agente.</p>

        {status && statusMessages[status] && (
          <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{statusMessages[status]}</p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Crear usuario</h2>
        <form action={createAdvisor} className="mt-3 grid gap-3 md:grid-cols-2">
          <input name="name" placeholder="Nombre" className="rounded-md border border-zinc-300 px-3 py-2" required />
          <input type="email" name="email" placeholder="Correo electrónico" className="rounded-md border border-zinc-300 px-3 py-2" required />
          <input type="password" name="password" minLength={8} placeholder="Contraseña (mín. 8)" className="rounded-md border border-zinc-300 px-3 py-2" required />
          <select name="role" defaultValue="AGENT" className="rounded-md border border-zinc-300 px-3 py-2">
            {isDeveloper ? (
              <>
                <option value="DEVELOPER">Desarrollador</option>
                <option value="MANAGEMENT">Gerencia</option>
                <option value="AGENT">Agente</option>
              </>
            ) : (
              <option value="AGENT">Agente</option>
            )}
          </select>
          <div className="md:col-span-2">
            <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Crear usuario</button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Usuarios existentes</h2>
        <div className="mt-3 space-y-3">
          {advisors.map((advisor) => {
            const canEditTarget = isDeveloper || advisor.role === "AGENT";

            return (
              <article key={advisor.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{advisor.name}</p>
                    <p className="text-sm text-zinc-600">{advisor.email}</p>
                  </div>
                  <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700">{advisor.role}</span>
                </div>

                {canEditTarget ? (
                  <form action={updateAdvisor} className="grid gap-2 md:grid-cols-3">
                    <input type="hidden" name="advisorId" value={advisor.id} />
                    <select name="role" defaultValue={advisor.role} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
                      {isDeveloper ? (
                        <>
                          <option value="DEVELOPER">Desarrollador</option>
                          <option value="MANAGEMENT">Gerencia</option>
                          <option value="AGENT">Agente</option>
                        </>
                      ) : (
                        <option value="AGENT">Agente</option>
                      )}
                    </select>
                    <input
                      type="password"
                      name="password"
                      minLength={8}
                      placeholder="Nueva contraseña (opcional)"
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Guardar</button>
                  </form>
                ) : (
                  <p className="text-xs text-zinc-500">Solo Desarrollador puede editar este usuario.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
