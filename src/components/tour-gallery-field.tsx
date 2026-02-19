"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  defaultUrls?: string[];
  defaultCardUrl?: string | null;
  defaultBannerUrl?: string | null;
  lang?: "es" | "en";
};

export function TourGalleryField({ defaultUrls = [], defaultCardUrl, defaultBannerUrl, lang = "es" }: Props) {
  const isEn = lang === "en";
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [urlInput, setUrlInput] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string>(() => {
    if (defaultCardUrl && defaultUrls.includes(defaultCardUrl)) {
      return defaultCardUrl;
    }

    return defaultUrls[0] || "";
  });
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    if (defaultBannerUrl && defaultUrls.includes(defaultBannerUrl)) {
      return defaultBannerUrl;
    }

    if (defaultCardUrl && defaultUrls.includes(defaultCardUrl)) {
      return defaultCardUrl;
    }

    return defaultUrls[0] || "";
  });

  const serialized = useMemo(() => JSON.stringify(urls), [urls]);

  function addUrl(value: string) {
    const next = value.trim();
    if (!next) {
      return;
    }

    setUrls((current) => {
      const isFirst = current.length === 0;
      if (isFirst) {
        setCardUrl(next);
        setBannerUrl(next);
      }

      return [...current, next];
    });
    setUrlInput("");
  }

  function removeAt(index: number) {
    setUrls((current) => {
      const next = current.filter((_, idx) => idx !== index);
      const nextCard = next.includes(cardUrl) ? cardUrl : (next[0] || "");
      const nextBanner = next.includes(bannerUrl) ? bannerUrl : (nextCard || next[0] || "");
      setCardUrl(nextCard);
      setBannerUrl(nextBanner);
      return next;
    });
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= urls.length || to >= urls.length) {
      return;
    }

    setUrls((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadError(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string; details?: string };
        setUploadError(errorData.details || errorData.error || (isEn ? "Upload failed." : "La subida falló."));
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        addUrl(data.url);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <input type="hidden" name="galleryUrls" value={serialized} />
      <input type="hidden" name="cardImageUrl" value={cardUrl} />
      <input type="hidden" name="bannerImageUrl" value={bannerUrl} />

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Cover + Gallery images" : "Portada + galería de imágenes"}</label>
        <p className="text-xs text-zinc-500">
          {isEn
            ? "Use one image list for all types. Select one image for the tour card (1:1), one for the detail banner (16:9), and keep the rest for the gallery."
            : "Usa una sola lista de imágenes. Selecciona una para la tarjeta del tour (1:1), una para el banner del detalle (16:9) y deja las demás para la galería."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder={isEn ? "Cover or gallery image URL" : "URL de imagen de portada o galería"}
          className="min-w-55 flex-1 rounded-md border border-zinc-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={() => addUrl(urlInput)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          {isEn ? "Add image URL" : "Agregar URL de imagen"}
        </button>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          {uploading ? (isEn ? "Uploading..." : "Subiendo...") : (isEn ? "Upload image file" : "Subir archivo de imagen")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {urls.length === 0 ? (
        <p className="text-xs text-zinc-500">{isEn ? "No cover or gallery images yet." : "Aún no hay imágenes de portada o galería."}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => setDraggingIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setDropIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draggingIndex !== null) {
                  moveItem(draggingIndex, index);
                }
                setDraggingIndex(null);
                setDropIndex(null);
              }}
              onDragEnd={() => {
                setDraggingIndex(null);
                setDropIndex(null);
              }}
              className={`rounded-md border p-2 ${dropIndex === index ? "border-sky-400 bg-sky-50" : "border-zinc-200 bg-white"}`}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                <span className="cursor-grab">⋮⋮ {index + 1}</span>
                <button type="button" className="text-red-600 hover:text-red-700" onClick={() => removeAt(index)}>
                  {isEn ? "Remove" : "Quitar"}
                </button>
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded border border-zinc-100 bg-zinc-50">
                <Image src={url} alt={`gallery-${index + 1}`} fill sizes="240px" unoptimized className="object-cover" />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCardUrl(url)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    cardUrl === url
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {cardUrl === url ? (isEn ? "Card selected" : "Tarjeta seleccionada") : (isEn ? "Set as card" : "Usar como tarjeta")}
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUrl(url)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    bannerUrl === url
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {bannerUrl === url ? (isEn ? "Banner selected" : "Banner seleccionado") : (isEn ? "Set as banner" : "Usar como banner")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
