"use client";

import { useRouter } from "next/navigation";

type ClientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type RelationshipOption = {
  value: string;
  label: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  relationshipOptions: RelationshipOption[];
  allClients: ClientOption[];
};

export function RelationshipForm({ action, relationshipOptions, allClients }: Props) {
  const router = useRouter();

  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-3">
      <label className="space-y-1 text-sm">
        <span className="block text-zinc-700">Tipo de relación</span>
        <select name="relationType" className="w-full rounded-md border border-zinc-300 px-3 py-2">
          {relationshipOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="block text-zinc-700">Cliente relacionado</span>
        <select
          name="relatedClientId"
          defaultValue={allClients[0]?.id || "__new__"}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          onChange={(event) => {
            if (event.target.value === "__new__") {
              router.push("/admin/crm/clientes?showForm=1");
            }
          }}
        >
          <option value="__new__">+ Agregar nuevo cliente</option>
          {allClients.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.firstName} {entry.lastName}
            </option>
          ))}
        </select>
      </label>

      <button className="self-end rounded-md border border-zinc-300 px-3 py-2">Agregar relación</button>
    </form>
  );
}