import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdvisor } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdvisor();

  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set("advisor_session", "", { path: "/", maxAge: 0 });
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Panel de administración</p>
            <p className="text-xs text-zinc-500">{session.email}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin">Dashboard</Link>
            {session.role !== "AGENT" && <Link href="/admin/site">Sitio</Link>}
            <Link href="/admin/crm/clientes">CRM</Link>
            {session.role !== "AGENT" && <Link href="/admin/users">Usuarios</Link>}
            <form action={logoutAction}>
              <button className="rounded-md border border-zinc-300 px-3 py-1">Cerrar sesión</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
