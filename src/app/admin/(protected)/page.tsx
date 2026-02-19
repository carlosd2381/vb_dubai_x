import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <p className="mt-2 text-sm text-zinc-600">Gestiona contenido público y operaciones CRM.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/site" className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Modificar sitio</Link>
          <Link href="/admin/crm/clientes" className="rounded-md border border-zinc-300 px-4 py-2">Ir al CRM</Link>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Próximas fases</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>Itinerary & Proposal Builder</li>
          <li>Invoicing & Commission Tracking</li>
          <li>Full Email Integration</li>
          <li>AI integration</li>
        </ul>
      </section>
    </div>
  );
}
