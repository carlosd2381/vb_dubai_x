import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { serviceTypeOptions } from "@/lib/lead-fields";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const showFormRaw = params.showForm;
  const showForm = (Array.isArray(showFormRaw) ? showFormRaw[0] : showFormRaw) === "1";
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  async function createManualClient(formData: FormData) {
    "use server";

    const serviceTypes = formData.getAll("serviceTypes").map((value) => String(value));

    await db.client.create({
      data: {
        firstName: String(formData.get("firstName") || ""),
        lastName: String(formData.get("lastName") || ""),
        email: String(formData.get("email") || ""),
        phone: (formData.get("phone") as string) || null,
        destination: (formData.get("destination") as string) || null,
        travelDate: formData.get("travelDate") ? new Date(String(formData.get("travelDate"))) : null,
        travelersInfo: (formData.get("travelersInfo") as string) || null,
        serviceTypes: serviceTypes.length ? serviceTypes.join(", ") : null,
        preferences: (formData.get("preferences") as string) || null,
        additionalComments: (formData.get("additionalComments") as string) || null,
        preferredContact: null,
        desiredServices: serviceTypes.length ? serviceTypes.join(", ") : null,
        message: (formData.get("additionalComments") as string) || null,
        travelStart: formData.get("travelDate") ? new Date(String(formData.get("travelDate"))) : null,
        travelEnd: null,
        source: "manual",
      },
    });

    revalidatePath("/admin/crm/clientes");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">CRM · Clientes</h1>
            <p className="mt-1 text-sm text-zinc-600">Registros recibidos por formulario web o carga manual.</p>
          </div>
          {!showForm ? (
            <Link href="/admin/crm/clientes?showForm=1" className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
              + Agregar cliente
            </Link>
          ) : (
            <Link href="/admin/crm/clientes" className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Cerrar formulario
            </Link>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600">
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Servicio</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2">
                    <Link href={`/admin/crm/clientes/${client.id}`} className="block w-full">
                      {client.firstName} {client.lastName}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/crm/clientes/${client.id}`} className="block w-full">
                      {client.email}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/crm/clientes/${client.id}`} className="block w-full">
                      {client.serviceTypes || client.desiredServices || "-"}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/crm/clientes/${client.id}`} className="text-sky-700 underline hover:text-amber-600">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Alta manual</h2>
          <form action={createManualClient} className="mt-3 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="firstName" placeholder="Nombre" className="rounded-md border border-zinc-300 px-3 py-2" required />
              <input name="lastName" placeholder="Apellido" className="rounded-md border border-zinc-300 px-3 py-2" required />
              <input type="email" name="email" placeholder="Correo electrónico" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" required />
              <input name="phone" placeholder="Teléfono" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
              <input name="destination" placeholder="Destino" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
              <input type="date" name="travelDate" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
              <input name="travelersInfo" placeholder="Número de viajeros" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-800">Tipo de servicios</p>
              <div className="grid gap-2 md:grid-cols-2">
                {serviceTypeOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" name="serviceTypes" value={option} className="h-4 w-4" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <input name="preferences" placeholder="Preferencias" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            <p className="-mt-1 text-xs text-zinc-500">Hoteles, Aerolíneas/Vuelos</p>
            <textarea name="additionalComments" placeholder="Comentarios adicionales" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" />
            <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Guardar cliente</button>
          </form>
        </section>
      )}
    </div>
  );
}
