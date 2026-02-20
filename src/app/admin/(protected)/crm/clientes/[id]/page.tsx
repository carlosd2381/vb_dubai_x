import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { decryptPII, encryptPII, last4 } from "@/lib/pii";
import { savePublicUpload } from "@/lib/upload";
import { LoyaltyProgramForm } from "@/components/loyalty-program-form";
import { RelationshipForm } from "@/components/relationship-form";

const relationshipTypes = [
  "SPOUSE",
  "CHILD",
  "PARENT",
  "SIBLING",
  "FRIEND",
  "RELATIVE",
  "PARTNER",
  "DOMESTIC_PARTNER",
  "COWORKER",
  "OTHER",
] as const;

const seatOptions = ["Ventana", "Pasillo", "Pasillo opuesto"];
const bedOptions = ["King", "2 Dobles/Queen"];
const hotelOptions = ["Económico", "Moderado", "Lujo", "Boutique"];
const vibeOptions = [
  "Romántico",
  "Descanso y relajación",
  "Fuera de lo común",
  "Fiesta",
  "Cultura local",
  "Familiar",
  "Comida y vino",
  "Multigeneracional",
  "Aventura",
  "LGBT",
];
const activityOptions = ["Playa y agua", "Casino", "Buceo", "Actividades de aventura", "Golf", "Vida nocturna", "Artes y teatro"];

const sectionOptions = [
  { key: "contacto", label: "Información de contacto" },
  { key: "relaciones", label: "Relaciones" },
  { key: "lealtad", label: "Programas de lealtad" },
  { key: "fechas", label: "Fechas importantes" },
  { key: "preferencias", label: "Preferencias de viaje" },
  { key: "documentos", label: "Documentos de viaje" },
  { key: "notas", label: "Notas" },
  { key: "tareas", label: "Viajes/Tareas" },
] as const;

type RelationshipType = (typeof relationshipTypes)[number];
type SectionKey = (typeof sectionOptions)[number]["key"];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`space-y-1 text-sm ${className}`.trim()}>
      <span className="block text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function parseSet(value: string | null | undefined) {
  return new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean));
}

function dateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function labelForRelationship(value: RelationshipType) {
  const labels: Record<RelationshipType, string> = {
    SPOUSE: "Cónyuge",
    CHILD: "Hijo/a",
    PARENT: "Padre/Madre",
    SIBLING: "Hermano/a",
    FRIEND: "Amigo/a",
    RELATIVE: "Familiar",
    PARTNER: "Pareja",
    DOMESTIC_PARTNER: "Pareja de hecho",
    COWORKER: "Compañero/a de trabajo",
    OTHER: "Otro",
  };

  return labels[value];
}

function inverseRelationshipType(value: RelationshipType): RelationshipType {
  if (value === "CHILD") {
    return "PARENT";
  }

  if (value === "PARENT") {
    return "CHILD";
  }

  return value;
}

function usersHref(id: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, val]) => {
    if (val) {
      params.set(key, val);
    }
  });

  return `/admin/crm/clientes/${id}?${params.toString()}`;
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const statusRaw = query.status;
  const status = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;
  const addRaw = query.add;
  const addValue = Array.isArray(addRaw) ? addRaw[0] : addRaw;
  const addPanel = addValue === "email" || addValue === "phone" || addValue === "address" ? addValue : null;
  const sectionRaw = query.section;
  const sectionValue = (Array.isArray(sectionRaw) ? sectionRaw[0] : sectionRaw) || "contacto";
  const section = sectionOptions.some((item) => item.key === sectionValue)
    ? (sectionValue as SectionKey)
    : "contacto";

  const client = await db.client.findUnique({
    where: { id },
    include: {
      contactPhones: { orderBy: { createdAt: "desc" } },
      contactEmails: { orderBy: { createdAt: "desc" } },
      contactAddresses: { orderBy: { createdAt: "desc" } },
      relationships: {
        include: { relatedClient: true },
        orderBy: { createdAt: "desc" },
      },
      loyaltyPrograms: { orderBy: { createdAt: "desc" } },
      travelDocuments: { orderBy: { createdAt: "desc" } },
      communicationLogs: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    notFound();
  }

  const allClients = await db.client.findMany({
    where: { id: { not: id } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  async function updateClientDetails(formData: FormData) {
    "use server";

    const selectedServiceTypes = formData.getAll("serviceTypes").map((value) => String(value));
    const selectedHotelPrefs = formData.getAll("hotelPreferences").map((value) => String(value));
    const selectedVibePrefs = formData.getAll("vibePreferences").map((value) => String(value));
    const selectedActivityPrefs = formData.getAll("activityPreferences").map((value) => String(value));

    const travelDateRaw = String(formData.get("travelDate") || "");
    const dateOfBirthRaw = String(formData.get("dateOfBirth") || "");
    const anniversaryRaw = String(formData.get("anniversary") || "");

    await db.client.update({
      where: { id },
      data: {
        firstName: String(formData.get("firstName") || ""),
        middleName: String(formData.get("middleName") || "") || null,
        lastName: String(formData.get("lastName") || ""),
        lastNameMaternal: String(formData.get("lastNameMaternal") || "") || null,
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || "") || null,
        website: String(formData.get("website") || "") || null,
        jobTitle: String(formData.get("jobTitle") || "") || null,
        company: String(formData.get("company") || "") || null,
        facebookProfile: String(formData.get("facebookProfile") || "") || null,
        instagramProfile: String(formData.get("instagramProfile") || "") || null,
        tiktokProfile: String(formData.get("tiktokProfile") || "") || null,
        linkedInProfile: String(formData.get("linkedInProfile") || "") || null,
        destination: String(formData.get("destination") || "") || null,
        travelDate: travelDateRaw ? new Date(travelDateRaw) : null,
        dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
        anniversary: anniversaryRaw ? new Date(anniversaryRaw) : null,
        travelersInfo: String(formData.get("travelersInfo") || "") || null,
        serviceTypes: selectedServiceTypes.length ? selectedServiceTypes.join(", ") : null,
        seatPreference: String(formData.get("seatPreference") || "") || null,
        bedPreference: String(formData.get("bedPreference") || "") || null,
        mealPreference: String(formData.get("mealPreference") || "") || null,
        hotelPreferences: selectedHotelPrefs.length ? selectedHotelPrefs.join(", ") : null,
        vibePreferences: selectedVibePrefs.length ? selectedVibePrefs.join(", ") : null,
        activityPreferences: selectedActivityPrefs.length ? selectedActivityPrefs.join(", ") : null,
        preferences: String(formData.get("preferences") || "") || null,
        additionalComments: String(formData.get("additionalComments") || "") || null,
        desiredServices: selectedServiceTypes.length ? selectedServiceTypes.join(", ") : null,
        message: String(formData.get("additionalComments") || "") || null,
        travelStart: travelDateRaw ? new Date(travelDateRaw) : null,
      },
    });

    revalidatePath("/admin/crm/clientes");
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "saved" }));
  }

  async function addPhone(formData: FormData) {
    "use server";

    await db.clientContactPhone.create({
      data: {
        clientId: id,
        type: String(formData.get("type") || "CELL") as "HOME" | "CELL" | "OFFICE",
        value: String(formData.get("value") || ""),
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "phone-added" }));
  }

  async function updateImportantDates(formData: FormData) {
    "use server";

    const dateOfBirthRaw = String(formData.get("dateOfBirth") || "");
    const anniversaryRaw = String(formData.get("anniversary") || "");

    await db.client.update({
      where: { id },
      data: {
        dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
        anniversary: anniversaryRaw ? new Date(anniversaryRaw) : null,
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { section: "fechas", status: "dates-saved" }));
  }

  async function removePhone(formData: FormData) {
    "use server";

    await db.clientContactPhone.delete({ where: { id: String(formData.get("phoneId")) } });
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "phone-removed" }));
  }

  async function addEmail(formData: FormData) {
    "use server";

    await db.clientContactEmail.create({
      data: {
        clientId: id,
        type: String(formData.get("type") || "PERSONAL") as "PERSONAL" | "OFFICE",
        value: String(formData.get("value") || ""),
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "email-added" }));
  }

  async function removeEmail(formData: FormData) {
    "use server";

    await db.clientContactEmail.delete({ where: { id: String(formData.get("emailId")) } });
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "email-removed" }));
  }

  async function addAddress(formData: FormData) {
    "use server";

    await db.clientContactAddress.create({
      data: {
        clientId: id,
        type: String(formData.get("type") || "PERSONAL") as "PERSONAL" | "OFFICE",
        addressLine1: String(formData.get("addressLine1") || ""),
        addressLine2: String(formData.get("addressLine2") || "") || null,
        city: String(formData.get("city") || "") || null,
        stateProvince: String(formData.get("stateProvince") || "") || null,
        postalCode: String(formData.get("postalCode") || "") || null,
        country: String(formData.get("country") || "") || null,
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "address-added" }));
  }

  async function removeAddress(formData: FormData) {
    "use server";

    await db.clientContactAddress.delete({ where: { id: String(formData.get("addressId")) } });
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "address-removed" }));
  }

  async function addRelationship(formData: FormData) {
    "use server";

    const relatedClientId = String(formData.get("relatedClientId") || "").trim();
    const relationType = String(formData.get("relationType") || "OTHER") as RelationshipType;

    if (!relatedClientId || relatedClientId === "__new__" || relatedClientId === id) {
      redirect(usersHref(id, { section: "relaciones", status: "relationship-invalid" }));
    }

    const reverseRelationType = inverseRelationshipType(relationType);

    await db.clientRelationship.createMany({
      data: [
        {
          clientId: id,
          relatedClientId,
          relationType,
        },
        {
          clientId: relatedClientId,
          relatedClientId: id,
          relationType: reverseRelationType,
        },
      ],
      skipDuplicates: true,
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    revalidatePath(`/admin/crm/clientes/${relatedClientId}`);
    redirect(usersHref(id, { status: "relationship-added" }));
  }

  async function removeRelationship(formData: FormData) {
    "use server";

    const relationshipId = String(formData.get("relationshipId") || "").trim();
    const existing = await db.clientRelationship.findUnique({ where: { id: relationshipId } });

    if (!existing) {
      redirect(usersHref(id, { status: "relationship-removed" }));
    }

    const reverseRelationType = inverseRelationshipType(existing.relationType as RelationshipType);

    await db.clientRelationship.deleteMany({
      where: {
        OR: [
          {
            clientId: existing.clientId,
            relatedClientId: existing.relatedClientId,
            relationType: existing.relationType,
          },
          {
            clientId: existing.relatedClientId,
            relatedClientId: existing.clientId,
            relationType: reverseRelationType,
          },
        ],
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    revalidatePath(`/admin/crm/clientes/${existing.relatedClientId}`);
    redirect(usersHref(id, { status: "relationship-removed" }));
  }

  async function addLoyaltyProgram(formData: FormData) {
    "use server";

    await db.clientLoyaltyProgram.create({
      data: {
        clientId: id,
        category: String(formData.get("category") || "HOTEL") as "HOTEL" | "AIRLINE" | "CRUISE" | "CAR_RENTAL" | "RAIL_BUS",
        programName: String(formData.get("programName") || ""),
        membershipNumber: String(formData.get("membershipNumber") || "") || null,
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "loyalty-added" }));
  }

  async function removeLoyaltyProgram(formData: FormData) {
    "use server";

    await db.clientLoyaltyProgram.delete({ where: { id: String(formData.get("loyaltyId")) } });
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "loyalty-removed" }));
  }

  async function addTravelDocument(formData: FormData) {
    "use server";

    const number = String(formData.get("documentNumber") || "").trim();
    if (!number) {
      redirect(usersHref(id, { status: "doc-number-required" }));
    }

    const photoInput = formData.get("photo") as File;
    let photoUrl = String(formData.get("photoUrl") || "") || null;

    if (photoInput && photoInput.size > 0) {
      photoUrl = await savePublicUpload(photoInput);
    }

    await db.clientTravelDocument.create({
      data: {
        clientId: id,
        type: String(formData.get("type") || "PASSPORT") as "PASSPORT" | "VISA" | "TSA_GLOBAL_ENTRY",
        fullName: String(formData.get("fullName") || "") || null,
        encryptedDocumentNumber: encryptPII(number),
        numberLast4: last4(number),
        countryOfIssue: String(formData.get("countryOfIssue") || "") || null,
        dateOfIssue: String(formData.get("dateOfIssue") || "") ? new Date(String(formData.get("dateOfIssue"))) : null,
        dateOfExpiration: String(formData.get("dateOfExpiration") || "") ? new Date(String(formData.get("dateOfExpiration"))) : null,
        sex: String(formData.get("sex") || "") || null,
        placeOfBirth: String(formData.get("placeOfBirth") || "") || null,
        nationality: String(formData.get("nationality") || "") || null,
        citizenship: String(formData.get("citizenship") || "") || null,
        photoUrl,
      },
    });

    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "doc-added" }));
  }

  async function removeTravelDocument(formData: FormData) {
    "use server";

    await db.clientTravelDocument.delete({ where: { id: String(formData.get("documentId")) } });
    revalidatePath(`/admin/crm/clientes/${id}`);
    redirect(usersHref(id, { status: "doc-removed" }));
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

  const hotelPrefs = parseSet(client.hotelPreferences);
  const vibePrefs = parseSet(client.vibePreferences);
  const activityPrefs = parseSet(client.activityPreferences);
  const primaryAddress = client.contactAddresses[0];

  const decryptedDocuments = client.travelDocuments.map((document) => {
    try {
      return {
        ...document,
        plainNumber: decryptPII(document.encryptedDocumentNumber),
      };
    } catch {
      return {
        ...document,
        plainNumber: "[PII key missing/invalid]",
      };
    }
  });

  const statusMessages: Record<string, string> = {
    saved: "Perfil actualizado.",
    "dates-saved": "Fechas importantes actualizadas.",
    "phone-added": "Teléfono agregado.",
    "phone-removed": "Teléfono eliminado.",
    "email-added": "Email agregado.",
    "email-removed": "Email eliminado.",
    "address-added": "Dirección agregada.",
    "address-removed": "Dirección eliminada.",
    "relationship-added": "Relación agregada.",
    "relationship-removed": "Relación eliminada.",
    "relationship-invalid": "Selecciona un cliente válido para crear la relación.",
    "loyalty-added": "Programa de lealtad agregado.",
    "loyalty-removed": "Programa de lealtad eliminado.",
    "doc-added": "Documento de viaje agregado.",
    "doc-removed": "Documento de viaje eliminado.",
    "doc-number-required": "Número de documento obligatorio.",
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">CRM · Cliente ampliado</h1>
          <Link href="/admin/crm/clientes" className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
            Volver a clientes
          </Link>
        </div>

        {status && statusMessages[status] && (
          <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{statusMessages[status]}</p>
        )}

        <p className="mt-2 text-sm text-zinc-600">Usa el menú lateral para editar una sección a la vez.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-3">
          <nav className="space-y-2">
            {sectionOptions.map((item) => (
              <Link
                key={item.key}
                href={usersHref(id, { section: item.key })}
                className={`block rounded-md px-3 py-2 text-sm ${
                  section === item.key
                    ? "bg-sky-600 text-white"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">

      {section === "contacto" && (
      <section id="contact" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Información de contacto</h2>
        <form action={updateClientDetails} className="mt-3 space-y-3">
          <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Datos personales</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nombre">
                <input name="firstName" defaultValue={client.firstName} className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
              </Field>
              <Field label="Segundo nombre">
                <input name="middleName" defaultValue={client.middleName || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="Apellido paterno">
                <input name="lastName" defaultValue={client.lastName} className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
              </Field>
              <Field label="Apellido materno">
                <input name="lastNameMaternal" defaultValue={client.lastNameMaternal || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="Correo electrónico" className={addPanel === "email" ? "md:col-span-2" : ""}>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <input type="email" name="email" defaultValue={client.email} className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                  <select className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-700" aria-label="Tipo de correo">
                    <option value="PERSONAL">Personal</option>
                    <option value="OFFICE">Oficina</option>
                  </select>
                </div>
                <Link href={usersHref(id, { section: "contacto", add: addPanel === "email" ? undefined : "email" })} className="mt-1 inline-block text-sm font-medium text-sky-600 hover:text-sky-700">
                  {addPanel === "email" ? "Cancelar" : "+ Agregar"}
                </Link>
                {addPanel === "email" && (
                  <div className="mt-2 w-full rounded-lg border border-sky-200 bg-sky-50/60 p-3 shadow-sm">
                    <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_180px] md:items-end">
                      <Field label="Tipo" className="mb-0">
                        <select name="type" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm">
                          <option value="PERSONAL">Personal</option>
                          <option value="OFFICE">Oficina</option>
                        </select>
                      </Field>
                      <Field label="Correo" className="mb-0">
                        <input type="email" name="value" defaultValue={client.email} placeholder="Correo electrónico" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" required />
                      </Field>
                      <button formAction={addEmail} className="h-10 rounded-md border border-zinc-300 px-3 py-2 text-sm">Agregar correo</button>
                    </div>
                  </div>
                )}
              </Field>
              <Field label="Teléfono" className={addPanel === "phone" ? "md:col-span-2" : ""}>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <input name="phone" defaultValue={client.phone || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                  <select className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-700" aria-label="Tipo de teléfono">
                    <option value="HOME">Casa</option>
                    <option value="CELL">Celular</option>
                    <option value="OFFICE">Oficina</option>
                  </select>
                </div>
                <Link href={usersHref(id, { section: "contacto", add: addPanel === "phone" ? undefined : "phone" })} className="mt-1 inline-block text-sm font-medium text-sky-600 hover:text-sky-700">
                  {addPanel === "phone" ? "Cancelar" : "+ Agregar"}
                </Link>
                {addPanel === "phone" && (
                  <div className="mt-2 w-full rounded-lg border border-sky-200 bg-sky-50/60 p-3 shadow-sm">
                    <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_180px] md:items-end">
                      <Field label="Tipo" className="mb-0">
                        <select name="type" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm">
                          <option value="HOME">Casa</option>
                          <option value="CELL">Celular</option>
                          <option value="OFFICE">Oficina</option>
                        </select>
                      </Field>
                      <Field label="Número" className="mb-0">
                        <input name="value" defaultValue={client.phone || ""} placeholder="Número de teléfono" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" required />
                      </Field>
                      <button formAction={addPhone} className="h-10 rounded-md border border-zinc-300 px-3 py-2 text-sm">Agregar teléfono</button>
                    </div>
                  </div>
                )}
              </Field>
              <Field label="Dirección" className="md:col-span-2">
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <input defaultValue={primaryAddress?.addressLine1 || ""} placeholder="Dirección 1" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                  <select className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-700" aria-label="Tipo de dirección">
                    <option value="PERSONAL">Personal</option>
                    <option value="OFFICE">Oficina</option>
                  </select>
                </div>
                <input defaultValue={primaryAddress?.addressLine2 || ""} placeholder="Dirección 2" className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" />
                <div className="mt-2 grid gap-2 md:grid-cols-4">
                  <input defaultValue={primaryAddress?.city || ""} placeholder="Ciudad" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                  <input defaultValue={primaryAddress?.stateProvince || ""} placeholder="Estado" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                  <input defaultValue={primaryAddress?.postalCode || ""} placeholder="Zip" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                  <input defaultValue={primaryAddress?.country || ""} placeholder="País" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                </div>
                <Link href={usersHref(id, { section: "contacto", add: addPanel === "address" ? undefined : "address" })} className="mt-1 inline-block text-sm font-medium text-sky-600 hover:text-sky-700">
                  {addPanel === "address" ? "Cancelar" : "+ Agregar"}
                </Link>
                {addPanel === "address" && (
                  <div className="mt-2 w-full rounded-lg border border-sky-200 bg-sky-50/60 p-3 shadow-sm">
                    <div className="grid gap-2">
                      <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_180px] md:items-end">
                      <Field label="Tipo" className="mb-0">
                        <select name="type" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm">
                          <option value="PERSONAL">Personal</option>
                          <option value="OFFICE">Oficina</option>
                        </select>
                      </Field>
                      <Field label="Dirección 1" className="mb-0">
                        <input name="addressLine1" placeholder="Dirección 1" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" required />
                      </Field>
                      <button formAction={addAddress} className="h-10 rounded-md border border-zinc-300 px-3 py-2 text-sm">Agregar dirección</button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                      <Field label="Dirección 2">
                        <input name="addressLine2" placeholder="Dirección 2" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
                      </Field>
                      <Field label="Ciudad">
                        <input name="city" placeholder="Ciudad" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
                      </Field>
                      <Field label="Estado/Provincia">
                        <input name="stateProvince" placeholder="Estado/Provincia" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
                      </Field>
                      <Field label="CP / Zip">
                        <input name="postalCode" placeholder="CP / Zip" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
                      </Field>
                      <Field label="País">
                        <input name="country" placeholder="País" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
                      </Field>
                      </div>
                    </div>
                  </div>
                )}
              </Field>
            </div>

            <div className="grid gap-3 text-xs md:grid-cols-3">
              <div className="space-y-1 rounded-md border border-zinc-200 p-2">
                <p className="font-semibold text-zinc-600">Correos guardados</p>
                {client.contactEmails.length === 0 && <p className="text-zinc-500">Sin correos adicionales.</p>}
                {client.contactEmails.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-2 py-1">
                    <span>{item.type}: {item.value}</span>
                    <button formAction={removeEmail} name="emailId" value={item.id} className="text-red-600">Quitar</button>
                  </div>
                ))}
              </div>

              <div className="space-y-1 rounded-md border border-zinc-200 p-2">
                <p className="font-semibold text-zinc-600">Teléfonos guardados</p>
                {client.contactPhones.length === 0 && <p className="text-zinc-500">Sin teléfonos adicionales.</p>}
                {client.contactPhones.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-2 py-1">
                    <span>{item.type}: {item.value}</span>
                    <button formAction={removePhone} name="phoneId" value={item.id} className="text-red-600">Quitar</button>
                  </div>
                ))}
              </div>

              <div className="space-y-1 rounded-md border border-zinc-200 p-2">
                <p className="font-semibold text-zinc-600">Direcciones guardadas</p>
                {client.contactAddresses.length === 0 && <p className="text-zinc-500">Sin direcciones adicionales.</p>}
                {client.contactAddresses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-2 py-1">
                    <span>{item.type}: {item.addressLine1}</span>
                    <button formAction={removeAddress} name="addressId" value={item.id} className="text-red-600">Quitar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Datos de trabajo</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Empresa">
                <input name="company" defaultValue={client.company || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="Puesto">
                <input name="jobTitle" defaultValue={client.jobTitle || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="Sitio web">
                <input name="website" defaultValue={client.website || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Redes sociales</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Facebook">
                <input name="facebookProfile" defaultValue={client.facebookProfile || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="Instagram">
                <input name="instagramProfile" defaultValue={client.instagramProfile || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="TikTok">
                <input name="tiktokProfile" defaultValue={client.tiktokProfile || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
              <Field label="LinkedIn">
                <input name="linkedInProfile" defaultValue={client.linkedInProfile || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
              </Field>
            </div>
          </div>

          <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Guardar perfil</button>
        </form>
      </section>
      )}

      {section === "fechas" && (
      <section id="dates" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Fechas importantes</h2>
        <form action={updateImportantDates} className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Fecha de nacimiento">
              <input type="date" name="dateOfBirth" defaultValue={dateInput(client.dateOfBirth)} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </Field>
            <Field label="Aniversario">
              <input type="date" name="anniversary" defaultValue={dateInput(client.anniversary)} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </Field>
          </div>
          <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Guardar fechas</button>
        </form>
      </section>
      )}

      {section === "preferencias" && (
      <section id="preferences" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Preferencias de viaje</h2>
        <form action={updateClientDetails} className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Preferencia de asiento">
              <select name="seatPreference" defaultValue={client.seatPreference || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2">
                <option value="">Seleccionar</option>
                {seatOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Preferencia de cama">
              <select name="bedPreference" defaultValue={client.bedPreference || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2">
                <option value="">Seleccionar</option>
                {bedOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Preferencia de alimentos">
              <input name="mealPreference" defaultValue={client.mealPreference || ""} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-sm font-medium">Preferencia de hotel</p>
              <div className="space-y-1">
                {hotelOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="hotelPreferences" value={option} defaultChecked={hotelPrefs.has(option)} />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Preferencia de estilo</p>
              <div className="space-y-1">
                {vibeOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="vibePreferences" value={option} defaultChecked={vibePrefs.has(option)} />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Preferencia de actividades</p>
              <div className="space-y-1">
                {activityOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="activityPreferences" value={option} defaultChecked={activityPrefs.has(option)} />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Guardar preferencias</button>
        </form>
      </section>
      )}

      {section === "relaciones" && (
      <section id="relationships" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Relaciones</h2>
        <RelationshipForm
          action={addRelationship}
          relationshipOptions={relationshipTypes.map((option) => ({
            value: option,
            label: labelForRelationship(option),
          }))}
          allClients={allClients}
        />

        <div className="mt-3 space-y-2">
          {client.relationships.map((entry) => (
            <form key={entry.id} action={removeRelationship} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <input type="hidden" name="relationshipId" value={entry.id} />
              <span>{labelForRelationship(entry.relationType)} · {entry.relatedClient.firstName} {entry.relatedClient.lastName}</span>
              <button className="text-red-600">Quitar</button>
            </form>
          ))}
        </div>
      </section>
      )}

      {section === "lealtad" && (
      <section id="loyalty" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Programas de lealtad</h2>
        <LoyaltyProgramForm action={addLoyaltyProgram} />

        <div className="mt-3 space-y-2">
          {client.loyaltyPrograms.map((entry) => (
            <form key={entry.id} action={removeLoyaltyProgram} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <input type="hidden" name="loyaltyId" value={entry.id} />
              <span>{entry.category} · {entry.programName} {entry.membershipNumber ? `(${entry.membershipNumber})` : ""}</span>
              <button className="text-red-600">Quitar</button>
            </form>
          ))}
        </div>
      </section>
      )}

      {section === "documentos" && (
      <section id="documents" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Documentos de viaje (PII-safe v1)</h2>
        <p className="mt-1 text-xs text-zinc-500">Números sensibles guardados cifrados (AES-256-GCM). Requiere `PII_ENCRYPTION_KEY`.</p>

        <form action={addTravelDocument} className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Tipo de documento">
            <select name="type" className="w-full rounded-md border border-zinc-300 px-3 py-2">
              <option value="PASSPORT">Pasaporte</option>
              <option value="VISA">Visa</option>
              <option value="TSA_GLOBAL_ENTRY">TSA PreCheck / Global Entry</option>
            </select>
          </Field>
          <Field label="Nombre completo (como aparece)">
            <input name="fullName" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Número de documento">
            <input name="documentNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
          </Field>
          <Field label="País de emisión">
            <input name="countryOfIssue" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Fecha de emisión">
            <input type="date" name="dateOfIssue" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Fecha de vencimiento">
            <input type="date" name="dateOfExpiration" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Sexo">
            <input name="sex" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Lugar de nacimiento">
            <input name="placeOfBirth" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Nacionalidad">
            <input name="nationality" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Ciudadanía">
            <input name="citizenship" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="URL de foto de documento (opcional)" className="md:col-span-2">
            <input name="photoUrl" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <Field label="Archivo de foto (opcional)" className="md:col-span-2">
            <input type="file" name="photo" accept="image/*" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
          <div className="md:col-span-2">
            <button className="rounded-md border border-zinc-300 px-3 py-2">Agregar documento</button>
          </div>
        </form>

        <div className="mt-3 space-y-2">
          {decryptedDocuments.map((document) => (
            <form key={document.id} action={removeTravelDocument} className="rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <input type="hidden" name="documentId" value={document.id} />
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{document.type} · {document.fullName || "-"}</p>
                <button className="text-red-600">Quitar</button>
              </div>
              <p className="text-zinc-600">Número: {document.plainNumber} (últimos 4: {document.numberLast4 || "-"})</p>
              <p className="text-zinc-600">Emisión: {document.countryOfIssue || "-"} · Vence: {dateInput(document.dateOfExpiration) || "-"}</p>
              {document.photoUrl && (
                <a href={document.photoUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">Ver foto</a>
              )}
            </form>
          ))}
        </div>
      </section>
      )}

      {section === "notas" && (
      <section id="notes" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Notas</h2>
        <form action={addCommunication} className="mt-3 space-y-2">
          <Field label="Canal">
            <select name="channel" defaultValue="WhatsApp" className="w-full rounded-md border border-zinc-300 px-3 py-2" required>
              <option value="Llamada telefónica">Llamada telefónica</option>
              <option value="Mensaje de texto (SMS)">Mensaje de texto (SMS)</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Correo electrónico">Correo electrónico</option>
              <option value="Instagram Messenger">Instagram Messenger</option>
              <option value="Facebook Messenger">Facebook Messenger</option>
              <option value="TikTok Messenger">TikTok Messenger</option>
            </select>
          </Field>
          <Field label="Nota">
            <textarea name="note" placeholder="Nota de comunicación" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" required />
          </Field>
          <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Agregar nota</button>
        </form>
        <div className="mt-4 space-y-2 text-sm">
          {client.communicationLogs.map((log) => (
            <article key={log.id} className="rounded-md border border-zinc-200 p-3">
              <p className="flex items-center gap-2 font-medium">
                <span>{log.channel.toLowerCase() === "website" ? "Formulario web" : log.channel}</span>
                {log.channel.toLowerCase() === "website" && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">Origen: formulario web</span>
                )}
              </p>
              <p className="text-zinc-700">{log.note}</p>
              <p className="text-xs text-zinc-500">{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      {section === "tareas" && (
      <section id="tasks" className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Viajes / Tareas</h2>
        <form action={addTask} className="mt-3 space-y-2">
          <Field label="Título de tarea">
            <input name="title" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
          </Field>
          <Field label="Estado">
            <select name="status" className="w-full rounded-md border border-zinc-300 px-3 py-2">
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>
          </Field>
          <Field label="Fecha de vencimiento">
            <input type="date" name="dueDate" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </Field>
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
      )}
        </div>
      </div>
    </div>
  );
}
