"use client";

import { useEffect, useMemo, useState } from "react";

const loyaltyProgramsByCategory = {
  HOTEL: [
    "Marriott Bonvoy",
    "Hilton Honors",
    "World of Hyatt",
    "IHG One Rewards",
    "Accor ALL",
    "Wyndham Rewards",
    "Best Western Rewards",
    "Choice Privileges",
    "Radisson Rewards",
    "NH Rewards",
    "Fiesta Rewards",
    "City Premios",
    "Grupo Xcaret benefits",
  ],
  AIRLINE: [
    "Club Premier",
    "VClub",
    "VivaFan",
    "AAdvantage",
    "MileagePlus",
    "SkyMiles",
    "Avios",
    "Flying Blue",
    "Alaska Mileage Plan",
    "KrisFlyer",
    "Miles & More",
    "Qantas Frequent Flyer",
    "ANA Mileage Club",
  ],
  CRUISE: [
    "Captain’s Club",
    "Crown & Anchor Society",
    "Latitudes Rewards",
    "Mariner Society",
    "Ambassador / Latitudes",
    "Loyalty Club",
    "VIFP Club",
    "Silversea Captain’s Club",
    "Windstar Star Plus",
    "Seabourn Club",
  ],
  CAR_RENTAL: [
    "Hertz Gold Plus Rewards",
    "Avis Preferred",
    "Enterprise Plus",
    "National Emerald Club",
    "Sixt Loyalty",
    "Dollar Express / Thrifty Rewards",
    "Europcar Privilege Club",
    "Alamo Insiders",
    "Mex Rent a Car",
  ],
  RAIL_BUS: [
    "Amtrak Guest Rewards",
    "Eurail/Interrail",
    "VIA Rail points",
    "National railcard programs",
    "FlixBus / BlaBlaCar",
  ],
} as const;

type LoyaltyCategory = keyof typeof loyaltyProgramsByCategory;

const categoryOptions: Array<{ value: LoyaltyCategory; label: string }> = [
  { value: "HOTEL", label: "Hoteles" },
  { value: "AIRLINE", label: "Aerolíneas" },
  { value: "CRUISE", label: "Cruceros" },
  { value: "CAR_RENTAL", label: "Renta de autos" },
  { value: "RAIL_BUS", label: "Tren y autobús" },
];

type Props = {
  action: (formData: FormData) => void | Promise<void>;
};

export function LoyaltyProgramForm({ action }: Props) {
  const [category, setCategory] = useState<LoyaltyCategory>("HOTEL");
  const programs = useMemo(() => loyaltyProgramsByCategory[category], [category]);
  const [programName, setProgramName] = useState<string>(loyaltyProgramsByCategory.HOTEL[0] || "");

  useEffect(() => {
    setProgramName(programs[0] || "");
  }, [programs]);

  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-3">
      <label className="space-y-1 text-sm">
        <span className="block text-zinc-700">Categoría</span>
        <select
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value as LoyaltyCategory)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="block text-zinc-700">Nombre del programa</span>
        <select
          name="programName"
          value={programName}
          onChange={(event) => setProgramName(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          required
        >
          {programs.map((program) => (
            <option key={program} value={program}>
              {program}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="block text-zinc-700">Número de membresía</span>
        <input name="membershipNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
      </label>

      <div className="md:col-span-3">
        <button className="rounded-md border border-zinc-300 px-3 py-2">Agregar programa</button>
      </div>
    </form>
  );
}