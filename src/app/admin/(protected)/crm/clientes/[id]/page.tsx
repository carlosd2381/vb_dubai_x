import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { serviceTypeOptions } from "@/lib/lead-fields";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const confirmDeleteRaw = query.confirmDelete;
  const confirmDelete = (Array.isArray(confirmDeleteRaw) ? confirmDeleteRaw[0] : confirmDeleteRaw) === "1";

  const client = await db.client.findUnique({
    where: { id },
    include: {
      communicationLogs: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    notFound();
  }

  async function addCommunication(formData: FormData) {
    "use server";

    await db.communicationLog.create({
      data: {
        clientId: id,
        note: String(formData.get("note") || ""),
        channel: String(formData.get("channel") || "manual"),
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
  }

  async function addTask(formData: FormData) {
    "use server";

    await db.task.create({
      data: {
        clientId: id,
        title: String(formData.get("title") || ""),
        status: String(formData.get("status") || "pendiente"),
        dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : null,
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
  }

  async function updateTaskStatus(formData: FormData) {
    "use server";

    await db.task.update({
      where: { id: String(formData.get("taskId")) },
      data: { status: String(formData.get("status")) },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
  }

  async function updateClientDetails(formData: FormData) {
    "use server";

    const selectedServiceTypes = formData.getAll("serviceTypes").map((value) => String(value));
    const travelDateRaw = String(formData.get("travelDate") || "");

    await db.client.update({
      where: { id },
      data: {
        firstName: String(formData.get("firstName") || ""),
        lastName: String(formData.get("lastName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || "") || null,
        destination: String(formData.get("destination") || "") || null,
        travelDate: travelDateRaw ? new Date(travelDateRaw) : null,
        travelersInfo: String(formData.get("travelersInfo") || "") || null,
        serviceTypes: selectedServiceTypes.length ? selectedServiceTypes.join(", ") : null,
        preferences: String(formData.get("preferences") || "") || null,
        additionalComments: String(formData.get("additionalComments") || "") || null,
        desiredServices: selectedServiceTypes.length ? selectedServiceTypes.join(", ") : null,
        message: String(formData.get("additionalComments") || "") || null,
        travelStart: travelDateRaw ? new Date(travelDateRaw) : null,
        travelEnd: null,
      },
    });

    revalidatePath("/admin/crm/clientes");
    revalidatePath(`/admin/crm/clientes/${id}`);
  }

  async function deleteClient() {
    "use server";

    await db.client.delete({ where: { id } });
    revalidatePath("/admin/crm/clientes");
    redirect("/admin/crm/clientes");
  }

  const selectedServiceTypes = new Set(
    (client.serviceTypes || client.desiredServices || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const travelDateValue = client.travelDate
    ? client.travelDate.toISOString().slice(0, 10)
    : client.travelStart
      ? client.travelStart.toISOString().slice(0, 10)
      : "";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Detalle del cliente</h1>
          {!confirmDelete ? (
            <Link
              href={`/admin/crm/clientes/${id}?confirmDelete=1`}
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Eliminar cliente
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <form action={deleteClient}>
                <button className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">
                  Confirmar eliminación
                </button>
              </form>
              <Link
                href={`/admin/crm/clientes/${id}`}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </Link>
            </div>
          )}
        </div>

        <form action={updateClientDetails} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input name="firstName" defaultValue={client.firstName} placeholder="Nombre" className="rounded-md border border-zinc-300 px-3 py-2" required />
            <input name="lastName" defaultValue={client.lastName} placeholder="Apellido" className="rounded-md border border-zinc-300 px-3 py-2" required />
            <input type="email" name="email" defaultValue={client.email} placeholder="Correo electrónico" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" required />
            <input name="phone" defaultValue={client.phone || ""} placeholder="Teléfono" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
            <input name="destination" defaultValue={client.destination || ""} placeholder="Destino" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
            <input type="date" name="travelDate" defaultValue={travelDateValue} className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
            <input name="travelersInfo" defaultValue={client.travelersInfo || ""} placeholder="Número de viajeros" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-800">Tipo de servicios</p>
            <div className="grid gap-2 md:grid-cols-2">
              {serviceTypeOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="serviceTypes"
                    value={option}
                    defaultChecked={selectedServiceTypes.has(option)}
                    className="h-4 w-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <input name="preferences" defaultValue={client.preferences || ""} placeholder="Preferencias" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          <textarea
            name="additionalComments"
            defaultValue={client.additionalComments || client.message || ""}
            placeholder="Comentarios adicionales"
            className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
          />

          <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Guardar cambios</button>
        </form>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Historial de comunicación</h2>
          <form action={addCommunication} className="mt-3 space-y-2">
            <select name="channel" defaultValue="WhatsApp" className="w-full rounded-md border border-zinc-300 px-3 py-2" required>
              <option value="Llamada telefónica">Llamada telefónica</option>
              <option value="Mensaje de texto (SMS)">Mensaje de texto (SMS)</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Correo electrónico">Correo electrónico</option>
              <option value="Instagram Messenger">Instagram Messenger</option>
              <option value="Facebook Messenger">Facebook Messenger</option>
              <option value="TikTok Messenger">TikTok Messenger</option>
            </select>
            <textarea name="note" placeholder="Nota de comunicación" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" required />
            <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Agregar registro</button>
          </form>
          <div className="mt-4 space-y-2 text-sm">
            {client.communicationLogs.map((log) => (
              <article key={log.id} className="rounded-md border border-zinc-200 p-3">
                <p className="font-medium">{log.channel}</p>
                <p className="text-zinc-700">{log.note}</p>
                <p className="text-xs text-zinc-500">{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Tareas</h2>
          <form action={addTask} className="mt-3 space-y-2">
            <input name="title" placeholder="Título de tarea" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
            <select name="status" className="w-full rounded-md border border-zinc-300 px-3 py-2">
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>
            <input type="date" name="dueDate" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Agregar tarea</button>
          </form>
          <div className="mt-4 space-y-2 text-sm">
            {client.tasks.map((task) => (
              <form key={task.id} action={updateTaskStatus} className="rounded-md border border-zinc-200 p-3">
                <input type="hidden" name="taskId" value={task.id} />
                <p className="font-medium">{task.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <select name="status" defaultValue={task.status} className="rounded-md border border-zinc-300 px-2 py-1">
                    <option value="pendiente">Pendiente</option>
                    <option value="en-progreso">En progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                  <button className="rounded-md border border-zinc-300 px-2 py-1">Actualizar</button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Vence: {task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "-"}</p>
              </form>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
