"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  lang: "es" | "en";
};

export function TourDetailGallery({ images, lang }: Props) {
  const [index, setIndex] = useState(0);
  const isEn = lang === "en";

  if (!images.length) {
    return null;
  }

  const hasMany = images.length > 1;

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{isEn ? "Photo gallery" : "Galería de fotos"}</h2>
        <p className="text-sm text-slate-500">
          {index + 1}/{images.length}
        </p>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <Image src={images[index]} alt={`gallery-${index + 1}`} fill sizes="100vw" unoptimized className="object-cover" />
      </div>

      {hasMany && (
        <>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
            >
              {isEn ? "Previous" : "Anterior"}
            </button>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setIndex((current) => (current + 1) % images.length)}
            >
              {isEn ? "Next" : "Siguiente"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-6">
            {images.map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className={`relative aspect-square overflow-hidden rounded-md border ${index === imageIndex ? "border-sky-500" : "border-slate-200"}`}
              >
                <Image src={image} alt={`thumb-${imageIndex + 1}`} fill sizes="120px" unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
