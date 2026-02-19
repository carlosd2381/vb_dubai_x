"use client";

import { useMemo, useState } from "react";

type Props = {
  defaultValue?: string;
  maxLength: number;
  lang?: "es" | "en";
};

export function TourShortDescriptionField({ defaultValue = "", maxLength, lang = "es" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const isEn = lang === "en";

  const currentLength = useMemo(() => value.length, [value]);
  const counterColorClass =
    currentLength >= maxLength
      ? "text-red-600"
      : currentLength >= maxLength - 20
        ? "text-amber-600"
        : "text-zinc-500";

  return (
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Short description *" : "Descripción corta *"}</label>
      <input
        name="shortDescription"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={isEn ? "Short description" : "Descripción corta"}
        maxLength={maxLength}
        title={isEn ? "Enter a short description for the tour card" : "Ingresa una descripción corta para la tarjeta del tour"}
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
        required
      />
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
        <p>{isEn ? `Required field. Maximum ${maxLength} characters (used in cards).` : `Campo obligatorio. Máximo ${maxLength} caracteres (texto usado en tarjetas).`}</p>
        <p className={counterColorClass}>
          {currentLength}/{maxLength}
        </p>
      </div>
    </div>
  );
}