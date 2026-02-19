"use client";

import { useState } from "react";
import { dictionary, type Lang } from "@/lib/lang";
import { serviceTypeOptions } from "@/lib/lead-fields";

type Props = {
  lang: Lang;
};

export function ContactForm({ lang }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = dictionary[lang].contact;

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setLoading(true);

        const payload = {
          firstName: String(formData.get("firstName") || ""),
          lastName: String(formData.get("lastName") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          destination: String(formData.get("destination") || ""),
          travelDate: String(formData.get("travelDate") || ""),
          travelersInfo: String(formData.get("travelersInfo") || ""),
          serviceTypes: formData.getAll("serviceTypes").map((value) => String(value)),
          preferences: String(formData.get("preferences") || ""),
          additionalComments: String(formData.get("additionalComments") || ""),
        };

        const response = await fetch("/api/contact", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        setLoading(false);

        if (response.ok) {
          form.reset();
          setSent(true);
        }
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input name="firstName" placeholder="Nombre" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none" required />
        <input name="lastName" placeholder="Apellido" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none" required />
        <input type="email" name="email" placeholder="Correo electrónico" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none md:col-span-2" required />
        <input name="phone" placeholder="Teléfono" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none md:col-span-2" />
        <input name="destination" placeholder="Destino" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none md:col-span-2" />
        <input type="date" name="travelDate" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none md:col-span-2" />
        <input name="travelersInfo" placeholder="Número de viajeros" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none md:col-span-2" />
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

      <input name="preferences" placeholder="Preferencias" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none" />
      <p className="-mt-1 text-xs text-zinc-500">Hoteles, Aerolíneas/Vuelos</p>

      <textarea name="additionalComments" placeholder="Comentarios adicionales" className="min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-sky-500 focus:bg-white focus:outline-none" />
      <button disabled={loading} className="rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:opacity-60">
        {loading ? "..." : t.send}
      </button>
      {sent && <p className="text-sm text-emerald-700">{t.sent}</p>}
    </form>
  );
}
